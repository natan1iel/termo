(function (TERM) {
  "use strict";

  TERM.utils = {

    normalizar: function (texto) {
      return texto
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase();
    },

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

    formatarTempo: function (ms) {
      if (ms === null || ms === undefined) return "--:--";
      var total = Math.max(0, Math.floor(ms / 1000));
      var minutos = String(Math.floor(total / 60)).padStart(2, "0");
      var segundos = String(total % 60).padStart(2, "0");
      return minutos + ":" + segundos;
    },

    limparNome: function (texto, limite) {
      var limpo = String(texto || "").trim().replace(/\s+/g, " ");
      return limpo.slice(0, limite);
    }
  };

})(window.TERM);
