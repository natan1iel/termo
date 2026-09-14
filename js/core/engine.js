/* ============================================================
   core/engine.js
   Regras do jogo. Decide o que é verdade; a ui só desenha o
   que sai daqui. Sem DOM.
   ============================================================ */
(function (TERM) {
  "use strict";

  var cfg = TERM.config;

  TERM.engine = {

    /* Duas passagens: a primeira marca os acertos de posição e
       estoca as letras restantes da solução; a segunda gasta
       esse estoque marcando presença. Em uma passagem só, letra
       repetida em excesso acenderia marcação demais.

       Argumentos normalizados. */
    avaliar: function (tentativa, solucao) {
      var total = cfg.COLUNAS;
      var resultado = new Array(total).fill(cfg.ESTADO.AUSENTE);
      var estoque = {};
      var i, letra;

      for (i = 0; i < total; i++) {
        if (tentativa[i] === solucao[i]) {
          resultado[i] = cfg.ESTADO.CORRETA;
        } else {
          letra = solucao[i];
          estoque[letra] = (estoque[letra] || 0) + 1;
        }
      }

      for (i = 0; i < total; i++) {
        if (resultado[i] === cfg.ESTADO.CORRETA) continue;
        letra = tentativa[i];
        if (estoque[letra] > 0) {
          resultado[i] = cfg.ESTADO.PRESENTE;
          estoque[letra]--;
        }
      }

      return resultado;
    },

    /* Verdadeiro quando todas as posições foram acertadas. */
    venceu: function (resultado) {
      return resultado.every(function (estado) {
        return estado === cfg.ESTADO.CORRETA;
      });
    },

    /* Qual dos dois estados prevalece no teclado. */
    melhorEstado: function (atual, novo) {
      if (!atual) return novo;
      return cfg.PRIORIDADE[novo] > cfg.PRIORIDADE[atual] ? novo : atual;
    },

    /* Baralho em vez de sorteio independente: todas as palavras
       saem antes da primeira repetição. Com Math.random() puro,
       repetiria já nas primeiras dezenas de rodadas. */
    baralho: {
      restantes: [],
      rodada: 0,
      ciclo: 1,

      sortear: function (ultimaPalavra) {
        if (this.restantes.length === 0) {
          this.restantes = TERM.utils.embaralhar(TERM.dictionary.solucoes);
          if (this.rodada > 0) this.ciclo++;

          /* Evita emendar a última palavra do ciclo na primeira do novo. */
          var topo = this.restantes.length - 1;
          if (this.restantes[topo] === ultimaPalavra && topo > 0) {
            var troca = this.restantes[topo];
            this.restantes[topo] = this.restantes[0];
            this.restantes[0] = troca;
          }
        }
        this.rodada++;
        return this.restantes.pop();
      }
    }
  };

})(window.TERM);
