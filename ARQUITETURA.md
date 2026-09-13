# TERMinal — arquitetura

## Estrutura

```
termo/
├── ARQUITETURA.md          este documento
├── index.html              estrutura das quatro telas
├── css/
│   ├── base.css            variáveis de tema, reset, tipografia, efeito CRT
│   ├── layout.css          barra, colunas, painel, pontos de quebra
│   ├── components.css      célula, tecla, botão, registro, legenda
│   └── modals.css          login, relatório, confirmação
└── js/
    ├── core/               regras — nenhuma linha toca o DOM
    │   ├── config.js       constantes e textos da interface
    │   ├── utils.js        funções puras
    │   ├── dictionary.js   duas listas: respostas e palavras aceitas
    │   ├── engine.js       avaliação da tentativa e sorteio
    │   └── state.js        jogador, partida, percurso e estatísticas
    ├── ui/                 apresentação — só desenha
    │   ├── board.js        grade
    │   ├── keyboard.js     teclado virtual
    │   ├── log.js          painel de registro
    │   └── modals.js       janelas sobrepostas
    ├── solver.js           aberturas fixas e entropia de Shannon
    └── app.js              orquestração e eventos
```

## Separação em camadas

A divisão principal é entre **core** e **ui**.

Nenhum arquivo em `core/` referencia `document`, `window.addEventListener` ou
qualquer elemento de tela. Isso significa que as regras do jogo podem ser
executadas e testadas fora do navegador — foi assim que o algoritmo de avaliação
e o ciclo de sequência foram verificados durante o desenvolvimento.

Nenhum arquivo em `ui/` decide regra. `board.js` não sabe o que torna uma letra
correta; recebe um array de estados pronto e desenha. `keyboard.js` não decide a
precedência entre estados; delega a `engine.melhorEstado`.

`app.js` é o único módulo que conhece todos os outros. Ele recebe a entrada,
consulta o core e manda a ui desenhar.

## Fluxo de uma tentativa

```
tecla pressionada
      │
      ▼
app.tratarTecla ──────────► partida.digitar / mover       (core/state)
      │                            │
      │                            ▼
      │                     board.desenharEntrada          (ui)
      ▼
app.submeterTentativa
      │
      ├─► dictionary.existe                                (core)
      │        └── rejeitada ──► board.recusar + log.erro  (ui)
      │
      ├─► engine.avaliar                                   (core)
      │
      ├─► partida.resultados / percurso.registrarTentativa (core/state)
      │
      ├─► board.revelar ──► keyboard.atualizarLetra        (ui)
      ├─► log.tentativa                                    (ui)
      │
      └─► encerra ou avança linha
               └─► estatisticas.registrar                  (core/state)
                   modals.abrirRelatorio                   (ui)
```

## Fluxo do solucionador

```
solver.executar
      │
      ├─► partida.iniciar        mesma palavra, grade limpa   (core/state)
      ├─► partida.contabilizada = true   ─┐ tiram a partida do
      ├─► percurso.descartar             ─┘ registro do jogador
      │
      ▼
solver.jogar  ◄──────────────────────────┐
      │                                  │
      ├─► filtrarCandidatas              │ enquanto restar
      ├─► proximaTentativa               │ linha e a partida
      │      ├── turnos 1-3: abertura    │ não encerrar
      │      └── turnos 4-6: entropia    │
      │                                  │
      ├─► partida.digitar × 5            │
      ├─► app.submeterTentativa ─────────┤ mesmo caminho do
      │        (avalia, revela, registra)│ jogador humano
      │                                  │
      └─► agendar próximo passo ─────────┘
```

## Decisões que valem explicação

**Namespace global em vez de módulos ES.** Todos os arquivos são funções
imediatamente invocadas que anexam ao objeto `window.TERM`. A alternativa seria
`import`/`export`, mas módulos ES não carregam pelo protocolo `file://` — o
navegador bloqueia por política de origem. Como um dos requisitos é executar sem
instalação nem servidor, o namespace foi a escolha. Para migrar: trocar cada
IIFE por `export`, os acessos `TERM.x` por `import`, e servir por HTTP.

