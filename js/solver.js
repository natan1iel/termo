/* ============================================================
   solver.js
   Resolução algorítmica: três aberturas fixas e, da quarta
   tentativa em diante, escolha por entropia de Shannon.

   Não há avaliação própria aqui: engine.avaliar, a mesma função
   que julga a tentativa do jogador, serve ao solucionador sem
   adaptação. E filtrarCandidatas apenas reavalia cada palavra e
   compara com o retorno observado.

   ------------------------------------------------------------
   POR QUE TRÊS ABERTURAS FIXAS

   No começo todas as palavras são igualmente possíveis, então
   não há informação a que reagir. TRENS, PODAM e FUZIL valem
   pelo conjunto: cobrem 15 letras distintas sem sobreposição.
   Nenhuma delas é boa sozinha — FUZIL é das piores aberturas
   isoladas — mas juntas derrubam o espaço de busca de uma vez.

   ------------------------------------------------------------
   POR QUE ENTROPIA DEPOIS

   Para cada chute possível, agrupa-se o que restou pelo retorno
   que aquele chute produziria. A entropia dessa distribuição,

       H = -SOMA p(retorno) * log2 p(retorno)

   mede, em bits, quanta informação o chute traz. H máximo é o
   chute que separa as candidatas da forma mais equilibrada.

   O ponto sutil: o melhor chute com frequência NÃO pode ser a
   resposta. Com as candidatas JUSTO, BUSTO, SUSTO e CUSTO, uma
   palavra como ABACA não vence nunca, mas testa B e C de uma
   vez e separa as quatro; chutar JUSTO teria chance de acertar
   e, errando, deixaria três indistinguíveis. Abrir mão de
   ganhar agora é o que garante não perder depois.
   ============================================================ */
(function (TERM) {
  "use strict";

  var cfg = TERM.config;

  TERM.solver = {

    /* ---------- Estado da execução ---------- */

    emExecucao: false,
    timer: null,
    execucaoId: 0,      // invalida passos agendados de execuções velhas
    jogadas: [],        // histórico próprio: {palavra, resultado}
    candidatas: [],     // o que ainda pode ser a resposta
    pool: [],           // universo de chutes possíveis
    resolveuUltima: false,

    /* ---------- Estratégia (sem DOM, testável fora do navegador) ---------- */

    /* Mantém as palavras que reproduzem exatamente o retorno já
       observado. Como avaliar() é exata, isto nunca descarta a
       solução verdadeira. */
    filtrarCandidatas: function (candidatas, historico) {
      return candidatas.filter(function (palavra) {
        var alvo = TERM.utils.normalizar(palavra);
        return historico.every(function (registro) {
          var esperado = TERM.engine.avaliar(registro.palavra, alvo);
          return esperado.join() === registro.resultado.join();
        });
      });
    },

    /* Escolhe o chute de maior entropia sobre as candidatas.

       Com duas ou menos, não há o que medir: joga a primeira.
       No empate, prefere a palavra que ainda pode ser a
       resposta — mesmo poder de separação, com a chance extra
       de encerrar ali. */
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

    /* As aberturas são jogadas sempre, sem atalho: é a regra da
       referência, e é o que torna o percurso reproduzível. */
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

    /* ---------- Execução ---------- */

    /* A ordem aqui é obrigatória: iniciar() zera contabilizada,
       então marcá-la antes não teria efeito e a partida da
       máquina entraria nas estatísticas do jogador. */
    executar: function () {
      if (this.emExecucao) return;
      this.emExecucao = true;
      this.execucaoId++;

      TERM.modals.fecharResolver();

      var solucao = TERM.partida.solucao;   // acentuada: revelar precisa dela
      var rodada = TERM.partida.rodada;

      TERM.partida.iniciar(solucao, rodada);
      TERM.partida.contabilizada = true;    // neutraliza estatisticas.registrar
      TERM.percurso.descartar();            // some do percurso humano

      this.jogadas = [];
      /* Dois universos distintos: pode-se chutar qualquer
         palavra aceita, mas só as soluções podem ser a
         resposta. É o que permite jogar uma palavra que não
         vence, só para separar as candidatas. */
      this.pool = TERM.dictionary.validas.map(TERM.utils.normalizar);
      this.candidatas = TERM.dictionary.solucoes.map(TERM.utils.normalizar);
      this.resolveuUltima = true;

      /* A limpeza da tela vai no primeiro passo, não aqui: se o
         jogador acionou o botão durante uma revelação, os
         temporizadores dela ainda estão pendentes e repintariam
         o teclado recém-montado. */
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

      /* limparLinha não é higiene: digitar salta para a próxima
         lacuna, então numa linha com resto as cinco chamadas
         acabariam empilhadas na mesma célula. */
      partida.limparLinha();
      for (var i = 0; i < escolha.palavra.length; i++) {
        partida.digitar(escolha.palavra[i]);
      }
      /* Cursor -1: a máquina está jogando, ninguém digita aqui. */
      TERM.board.desenharEntrada(partida.linha, partida.letras, -1);
      TERM.app.atualizarBarra();

      /* submeterTentativa devolve undefined tanto no sucesso
         quanto na recusa; o delta é o único sinal disponível. */
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

    /* Um passo só roda se ainda pertencer à execução corrente.
       Qualquer exceção derruba a execução de forma limpa, em vez
       de deixar emExecucao preso e a interface sem teclado. */
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
