/* ============================================================
   core/state.js
   Partida corrente, percurso e estatísticas. Sem DOM — a
   interface lê daqui e nunca guarda estado próprio.
   ============================================================ */
(function (TERM) {
  "use strict";

  var cfg = TERM.config;

  /* ---------- Jogador ---------- */

  TERM.jogador = {
    nome: cfg.NOME_PADRAO,

    definir: function (nome) {
      var limpo = TERM.utils.limparNome(nome, cfg.TAMANHO_MAXIMO_NOME);
      this.nome = limpo || cfg.NOME_PADRAO;
      return this.nome;
    }
  };

  /* ---------- Partida corrente ---------- */

  TERM.partida = {
    solucao: "",          // com acento, exibida ao revelar
    solucaoNormalizada: "",
    linha: 0,
    letras: [],           // uma posição por coluna, "" onde não há letra
    cursor: 0,            // coluna em edição
    encerrada: false,
    contabilizada: false, // impede contagem dupla do mesmo resultado
    rodada: 0,
    resultados: [],       // um array de estados por tentativa
    estadosTeclado: {},

    iniciar: function (solucao, rodada) {
      this.solucao = solucao;
      this.solucaoNormalizada = TERM.utils.normalizar(solucao);
      this.linha = 0;
      this.limparLinha();
      this.encerrada = false;
      this.contabilizada = false;
      this.rodada = rodada;
      this.resultados = [];
      this.estadosTeclado = {};
    },

    /* ---------- Linha em edição ----------
       Vetor de posições, não um texto que só cresce no fim: é
       o que permite cravar uma letra numa coluna conhecida e
       preencher o resto depois. */

    limparLinha: function () {
      this.letras = new Array(cfg.COLUNAS).fill("");
      this.cursor = 0;
    },

    /* Só faz sentido com a linha completa; confira antes. */
    texto: function () {
      return this.letras.join("");
    },

    lacunas: function () {
      return this.letras.filter(function (letra) {
        return letra === "";
      }).length;
    },

    completa: function () {
      return this.lacunas() === 0;
    },

    /* Primeira posição livre a partir de uma coluna, ou -1. */
    proximaLacuna: function (partindoDe) {
      for (var c = partindoDe; c < cfg.COLUNAS; c++) {
        if (this.letras[c] === "") return c;
      }
      return -1;
    },

    /* Salta para a próxima lacuna em vez de andar uma casa,
       para não passar por cima de letras já cravadas. */
    digitar: function (letra) {
      this.letras[this.cursor] = letra;
      var proxima = this.proximaLacuna(this.cursor + 1);
      if (proxima !== -1) this.cursor = proxima;
      return true;
    },

    /* Apaga sob o cursor; se já estava vazio, recua e apaga a
       anterior — igual a um backspace comum. */
    apagar: function () {
      if (this.letras[this.cursor] !== "") {
        this.letras[this.cursor] = "";
        return true;
      }
      if (this.cursor === 0) return false;
      this.cursor--;
      this.letras[this.cursor] = "";
      return true;
    },

    /* Navegação. Ambas param nas bordas, sem dar a volta. */
    mover: function (passo) {
      return this.irPara(this.cursor + passo);
    },

    irPara: function (coluna) {
      if (coluna < 0 || coluna >= cfg.COLUNAS) return false;
      this.cursor = coluna;
      return true;
    },

    tentativasRestantes: function () {
      return cfg.LINHAS - this.linha - 1;
    },

    ehUltimaLinha: function () {
      return this.linha === cfg.LINHAS - 1;
    },

    avancarLinha: function () {
      this.linha++;
      this.limparLinha();
    }
  };

  /* ---------- Percurso ----------
     Cada tentativa com o retorno que produziu e o tempo até
     ali — é o que alimenta a análise de dificuldade. */

  TERM.percurso = {
    atual: null,
    historico: [],

    iniciar: function (jogador, solucao) {
      this.atual = {
        jogador: jogador,
        palavra: solucao,
        inicio: Date.now(),
        fim: null,
        duracaoMs: null,
        venceu: false,
        tentativas: []
      };
    },

    registrarTentativa: function (palavra, resultado) {
      if (!this.atual) return;
      this.atual.tentativas.push({
        palavra: palavra,
        resultado: resultado.slice(),
        msDecorridos: Date.now() - this.atual.inicio
      });
    },

    /* A interface consulta para saber se o tempo ainda muda. */
    emAndamento: function () {
      return !!(this.atual && !this.atual.fim);
    },

    /* Encerrada usa o valor final; em andamento, o tempo até agora. */
    duracao: function () {
      if (!this.atual) return null;
      return this.atual.fim
        ? this.atual.duracaoMs
        : Date.now() - this.atual.inicio;
    },

    encerrar: function (venceu) {
      if (!this.atual) return null;
      this.atual.fim = Date.now();
      this.atual.duracaoMs = this.atual.fim - this.atual.inicio;
      this.atual.venceu = venceu;
      this.historico.push(this.atual);
      return this.atual.duracaoMs;
    },

    /* Partida do solucionador não entra no percurso humano. */
    descartar: function () {
      this.atual = null;
    }
  };

  /* ---------- Estatísticas ---------- */

  /* O acesso à própria propriedade localStorage pode lançar —
     Safari sob file://, dados de site bloqueados —, então nem
     obter a referência é seguro fora de um try. */
  function armazenamento() {
    try {
      return window.localStorage || null;
    } catch (erro) {
      return null;
    }
  }

  function registroVazio(nome) {
    return {
      nome: nome || cfg.NOME_PADRAO,
      jogos: 0,
      vitorias: 0,
      derrotas: 0,
      abandonos: 0,
      sequencia: 0,            // vitórias seguidas na série corrente
      recorde: 0,
      zerarNaProxima: false,
      tentativas: new Array(cfg.LINHAS).fill(0),  // vitórias por nº de chutes
      duracoes: [],            // das vitórias, em segundos
      melhorTempoS: null,
      ultimoJogo: null
    };
  }

  function inteiro(valor) {
    var n = Math.floor(Number(valor));
    return isFinite(n) && n > 0 ? n : 0;
  }

  /* Registro corrompido faria registrar() lançar depois de a
     partida já estar encerrada — e como o dado mora no
     armazenamento, recarregar não recuperaria. Toda leitura
     passa por aqui. */
  function normalizarRegistro(bruto, nome) {
    var limpo = registroVazio(nome);
    if (!bruto || typeof bruto !== "object") return limpo;

    if (typeof bruto.nome === "string" && bruto.nome) limpo.nome = bruto.nome;
    limpo.jogos = inteiro(bruto.jogos);
    limpo.vitorias = inteiro(bruto.vitorias);
    limpo.derrotas = inteiro(bruto.derrotas);
    limpo.abandonos = inteiro(bruto.abandonos);
    limpo.sequencia = inteiro(bruto.sequencia);
    limpo.recorde = inteiro(bruto.recorde);
    limpo.zerarNaProxima = bruto.zerarNaProxima === true;
    limpo.ultimoJogo = inteiro(bruto.ultimoJogo) || null;

    if (Array.isArray(bruto.tentativas)) {
      for (var i = 0; i < cfg.LINHAS; i++) {
        limpo.tentativas[i] = inteiro(bruto.tentativas[i]);
      }
    }
    if (Array.isArray(bruto.duracoes)) {
      limpo.duracoes = bruto.duracoes.map(inteiro).filter(function (s) {
        return s > 0;
      });
    }
    limpo.melhorTempoS = inteiro(bruto.melhorTempoS) || null;
    return limpo;
  }

  /* O prefixo evita que um jogador chamado __proto__ escreva no
     protótipo do mapa em vez de criar uma entrada. */
  function chaveDe(nome) {
    return "j:" + TERM.utils.normalizar(nome);
  }

  function mediana(lista) {
    if (!lista.length) return null;
    var ordenada = lista.slice().sort(function (a, b) { return a - b; });
    var meio = ordenada.length >> 1;
    return ordenada.length % 2
      ? ordenada[meio]
      : (ordenada[meio - 1] + ordenada[meio]) / 2;
  }

  TERM.estatisticas = {
    dados: null,        // aponta para o registro do jogador corrente
    jogadores: {},
    chave: null,

    init: function () {
      this.jogadores = this.carregar();
      this.dados = registroVazio();   // nunca null: há leitores antes do login
      this.chave = null;
      return this;
    },

    /* Únicos dois pontos que tocam armazenamento. */
    carregar: function () {
      var ls = armazenamento();
      if (!ls) return {};

      var bruto;
      try {
        bruto = JSON.parse(ls.getItem(cfg.ARMAZENAMENTO_CHAVE));
      } catch (erro) {
        return {};
      }
      if (!bruto || typeof bruto !== "object" || Array.isArray(bruto) ||
          bruto.versao !== 1 || !bruto.jogadores ||
          typeof bruto.jogadores !== "object") {
        return {};
      }

      var limpos = {};
      for (var chave in bruto.jogadores) {
        if (!Object.prototype.hasOwnProperty.call(bruto.jogadores, chave)) continue;
        limpos[chave] = normalizarRegistro(bruto.jogadores[chave]);
      }
      return limpos;
    },

    /* Relê e encaixa só o registro corrente: duas abas abertas
       não podem apagar as linhas uma da outra. Falha de escrita
       morre aqui — a partida não quebra por cota estourada. */
    salvar: function () {
      var ls = armazenamento();
      if (!ls || !this.chave) return;

      var todos = this.carregar();
      todos[this.chave] = this.dados;
      this.jogadores = todos;

      try {
        ls.setItem(cfg.ARMAZENAMENTO_CHAVE,
                   JSON.stringify({ versao: 1, jogadores: todos }));
      } catch (erro) {
        /* sem espaço ou sem permissão: segue a partida sem persistir */
      }
    },

    /* Precisa rodar antes de novaPartida, senão o reset pendente
       de quem sai cai no registro de quem entra. */
    entrar: function (nome) {
      /* Sobrepõe o disco ao que já está em memória, em vez de
         substituir: sem armazenamento, carregar() devolve vazio
         e trocar de jogador apagaria todos os outros. */
      var doDisco = this.carregar();
      for (var k in doDisco) {
        if (Object.prototype.hasOwnProperty.call(doDisco, k)) {
          this.jogadores[k] = doDisco[k];
        }
      }

      this.chave = chaveDe(nome);

      var registro =
        Object.prototype.hasOwnProperty.call(this.jogadores, this.chave)
          ? this.jogadores[this.chave]
          : registroVazio(nome);

      registro.nome = nome;           // a grafia mais recente vence
      this.dados = registro;
      this.jogadores[this.chave] = registro;
      return registro;
    },

    registrar: function (venceu, duracaoMs, tentativas) {
      if (TERM.partida.contabilizada) return;
      TERM.partida.contabilizada = true;

      var d = this.dados;
      d.jogos++;
      d.ultimoJogo = Date.now();

      if (venceu) {
        d.vitorias++;
        d.sequencia++;
        if (d.sequencia > d.recorde) d.recorde = d.sequencia;

        /* A derrota chama sem o terceiro argumento; nunca indexar
           com undefined. */
        var indice = Number(tentativas) - 1;
        if (indice >= 0 && indice < d.tentativas.length) d.tentativas[indice]++;

        /* Piso de 1s: arredondar para zero descartaria a
           duração de uma vitória relâmpago em silêncio. */
        var segundos = Math.max(1, Math.round(Number(duracaoMs) / 1000));
        if (isFinite(segundos)) {
          d.duracoes.push(segundos);
          if (d.melhorTempoS === null || segundos < d.melhorTempoS) {
            d.melhorTempoS = segundos;
          }
        }
      } else {
        d.derrotas++;
        d.zerarNaProxima = true;
      }

      this.salvar();
    },

    /* Partida largada no meio conta derrota. Sem isso, com o
       ranking ordenado por média de tentativas, desistir de uma
       partida ruim seria a jogada ótima. */
    registrarAbandono: function () {
      if (TERM.partida.contabilizada) return false;
      this.dados.abandonos++;
      this.registrar(false, 0);
      return true;
    },

    aplicarResetPendente: function () {
      if (!this.dados || !this.dados.zerarNaProxima) return;
      this.dados.sequencia = 0;
      this.dados.zerarNaProxima = false;
      this.salvar();
    },

    /* Quem perdeu e trocou de jogador deixa o reset pendente
       parado no registro; a sequência exibida seria fantasma. */
    sequenciaEfetiva: function (registro) {
      return registro.zerarNaProxima ? 0 : registro.sequencia;
    },

    /* Lista pronta para desenhar. Ordenar é regra, por isso mora
       aqui e não na camada de interface.

       A pontuação é a média de tentativas gastas por partida,
       com a derrota custando uma a mais que o máximo, amortecida
       contra a referência do grupo. Duas consequências:

       - derrota pesa. Sem isso, quem vence pouco mas vence bem
         lidera: 5 vitórias em 45 partidas davam o 1º lugar.
       - amostra pequena não lidera por sorte. Cada jogador
         carrega RANKING_PESO partidas valendo a referência, que
         vão perdendo peso conforme ele joga. É gradual, e
         dispensa excluir ninguém da lista por mínimo de jogos. */
    ranking: function (peso) {
      var pesoRef = peso === undefined ? cfg.RANKING_PESO : peso;
      var penalidade = cfg.LINHAS + 1;   // não achou em 6: gastou 7
      var self = this;
      var linhas = [];
      var somaGrupo = 0, jogosGrupo = 0;

      for (var chave in this.jogadores) {
        if (!Object.prototype.hasOwnProperty.call(this.jogadores, chave)) continue;
        var r = this.jogadores[chave];
        if (!r.jogos) continue;

        var somaVitorias = 0;
        for (var i = 0; i < r.tentativas.length; i++) {
          somaVitorias += (i + 1) * r.tentativas[i];
        }
        var gasto = somaVitorias + penalidade * r.derrotas;
        somaGrupo += gasto;
        jogosGrupo += r.jogos;

        linhas.push({
          chave: chave,
          nome: r.nome,
          jogos: r.jogos,
          vitorias: r.vitorias,
          derrotas: r.derrotas,
          abandonos: r.abandonos,
          gasto: gasto,
          taxa: r.vitorias / r.jogos,
          media: r.vitorias ? somaVitorias / r.vitorias : null,
          medianaS: mediana(r.duracoes),
          melhorTempoS: r.melhorTempoS,
          sequencia: self.sequenciaEfetiva(r),
          recorde: r.recorde
        });
      }

      /* A referência é o desempenho do próprio grupo, então a
         régua se calibra sozinha em vez de ser um número fixo. */
      var referencia = jogosGrupo ? somaGrupo / jogosGrupo : penalidade;

      linhas.forEach(function (l) {
        l.pontos = (l.gasto + pesoRef * referencia) / (l.jogos + pesoRef);
      });

      linhas.sort(function (a, b) {
        return a.pontos - b.pontos || b.taxa - a.taxa || b.jogos - a.jogos;
      });

      return {
        referencia: referencia,
        penalidade: penalidade,
        peso: pesoRef,
        linhas: linhas
      };
    },

    limpar: function () {
      this.jogadores = {};
      if (this.chave) {
        this.dados = registroVazio(this.dados.nome);
        this.jogadores[this.chave] = this.dados;
      }
      var ls = armazenamento();
      if (!ls) return;
      try {
        ls.removeItem(cfg.ARMAZENAMENTO_CHAVE);
      } catch (erro) {
        /* nada a fazer: já foi limpo em memória */
      }
    }
  };

})(window.TERM);