A ordem das tags `<script>` no `index.html` é obrigatória e está comentada lá:
`config.js` cria o namespace, `app.js` fecha a cadeia.

**Persistência isolada em dois métodos.** `estatisticas.carregar` e
`estatisticas.salvar` são os únicos pontos que tocariam armazenamento. Para
gravar entre sessões basta trocar o corpo deles por `localStorage`; nenhum outro
arquivo muda.

**Textos centralizados em `config.js`.** Mensagens de erro, ajuda e encerramento
não estão espalhadas pelo código. Ajuste de redação acontece em um lugar só.

**Duas listas de palavras, não uma.** `solucoes` é o que o baralho sorteia;
`validas` é o que o jogo aceita quando alguém digita. Os dois papéis têm
exigências opostas e uma lista só não atende às duas: encolhida, recusa
português legítimo — `FAZER`, `QUERO`, `TENHO`, `CASAS` —, e o jogo parece
quebrado; ampliada, sorteia palavra que ninguém conhece, e o jogo parece injusto.

A proporção não é detalhe: 10.589 palavras aceitas para 1.469 respostas. A maior
parte do que vale digitar não vale como resposta — sobretudo conjugações e
plurais, que o jogador digita o tempo todo e que fazem respostas mornas.

Toda solução é também um chute válido; o contrário não. `PODAM` e `FUZIL`
existem apenas em `validas`: são aberturas do solucionador, nunca respostas.

**Cursor explícito na linha em edição.** A linha corrente é um vetor de
posições com um índice de cursor, e não um texto que só cresce no fim. É o que
permite cravar uma letra numa coluna já deduzida: as setas e o clique na célula
movem o cursor, e `partida.digitar` escreve onde ele estiver.

Ao digitar, o cursor **salta para a próxima lacuna à direita** em vez de andar
uma casa. Sem esse salto, quem já fixou as duas últimas letras e volta a
preencher pela esquerda passaria por cima delas. Sem lacuna à frente, o cursor
fica onde está e a linha está pronta para envio.

`apagar` limpa a posição sob o cursor; se ali já estava vazio, recua e limpa a
anterior. Digitando da esquerda para a direita, o efeito é o de um backspace
comum — a navegação não custa nada a quem não a usa.

**O tempo da rodada corre sozinho; o mostrador é que precisa de intervalo.**
`percurso` guarda apenas o instante de início e calcula a duração no momento da
leitura. Por isso o tempo nunca depende de alguém o incrementar, e abrir ou
fechar o relatório não o altera.

O que congelava era só a exibição, escrita uma única vez na abertura. Enquanto a
janela está aberta e a partida em andamento, `modals` reescreve `#rel-tempo` a
cada `INTERVALO_CRONOMETRO`. O intervalo nasce em `abrirRelatorio` e morre em
`fecharRelatorio` — por onde passam os quatro caminhos de fechamento — e se
desliga sozinho se a partida terminar com a janela aberta. Quem decide se ainda
há o que acompanhar é o core, por `percurso.emAndamento`.

**Medidas em variáveis CSS.** O tamanho da célula e da tecla é `--celula` e
`--tecla-largura`. Os pontos de quebra redefinem essas variáveis em vez de
reescrever as regras dos componentes.

## Avaliação da tentativa

A função `engine.avaliar` é o núcleo do jogo e faz duas passagens.

A primeira marca apenas os acertos de posição e devolve a um estoque as letras da
solução que não coincidiram. A segunda percorre o restante e só marca presença
enquanto houver estoque daquela letra.

Sem essa separação, uma tentativa com a letra repetida mais vezes do que a
solução acende marcações demais. `ARARA` contra `RAPAZ` deve marcar apenas 2 dos
3 A e 1 dos 2 R — a implementação ingênua marcaria todos.

