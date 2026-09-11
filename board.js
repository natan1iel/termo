/* ============================================================
   ui/board.js
   Grade de tentativas. Só desenha; não decide nada.
   ============================================================ */
(function (TERM) {
  "use strict";

  var cfg = TERM.config;

  TERM.board = {
    elemento: null,

    init: function (seletor) {
      this.elemento = document.querySelector(seletor);
      return this;
    },

    montar: function () {
      this.elemento.innerHTML = "";
      for (var l = 0; l < cfg.LINHAS; l++) {
        var linha = document.createElement("div");
        linha.className = "linha";
        linha.setAttribute("role", "row");
        for (var c = 0; c < cfg.COLUNAS; c++) {
          var celula = document.createElement("div");
          celula.className = "celula";
          celula.setAttribute("role", "gridcell");
          linha.appendChild(celula);
        }
        this.elemento.appendChild(linha);
      }
    },

    linhaDe: function (indice) {
      return this.elemento.children[indice];
    },

    /* Redesenha a linha em edição a partir do texto digitado. */
    desenharEntrada: function (indice, texto) {
      var linha = this.linhaDe(indice);
      if (!linha) return;
      for (var c = 0; c < cfg.COLUNAS; c++) {
        var celula = linha.children[c];
        var letra = texto[c] || "";
        celula.textContent = letra;
        celula.classList.toggle("preenchida", letra !== "");
        celula.classList.toggle("cursor", c === texto.length);
      }
    },

    /* Revelação escalonada. O callback avisa a cada letra para
       que o teclado acompanhe no mesmo ritmo. */
    revelar: function (indice, resultado, solucao, aoRevelarLetra) {
      var linha = this.linhaDe(indice);
      resultado.forEach(function (estado, i) {
        setTimeout(function () {
          var celula = linha.children[i];
          celula.classList.remove("preenchida", "cursor");
          celula.classList.add(estado, "revelar");
          /* Posição certa mostra a forma acentuada da solução. */
          if (estado === cfg.ESTADO.CORRETA) {
            celula.textContent = solucao[i];
          }
          if (aoRevelarLetra) aoRevelarLetra(i, estado);
        }, i * cfg.ATRASO_POR_LETRA);
      });
    },

    recusar: function (indice) {
      var linha = this.linhaDe(indice);
      linha.classList.remove("tremer");
      void linha.offsetWidth;          // força o reinício da animação
      linha.classList.add("tremer");
    },

    comemorar: function (indice) {
      this.linhaDe(indice).classList.add("vitoria");
    },

    /* Tempo total da revelação de uma linha. */
    duracaoRevelacao: function () {
      return cfg.COLUNAS * cfg.ATRASO_POR_LETRA + cfg.ESPERA_APOS_REVELACAO;
    }
  };

})(window.TERM);
