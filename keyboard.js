/* ============================================================
   ui/keyboard.js
   Teclado virtual e mapa de estados das letras.
   ============================================================ */
(function (TERM) {
  "use strict";

  var cfg = TERM.config;

  TERM.keyboard = {
    elemento: null,
    aoPressionar: null,

    init: function (seletor, aoPressionar) {
      this.elemento = document.querySelector(seletor);
      this.aoPressionar = aoPressionar;
      return this;
    },

    montar: function () {
      var self = this;
      this.elemento.innerHTML = "";

      cfg.TECLADO.forEach(function (linhaTeclas) {
        var linha = document.createElement("div");
        linha.className = "linha-teclas";

        linhaTeclas.forEach(function (tecla) {
          var botao = document.createElement("button");
          botao.type = "button";
          botao.className = "tecla" + (tecla.length > 1 ? " larga" : "");
          botao.textContent = tecla === "APAGAR" ? "⌫" : tecla;
          botao.dataset.tecla = tecla;
          if (tecla.length > 1) {
            botao.setAttribute("aria-label", tecla.toLowerCase());
          }
          botao.addEventListener("click", function () {
            self.aoPressionar(tecla);
          });
          linha.appendChild(botao);
        });

        self.elemento.appendChild(linha);
      });
    },

    /* Aplica o estado a uma letra, respeitando a precedência:
       correta > presente > ausente. O estado nunca regride. */
    atualizarLetra: function (letra, estado) {
      var atual = TERM.partida.estadosTeclado[letra];
      var melhor = TERM.engine.melhorEstado(atual, estado);
      if (melhor === atual) return;

      TERM.partida.estadosTeclado[letra] = melhor;

      var botao = this.elemento.querySelector('[data-tecla="' + letra + '"]');
      if (!botao) return;
      botao.classList.remove("t-correct", "t-present", "t-absent");
      botao.classList.add("t-" + melhor);
    }
  };

})(window.TERM);