## O solucionador

Duas fases, com lógicas distintas.

**Fase 1, tentativas 1 a 3: aberturas fixas.** `TRENS`, `PODAM`, `FUZIL` são
jogadas sempre, nesta ordem, sem olhar o resultado das anteriores — no começo
todas as palavras são igualmente possíveis e não há informação a que reagir. Elas
valem pelo conjunto, não uma a uma: cobrem 15 letras distintas sem sobreposição
(`A D E F I L M N O P R S T U Z`). Isoladamente nenhuma é boa — `FUZIL` está
entre as piores aberturas possíveis.

**Fase 2, tentativas 4 a 6: entropia de Shannon.** Para cada chute do dicionário,
agrupa-se o que restou pelo retorno que aquele chute produziria, e mede-se

    H = -Σ p(retorno) · log₂ p(retorno)

O maior H é o chute que separa as candidatas da forma mais equilibrada. Duas
regras acompanham: com duas candidatas ou menos não se calcula nada, joga-se a
primeira; e no empate prefere-se a palavra que ainda pode ser a resposta.

**Por que o melhor chute às vezes não pode vencer.** Restando `JUSTO`, `BUSTO`,
`SUSTO` e `CUSTO`, uma palavra como `ABACA` nunca é a resposta, mas testa `B` e
`C` de uma vez e separa as quatro. Chutar `JUSTO` teria chance de acertar e, ao
errar, deixaria três indistinguíveis com dois chutes. Abrir mão de ganhar agora é
o que garante não perder depois — medido, a alternativa gulosa perde palavras que
a entropia resolve.

**O solucionador não tem lógica de avaliação própria.** Ele usa `engine.avaliar`,
a mesma função que julga a tentativa do jogador, e `filtrarCandidatas` apenas
reavalia cada palavra e compara com o retorno observado. Como `avaliar` é exata,
o filtro nunca descarta a solução verdadeira.

> Cuidado ao reescrever esse filtro. Uma versão posicional, que trate cada coluna
> isoladamente sem contar letras, parece equivalente e não é: quando a mesma
> letra sai amarela numa posição e cinza noutra — o que acontece sempre que o
> chute tem letra repetida em excesso — ela passa a exigir `letra ∈ palavra` e
> `letra ∉ palavra` ao mesmo tempo, e a lista zera. Medido, esse erro descartaria
> a solução correta em 6.945 dos 37.823 casos com chute de letra repetida.

**Desempenho medido** sobre as 1.469 respostas: 100% resolvidas, média de 4,20
tentativas; uma única palavra consome os 6 chutes. As difíceis quase sempre
contêm alguma das 11 letras que as aberturas não testam
(`B C G H J K Q V W X Y`) — `SUSTO` é o caso extremo, porque sobrevivem a elas
`JUSTO`, `BUSTO`, `CUSTO` e `SUSTO`, que diferem só na primeira letra.

O solucionador trabalha com os dois universos: chuta de `validas` e filtra sobre
`solucoes`. É isso que lhe permite jogar uma palavra que não pode vencer só para
separar as candidatas.

## A partida da máquina não conta

`partida.contabilizada = true` faz `estatisticas.registrar` sair na primeira
linha, e `percurso.descartar` anula `registrarTentativa` e `encerrar`. Os dois
mecanismos já existiam; o solucionador apenas os aciona.

A ordem importa: `partida.iniciar` zera `contabilizada`, então a marcação tem de
vir **depois** da reinicialização, ou a partida da máquina entra nas estatísticas
do jogador — o oposto do que a janela de confirmação promete.

Enquanto `solver.emExecucao` é verdadeiro, `tratarTecla`, `tratarCliqueCelula`,
`novaPartida` e `consultarRelatorio` retornam de imediato. Sem essas travas o
jogador digitaria na linha que a máquina está montando, e um ENTER submeteria um
chute que o histórico do solucionador nunca veria. `Esc` interrompe.
