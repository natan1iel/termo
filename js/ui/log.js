/* ============================================================
   ui/log.js
   Painel de registro. Cada evento do jogo vira uma linha de
   saída, no formato de terminal.
   ============================================================ */
(function (TERM) {
  "use strict";

  var cfg = TERM.config;

  TERM.log = {
    elemento: null,

    init: function (seletor) {
      this.elemento = document.querySelector(seletor);
      return this;
    },

    limpar: function () {
      this.elemento.innerHTML = "";
    },

    /* rotulo aparece entre colchetes; tom define a cor da linha. */
    escrever: function (rotulo, texto, tom) {
      var p = document.createElement("p");
      if (tom) p.className = tom;
      p.innerHTML = rotulo
        ? "<span class='rotulo'>[" + rotulo + "]</span> " + texto
        : texto;
      this.elemento.appendChild(p);
      this.elemento.scrollTop = this.elemento.scrollHeight;
    },

    /* Linha recuada, sem rótulo, usada nos complementos. */
    escreverRecuado: function (texto) {
      var p = document.createElement("p");
      p.innerHTML = "<span class='rotulo'>    " + texto + "</span>";
      this.elemento.appendChild(p);
      this.elemento.scrollTop = this.elemento.scrollHeight;
    },

    /* Abertura da sessão: identificação e regras textuais.
       O código de cores fica na legenda fixa do painel, que
       não rola junto com o registro. */
    abertura: function () {
      this.escrever("boot", "<b>" + cfg.TEXTOS.boot + "</b>");
      cfg.TEXTOS.ajuda.forEach(function (linha) {
        TERM.log.escrever("ajuda", linha);
      });
    },

    sorteio: function () {
      this.escrever("sorteio", cfg.TEXTOS.sorteio);
      this.escrever("pronto", cfg.TEXTOS.pronto, "destaque");
    },

    /* Uma tentativa avaliada, com cada par letra+sinal na cor
       do seu estado. */
    tentativa: function (numero, palavra, resultado) {
      var conteudo = "";
      for (var i = 0; i < resultado.length; i++) {
        conteudo += "<span class='" + cfg.CLASSE_MARCA[resultado[i]] + "'>" +
                    palavra[i] + cfg.MARCA[resultado[i]] + "</span> ";
      }
      this.escrever(String(numero), conteudo);
    },

    erro: function (texto) {
      this.escrever("erro", texto, "falha");
    },

    fim: function (texto, tom) {
      this.escrever("fim", texto, tom || "destaque");
    }
  };

})(window.TERM);
