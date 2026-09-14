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

  var VAZIAS = {
    jogos: 0,
    vitorias: 0,        // total absoluto, usado em médias
    sequencia: 0,       // vitórias seguidas na série corrente
    recorde: 0,
    derrotas: 0,
    zerarNaProxima: false,
    tempoTotalMs: 0,
    melhorTempoMs: null
  };

  TERM.estatisticas = {
    dados: null,

    init: function () {
      this.dados = this.carregar();
      return this;
    },

    /* Únicos pontos que tocariam armazenamento. Para gravar
       entre sessões, trocar o corpo dos dois por localStorage. */
    carregar: function () {
      return Object.assign({}, VAZIAS);
    },

    salvar: function () {
      /* sem persistência entre sessões nesta versão */
    },

    /* A derrota não zera a sequência agora: o relatório logo
       depois mostraria zero e o jogador perderia de vista a
       série que acabou de fazer. Zera na próxima partida. */
    registrar: function (venceu, duracaoMs) {
      if (TERM.partida.contabilizada) return;
      TERM.partida.contabilizada = true;

      var d = this.dados;
      d.jogos++;

      if (venceu) {
        d.vitorias++;
        d.sequencia++;
        if (d.sequencia > d.recorde) d.recorde = d.sequencia;
        d.tempoTotalMs += duracaoMs;
        if (d.melhorTempoMs === null || duracaoMs < d.melhorTempoMs) {
          d.melhorTempoMs = duracaoMs;
        }
      } else {
        d.derrotas++;
        d.zerarNaProxima = true;
      }

      this.salvar();
    },

    aplicarResetPendente: function () {
      if (!this.dados.zerarNaProxima) return;
      this.dados.sequencia = 0;
      this.dados.zerarNaProxima = false;
      this.salvar();
    },

    mediaTempoMs: function () {
      if (this.dados.vitorias === 0) return null;
      return this.dados.tempoTotalMs / this.dados.vitorias;
    }
  };

})(window.TERM);
