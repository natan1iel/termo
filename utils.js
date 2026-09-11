/* ============================================================
   core/utils.js
   Funções puras, sem estado e sem acesso ao DOM.

   Tudo aqui é testável isoladamente: mesma entrada, mesma
   saída, sem efeito colateral.
   ============================================================ */
(function (TERM) {
  "use strict";

  TERM.utils = {

    /* Remove acentos e cedilha, mantendo a letra base.
       "AVIÃO" -> "AVIAO"   |   "PREÇO" -> "PRECO"

       NFD separa a letra do sinal diacrítico; o intervalo
       \u0300-\u036f cobre esses sinais combinantes. */
    normalizar: function (texto) {
      return texto
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase();
    },

    /* Embaralhamento de Fisher-Yates sobre uma cópia da lista.
       Não altera o array recebido. */
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

    /* Duração em mm:ss. Os minutos crescem além de 59 em vez
       de estourar para horas. */
    formatarTempo: function (ms) {
      if (ms === null || ms === undefined) return "--:--";
      var total = Math.max(0, Math.floor(ms / 1000));
      var minutos = String(Math.floor(total / 60)).padStart(2, "0");
      var segundos = String(total % 60).padStart(2, "0");
      return minutos + ":" + segundos;
    },

    /* Sanitiza o nome informado no login: remove espaços das
       pontas, colapsa espaços internos e aplica o limite. */
    limparNome: function (texto, limite) {
      var limpo = String(texto || "").trim().replace(/\s+/g, " ");
      return limpo.slice(0, limite);
    }
  };

})(window.TERM);
