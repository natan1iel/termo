/* ============================================================
   ui/modals.js
   As três janelas sobrepostas: login, relatório e confirmação
   do solucionador.

   Concentra também a regra de qual delas está aberta, usada
   pelo tratamento de teclado para não deixar tecla vazar para
   o jogo por trás.
   ============================================================ */
(function (TERM) {
  "use strict";

  var utils = TERM.utils;

  TERM.modals = {
    login: null,
    relatorio: null,
    resolver: null,

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
      this.definirTexto("#rel-tempo", utils.formatarTempo(TERM.percurso.duracao()));

      var veredito = document.querySelector("#rel-veredito");
      var subtitulo = document.querySelector("#rel-tempo-sub");

      if (desfecho === "X") {
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
    },

    fecharRelatorio: function () {
      this.fechar(this.relatorio);
    },

    definirTexto: function (seletor, valor) {
      var el = document.querySelector(seletor);
      if (el) el.textContent = valor;
    }
  };

})(window.TERM);
