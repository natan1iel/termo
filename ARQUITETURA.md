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
    │   ├── dictionary.js   banco de palavras e validação
    │   ├── engine.js       avaliação da tentativa e sorteio
    │   └── state.js        jogador, partida, percurso e estatísticas
    ├── ui/                 apresentação — só desenha
    │   ├── board.js        grade
    │   ├── keyboard.js     teclado virtual
    │   ├── log.js          painel de registro
    │   └── modals.js       janelas sobrepostas
    ├── solver.js           resolução algorítmica (a implementar)
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

## O que falta implementar

`solver.js` contém o contrato, a função de filtragem de candidatas já pronta e o
ponto de entrada `executar()`. A interface de acionamento e confirmação está
completa e já chama essa função. Falta a estratégia de escolha e o laço de
execução.

Partida resolvida pelo algoritmo não deve entrar nas estatísticas do jogador nem
no percurso humano — o descarte já está implementado em `solver.executar`.
