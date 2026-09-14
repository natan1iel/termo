/* ============================================================
   ui/modals.js
   As três janelas sobrepostas: login, relatório e confirmação.
   Concentra também qual delas está aberta, que o tratamento de
   teclado usa para não deixar tecla vazar para o jogo atrás.
   ============================================================ */
(function (TERM) {
  "use strict";

  var cfg = TERM.config;
  var utils = TERM.utils;

  TERM.modals = {
    login: null,
    relatorio: null,
    resolver: null,
    cronometro: null,

    init: function () {
      this.login = document.querySelector("#modal-login");
      this.relatorio = document.querySelector("#modal-relatorio");
      this.resolver = document.querySelector("#modal-resolver");
      return this;
    },

    abrir: function (elemento, focar) {
      elemento.classList.add("aberto");
      if (focar) {
        var alvo = elemento.querySelector(focar);
        if (alvo) alvo.focus();
      }
    },

    fechar: function (elemento) {
      elemento.classList.remove("aberto");
    },

    /* Devolve a janela aberta, ou null. */
    aberta: function () {
      return document.querySelector(".sobreposicao.aberto");
    },

    /* ---------- Login ---------- */

    abrirLogin: function () {
      this.abrir(this.login, "#campo-nome");
    },

    fecharLogin: function () {
      this.fechar(this.login);
    },

    nomeInformado: function () {
      return document.querySelector("#campo-nome").value;
    },

    /* ---------- Confirmação do solucionador ---------- */

    abrirResolver: function () {
      this.abrir(this.resolver, "#btn-cancelar");
    },

    fecharResolver: function () {
      this.fechar(this.resolver);
    },

    /* ---------- Relatório ----------

       desfecho: número da tentativa em que venceu, "X" para
       derrota, ou null para consulta com partida em andamento. */
    abrirRelatorio: function (desfecho) {
      var dados = TERM.estatisticas.dados;
      var partida = TERM.partida;

      this.definirTexto("#rel-comando",
        "--jogador " + TERM.jogador.nome + " --rodada " + partida.rodada);

      this.definirTexto("#rel-jogos", dados.jogos);
      this.definirTexto("#rel-sequencia", dados.sequencia);
      this.definirTexto("#rel-recorde", dados.recorde);
      this.atualizarTempo();

      var veredito = document.querySelector("#rel-veredito");
      var subtitulo = document.querySelector("#rel-tempo-sub");

      if (TERM.solver.resolveuUltima) {
        /* Partida da máquina: estatísticas paradas e sem tempo.
           Dizer "acertou" aqui leria como defeito. */
        veredito.className = "veredito";
        veredito.innerHTML = desfecho === "X"
          ? cfg.TEXTOS.relatorioSolverFalhou(partida.solucao)
          : cfg.TEXTOS.relatorioSolverVeredito(desfecho);
        subtitulo.textContent = cfg.TEXTOS.relatorioSolverSub;
      } else if (desfecho === "X") {
        veredito.className = "veredito derrota";
        veredito.innerHTML = "não acertou — a palavra era <b>" +
                             partida.solucao + "</b>";
        subtitulo.textContent = "nesta partida, sem acerto em 6 tentativas";
      } else if (typeof desfecho === "number") {
        veredito.className = "veredito";
        veredito.innerHTML = "<span class='marca'><b>TERM</b>inal</span>" +
                             " — acertou na tentativa <b>" + desfecho + "</b> de 6";
        subtitulo.textContent = "nesta partida com " + desfecho +
                                (desfecho === 1 ? " tentativa" : " tentativas");
      } else {
        veredito.className = "veredito";
        veredito.innerHTML = "partida em andamento — tentativa <b>" +
                             (partida.linha + 1) + "</b> de 6";
        subtitulo.textContent = "decorrido até agora";
      }

      this.abrir(this.relatorio, "#btn-sortear");

      /* Em andamento, o relatório é consulta e o tempo precisa
         seguir correndo. Encerrada, a duração é final. */
      if (TERM.percurso.emAndamento()) this.iniciarCronometro();
    },

    fecharRelatorio: function () {
      this.pararCronometro();
      this.fechar(this.relatorio);
    },

    atualizarTempo: function () {
      this.definirTexto("#rel-tempo", utils.formatarTempo(TERM.percurso.duracao()));
    },

    iniciarCronometro: function () {
      this.pararCronometro();
      var self = this;
      this.cronometro = setInterval(function () {
        /* Encerrar com o relatório aberto congela o valor. */
        if (!TERM.percurso.emAndamento()) return self.pararCronometro();
        self.atualizarTempo();
      }, cfg.INTERVALO_CRONOMETRO);
    },

    pararCronometro: function () {
      if (this.cronometro === null) return;
      clearInterval(this.cronometro);
      this.cronometro = null;
    },

    definirTexto: function (seletor, valor) {
      var el = document.querySelector(seletor);
      if (el) el.textContent = valor;
    }
  };

})(window.TERM);
