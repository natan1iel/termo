(function (TERM) {
  "use strict";

  var cfg = TERM.config;

  TERM.solver = {

    emExecucao: false,
    timer: null,
    execucaoId: 0,
    jogadas: [],
    candidatas: [],
    pool: [],
    resolveuUltima: false,

    filtrarCandidatas: function (candidatas, historico) {
      return candidatas.filter(function (palavra) {
        var alvo = TERM.utils.normalizar(palavra);
        return historico.every(function (registro) {
          var esperado = TERM.engine.avaliar(registro.palavra, alvo);
          return esperado.join() === registro.resultado.join();
        });
      });
    },

    entropia: function (pool, solucoes) {
      if (solucoes.length <= 2) {
        return { palavra: solucoes[0], bits: null };
      }

      var possivel = {};
      solucoes.forEach(function (s) { possivel[s] = true; });

      var melhor = null, melhorH = -1, melhorEhSolucao = false;

      for (var i = 0; i < pool.length; i++) {
        var chute = pool[i];

        var grupos = {};
        for (var j = 0; j < solucoes.length; j++) {
          var retorno = TERM.engine.avaliar(chute, solucoes[j]).join();
          grupos[retorno] = (grupos[retorno] || 0) + 1;
        }

        var H = 0;
        for (var padrao in grupos) {
          var p = grupos[padrao] / solucoes.length;
          H -= p * Math.log2(p);
        }

        var ehSolucao = possivel[chute] === true;
        var ganhou = H > melhorH + 1e-9 ||
                     (Math.abs(H - melhorH) < 1e-9 && ehSolucao && !melhorEhSolucao);

        if (ganhou) {
          melhorH = H;
          melhor = chute;
          melhorEhSolucao = ehSolucao;
        }
      }

      return { palavra: melhor, bits: melhorH };
    },

    proximaTentativa: function (candidatas, turno) {
      if (turno < cfg.SOLVER_ABERTURAS.length) {
        return { palavra: cfg.SOLVER_ABERTURAS[turno], bits: null, abertura: true };
      }
      if (!candidatas.length) {
        return { palavra: null, bits: null, abertura: false };
      }
      var escolha = this.entropia(this.pool, candidatas);
      escolha.abertura = false;
      return escolha;
    },

    executar: function () {
      if (this.emExecucao) return;
      this.emExecucao = true;
      this.execucaoId++;

      TERM.modals.fecharResolver();

      var solucao = TERM.partida.solucao;
      var rodada = TERM.partida.rodada;

      TERM.partida.iniciar(solucao, rodada);
      TERM.partida.contabilizada = true;
      TERM.percurso.descartar();

      this.jogadas = [];
      this.pool = TERM.dictionary.validas.map(TERM.utils.normalizar);
      this.candidatas = TERM.dictionary.solucoes.map(TERM.utils.normalizar);
      this.resolveuUltima = true;

      var self = this;
      this.agendar(function () {
        self.prepararTela();
        self.jogar();
      });
    },

    prepararTela: function () {
      TERM.board.montar();
      TERM.keyboard.montar();
      TERM.log.limpar();
      TERM.log.escrever("solver", cfg.TEXTOS.solverAssumiu, "destaque");
      TERM.log.escrever("solver", cfg.TEXTOS.solverAberturas(cfg.SOLVER_ABERTURAS));
      TERM.app.atualizarBarra();
    },

    jogar: function () {
      var partida = TERM.partida;
      if (!this.emExecucao || partida.encerrada) return this.encerrar();

      this.candidatas = this.filtrarCandidatas(this.candidatas, this.jogadas);

      var escolha = this.proximaTentativa(this.candidatas, partida.linha);
      if (!escolha.palavra) return this.abortar(cfg.TEXTOS.solverSemCandidatas);

      if (!escolha.abertura) {
        TERM.log.escreverRecuado(cfg.TEXTOS.solverCandidatas(this.candidatas.length));
        if (escolha.bits !== null) {
          TERM.log.escreverRecuado(
            cfg.TEXTOS.solverEscolha(escolha.palavra, escolha.bits.toFixed(2)));
        }
      }

      partida.limparLinha();
      for (var i = 0; i < escolha.palavra.length; i++) {
        partida.digitar(escolha.palavra[i]);
      }
      TERM.board.desenharEntrada(partida.linha, partida.letras, -1);
      TERM.app.atualizarBarra();

      var antes = partida.resultados.length;
      TERM.app.submeterTentativa();
      if (partida.resultados.length === antes) {
        return this.abortar(cfg.TEXTOS.solverRecusada(escolha.palavra));
      }

      this.jogadas.push({
        palavra: escolha.palavra,
        resultado: partida.resultados[partida.resultados.length - 1]
      });

      if (partida.encerrada) return this.encerrar();
      this.agendar(this.jogar.bind(this));
    },

    agendar: function (passo) {
      var self = this;
      var id = this.execucaoId;

      clearTimeout(this.timer);
      this.timer = setTimeout(function () {
        if (id !== self.execucaoId || !self.emExecucao) return;
        try {
          passo();
        } catch (erro) {
          self.abortar(String((erro && erro.message) || erro));
        }
      }, TERM.board.duracaoRevelacao() + cfg.SOLVER_PAUSA);
    },

    encerrar: function () {
      clearTimeout(this.timer);
      this.timer = null;
      this.emExecucao = false;
    },

    abortar: function (motivo) {
      this.encerrar();
      TERM.partida.encerrada = true;
      TERM.board.desativar();
      TERM.log.erro(cfg.TEXTOS.solverInterrompido(motivo));
      TERM.log.fim(cfg.TEXTOS.naoAcertou(TERM.partida.solucao), "aviso");
    }
  };

})(window.TERM);
