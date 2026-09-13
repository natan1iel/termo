/* ============================================================
   core/engine.js
   Regras do jogo. Nenhuma referência ao DOM.

   É a camada que decide o que é verdade; a camada de interface
   apenas desenha o que este módulo devolve. Isso permite testar
   as regras sem navegador e trocar a interface sem tocar aqui.
   ============================================================ */
(function (TERM) {
  "use strict";

  var cfg = TERM.config;

  TERM.engine = {

    /* ---------- Avaliação de uma tentativa ----------

       Duas passagens, e a ordem importa.

       Passagem 1 marca apenas os acertos de posição e devolve
       ao estoque as letras da solução que não coincidiram.
       Passagem 2 percorre o que sobrou e só marca presença
       enquanto houver estoque daquela letra.

       Sem essa separação, uma tentativa com a letra repetida
       mais vezes do que a solução acende marcações demais —
       é o defeito clássico de clone de Wordle.

       Ambos os argumentos devem vir normalizados.            */
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

    /* Estado que deve prevalecer no teclado entre dois
       conhecidos sobre a mesma letra. */
    melhorEstado: function (atual, novo) {
      if (!atual) return novo;
      return cfg.PRIORIDADE[novo] > cfg.PRIORIDADE[atual] ? novo : atual;
    },

    /* ---------- Sorteio ----------

       Baralho embaralhado em vez de sorteio independente: o
       jogador vê todas as palavras antes de qualquer repetição.
       Com Math.random() puro, repetições apareceriam já nas
       primeiras dezenas de rodadas.                          */
    baralho: {
      restantes: [],
      rodada: 0,
      ciclo: 1,

      sortear: function (ultimaPalavra) {
        if (this.restantes.length === 0) {
          this.restantes = TERM.utils.embaralhar(TERM.dictionary.solucoes);
          if (this.rodada > 0) this.ciclo++;

          /* Impede que a última palavra do ciclo anterior seja
             a primeira do novo. */
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
