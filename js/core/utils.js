/* ============================================================
   core/utils.js
   Funções puras: mesma entrada, mesma saída, sem DOM.
   ============================================================ */
(function (TERM) {
  "use strict";

  TERM.utils = {

    /* "AVIÃO" -> "AVIAO". NFD separa a letra do diacrítico; o
       intervalo \u0300-\u036f cobre os sinais combinantes. */
    normalizar: function (texto) {
      return texto
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase();
    },

    /* Fisher-Yates sobre uma cópia; não altera o original. */
    embaralhar: function (lista) {
      var copia = lista.slice();
      for (var i = copia.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var troca = copia[i];
        copia[i] = copia[j];
        copia[j] = troca;
      }
      return copia;
    },

    /* mm:ss, com os minutos passando de 59 em vez de virar hora. */
    formatarTempo: function (ms) {
      if (ms === null || ms === undefined) return "--:--";
      var total = Math.max(0, Math.floor(ms / 1000));
      var minutos = String(Math.floor(total / 60)).padStart(2, "0");
      var segundos = String(total % 60).padStart(2, "0");
      return minutos + ":" + segundos;
    },

    /* Apara as pontas, colapsa espaços internos, corta no limite. */
    limparNome: function (texto, limite) {
      var limpo = String(texto || "").trim().replace(/\s+/g, " ");
      return limpo.slice(0, limite);
    }
  };

})(window.TERM);
