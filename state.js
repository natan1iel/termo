/* ============================================================
   core/state.js
   Estado da aplicação: partida corrente, estatísticas do
   jogador e registro de percurso.

   Nenhuma referência ao DOM. A interface lê daqui, nunca
   guarda estado próprio.
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
    entrada: "",          // letras digitadas na linha corrente
    encerrada: false,
    contabilizada: false, // impede contagem dupla do mesmo resultado
    rodada: 0,
    resultados: [],       // um array de estados por tentativa
    estadosTeclado: {},

    iniciar: function (solucao, rodada) {
      this.solucao = solucao;
      this.solucaoNormalizada = TERM.utils.normalizar(solucao);
      this.linha = 0;
      this.entrada = "";
      this.encerrada = false;
      this.contabilizada = false;
      this.rodada = rodada;
      this.resultados = [];
      this.estadosTeclado = {};
    },

    adicionarLetra: function (letra) {
      if (this.entrada.length >= cfg.COLUNAS) return false;
      this.entrada += letra;
      return true;
    },

    apagarLetra: function () {
      if (this.entrada.length === 0) return false;
      this.entrada = this.entrada.slice(0, -1);
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
      this.entrada = "";
    }
  };

  /* ---------- Percurso ----------

     O escopo do trabalho pede o registro do percurso, não só
     do desempenho: guardamos cada tentativa com o retorno que
     ela produziu e o tempo decorrido até ali. É esse array que
     alimenta a análise de dificuldade.                        */

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

    /* Duração corrente: encerrada usa o valor final, em
       andamento usa o tempo até agora. */
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

    /* Partida assumida pelo solucionador não entra no percurso
       humano: contaminaria a comparação da análise. */
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

    /* Persistência isolada nestes dois métodos. Para gravar
       entre sessões, basta trocar o corpo deles:

         carregar: JSON.parse(localStorage.getItem("terminal")) || {...VAZIAS}
         salvar:   localStorage.setItem("terminal", JSON.stringify(this.dados))

       Nenhum outro ponto do código acessa armazenamento. */
    carregar: function () {
      return Object.assign({}, VAZIAS);
    },

    salvar: function () {
      /* sem persistência entre sessões nesta versão */
    },

    /* A derrota NÃO zera a sequência aqui. Se zerasse, o
       relatório exibido logo depois já mostraria zero e o
       jogador perderia de vista a série que acabou de fazer.
       O reset fica marcado e ocorre na próxima partida. */
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
