/* ============================================================
   ui/board.js
   Grade de tentativas. Só desenha; não decide nada.
   ============================================================ */
(function (TERM) {
  "use strict";

  var cfg = TERM.config;

  TERM.board = {
    elemento: null,
    aoClicarCelula: null,

    init: function (seletor, aoClicarCelula) {
      this.elemento = document.querySelector(seletor);
      this.aoClicarCelula = aoClicarCelula;

      /* Delegação: o ouvinte vive no contêiner, que sobrevive
         às remontagens da grade a cada nova partida. Quem
         decide se aquele clique vale é o app. */
      var self = this;
      this.elemento.addEventListener("click", function (evento) {
        var celula = evento.target.closest(".celula");
        if (!celula || !self.aoClicarCelula) return;
        self.aoClicarCelula(Number(celula.dataset.linha),
                            Number(celula.dataset.coluna));
      });

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
          celula.dataset.linha = l;
          celula.dataset.coluna = c;
          linha.appendChild(celula);
        }
        this.elemento.appendChild(linha);
      }
    },

    linhaDe: function (indice) {
      return this.elemento.children[indice];
    },

    /* Redesenha a linha em edição. Recebe as posições e a
       coluna do cursor já decididas; não infere nenhuma. */
    desenharEntrada: function (indice, letras, cursor) {
      var linha = this.linhaDe(indice);
      if (!linha) return;

      for (var c = 0; c < cfg.COLUNAS; c++) {
        var celula = linha.children[c];
        var letra = letras[c] || "";
        celula.textContent = letra;
        celula.classList.toggle("preenchida", letra !== "");
        celula.classList.toggle("cursor", c === cursor);
      }

      /* Só a linha em edição aceita clique — a marcação avisa
         isso ao ponteiro. */
      for (var l = 0; l < this.elemento.children.length; l++) {
        this.elemento.children[l].classList.toggle("ativa", l === indice);
      }
    },

    /* Encerrada a partida, nenhuma linha aceita clique. */
    desativar: function () {
      for (var l = 0; l < this.elemento.children.length; l++) {
        this.elemento.children[l].classList.remove("ativa");
        var celulas = this.elemento.children[l].children;
        for (var c = 0; c < celulas.length; c++) {
          celulas[c].classList.remove("cursor");
        }
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
