(function (TERM) {
  "use strict";

  var cfg = TERM.config;

  TERM.engine = {

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

    venceu: function (resultado) {
      return resultado.every(function (estado) {
        return estado === cfg.ESTADO.CORRETA;
      });
    },

    melhorEstado: function (atual, novo) {
      if (!atual) return novo;
      return cfg.PRIORIDADE[novo] > cfg.PRIORIDADE[atual] ? novo : atual;
    },

    baralho: {
      restantes: [],
      rodada: 0,
      ciclo: 1,

      sortear: function (ultimaPalavra) {
        if (this.restantes.length === 0) {
          this.restantes = TERM.utils.embaralhar(TERM.dictionary.solucoes);
          if (this.rodada > 0) this.ciclo++;

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
