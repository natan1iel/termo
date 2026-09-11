/* ============================================================
   app.js
   Orquestração. Único módulo que conhece todos os outros.

   Fluxo de uma tentativa:
     entrada do usuário
       -> app valida contra o dicionário
       -> engine avalia
       -> state guarda resultado e percurso
       -> board, keyboard e log desenham
       -> app decide encerramento
   ============================================================ */
(function (TERM) {
  "use strict";

  var cfg = TERM.config;
  var utils = TERM.utils;

  TERM.app = {

    /* ---------- Arranque ---------- */

    iniciar: function () {
      TERM.dictionary.init();
      TERM.estatisticas.init();

      TERM.board.init("#grade");
      TERM.keyboard.init("#teclado", this.tratarTecla.bind(this));
      TERM.log.init("#registro");
      TERM.modals.init();

      TERM.board.montar();
      TERM.keyboard.montar();

      this.ligarEventos();
      TERM.modals.abrirLogin();
    },

    /* ---------- Ciclo de partida ---------- */

    entrarNoJogo: function () {
      var nome = TERM.jogador.definir(TERM.modals.nomeInformado());
      this.definirTexto("#info-jogador", nome);
      TERM.modals.fecharLogin();
      this.novaPartida();
    },

    novaPartida: function () {
      TERM.estatisticas.aplicarResetPendente();
      TERM.modals.fecharRelatorio();

      var solucao = TERM.engine.baralho.sortear(TERM.partida.solucao);
      TERM.partida.iniciar(solucao, TERM.engine.baralho.rodada);
      TERM.percurso.iniciar(TERM.jogador.nome, solucao);

      TERM.board.montar();
      TERM.keyboard.montar();
      TERM.log.limpar();

      if (TERM.engine.baralho.rodada === 1) TERM.log.abertura();
      TERM.log.sorteio();

      this.atualizarBarra();
      this.desenharEntrada();
    },

    /* ---------- Entrada ---------- */

    tratarTecla: function (tecla) {
      if (TERM.modals.aberta()) return;

      if (TERM.partida.encerrada) {
        if (tecla === "ENTER") this.novaPartida();
        return;
      }

      if (tecla === "ENTER") return this.submeterTentativa();

      if (tecla === "APAGAR") {
        TERM.partida.apagarLetra();
        return this.desenharEntrada();
      }

      if (/^[A-Z]$/.test(tecla) && TERM.partida.adicionarLetra(tecla)) {
        this.desenharEntrada();
      }
    },

    desenharEntrada: function () {
      if (TERM.partida.encerrada) return;
      TERM.board.desenharEntrada(TERM.partida.linha, TERM.partida.entrada);
      this.atualizarBarra();
    },

    /* ---------- Submissão ---------- */

    submeterTentativa: function () {
      var partida = TERM.partida;
      var entrada = partida.entrada;

      if (entrada.length < cfg.COLUNAS) {
        return this.recusar(cfg.TEXTOS.faltamLetras(cfg.COLUNAS - entrada.length));
      }
      if (!TERM.dictionary.existe(entrada)) {
        return this.recusar(cfg.TEXTOS.palavraInvalida(entrada));
      }

      var resultado = TERM.engine.avaliar(entrada, partida.solucaoNormalizada);
      partida.resultados.push(resultado);
      TERM.percurso.registrarTentativa(entrada, resultado);

      TERM.board.revelar(partida.linha, resultado, partida.solucao,
        function (indice, estado) {
          TERM.keyboard.atualizarLetra(entrada[indice], estado);
        });

      TERM.log.tentativa(partida.linha + 1, entrada, resultado);

      var venceu = TERM.engine.venceu(resultado);
      if (!venceu && !partida.ehUltimaLinha()) {
        TERM.log.escreverRecuado(cfg.TEXTOS.tentativasRestantes(partida.tentativasRestantes()));
      }

      if (venceu) return this.encerrarComVitoria();
      if (partida.ehUltimaLinha()) return this.encerrarComDerrota();

      partida.avancarLinha();
      setTimeout(this.desenharEntrada.bind(this), TERM.board.duracaoRevelacao());
    },

    recusar: function (mensagem) {
      TERM.board.recusar(TERM.partida.linha);
      TERM.log.erro(mensagem);
    },

    /* ---------- Encerramento ---------- */

    encerrarComVitoria: function () {
      var partida = TERM.partida;
      var tentativas = partida.linha + 1;
      partida.encerrada = true;

      var duracao = TERM.percurso.encerrar(true) || 0;
      TERM.estatisticas.registrar(true, duracao);

      var espera = TERM.board.duracaoRevelacao();
      setTimeout(function () {
        TERM.board.comemorar(partida.linha);
        TERM.log.fim(cfg.TEXTOS.acertou(tentativas));
        setTimeout(function () {
          TERM.modals.abrirRelatorio(tentativas);
        }, cfg.ATRASO_RELATORIO_VITORIA);
      }, espera);
    },

    encerrarComDerrota: function () {
      var partida = TERM.partida;
      partida.encerrada = true;

      TERM.percurso.encerrar(false);
      TERM.estatisticas.registrar(false, 0);

      var espera = TERM.board.duracaoRevelacao();
      setTimeout(function () {
        TERM.log.fim(cfg.TEXTOS.naoAcertou(partida.solucao), "aviso");
        setTimeout(function () {
          TERM.modals.abrirRelatorio("X");
        }, cfg.ATRASO_RELATORIO_DERROTA);
      }, espera);
    },

    /* ---------- Barra superior ---------- */

    atualizarBarra: function () {
      this.definirTexto("#info-rodada", TERM.partida.rodada || "—");
      this.definirTexto("#info-tentativa", TERM.partida.linha + 1);
    },

    definirTexto: function (seletor, valor) {
      var el = document.querySelector(seletor);
      if (el) el.textContent = valor;
    },

    /* ---------- Eventos ---------- */

    ligarEventos: function () {
      var self = this;

      document.querySelector("#btn-entrar")
        .addEventListener("click", function () { self.entrarNoJogo(); });

      document.querySelector("#btn-relatorio")
        .addEventListener("click", function () { self.consultarRelatorio(); });

      document.querySelector("#btn-resolver")
        .addEventListener("click", function () {
          if (!TERM.partida.encerrada) TERM.modals.abrirResolver();
        });

      document.querySelector("#btn-sortear")
        .addEventListener("click", function () { self.novaPartida(); });

      document.querySelector("#btn-fechar-relatorio")
        .addEventListener("click", function () { TERM.modals.fecharRelatorio(); });

      document.querySelector("#btn-cancelar")
        .addEventListener("click", function () { TERM.modals.fecharResolver(); });

      document.querySelector("#btn-fechar-resolver")
        .addEventListener("click", function () { TERM.modals.fecharResolver(); });

      document.querySelector("#btn-executar")
        .addEventListener("click", function () { TERM.solver.executar(); });

      TERM.modals.relatorio.addEventListener("click", function (evento) {
        if (evento.target === TERM.modals.relatorio) TERM.modals.fecharRelatorio();
      });

      document.addEventListener("keydown", this.tratarTeclaFisica.bind(this));
    },

    /* Com janela aberta, o jogo não recebe letras. Sem essa
       barreira, digitar por trás do login encheria a grade
       às cegas. */
    tratarTeclaFisica: function (evento) {
      if (evento.ctrlKey || evento.metaKey || evento.altKey) return;

      var aberta = TERM.modals.aberta();
      if (aberta) {
        if (evento.key === "Escape") {
          /* O login não fecha com Esc: identificar-se é obrigatório. */
          if (aberta === TERM.modals.resolver) TERM.modals.fecharResolver();
          else if (aberta === TERM.modals.relatorio) TERM.modals.fecharRelatorio();
          return;
        }
        if (evento.key === "Enter") {
          evento.preventDefault();
          if (aberta === TERM.modals.login) return this.entrarNoJogo();
          if (aberta === TERM.modals.relatorio) return this.novaPartida();
          /* Na confirmação do solucionador, Enter não confirma:
             é a mesma tecla de enviar tentativa, e um Enter
             repetido não pode disparar ação destrutiva. */
        }
        return;
      }

      if (evento.key === "Enter") {
        evento.preventDefault();
        return this.tratarTecla("ENTER");
      }
      if (evento.key === "Backspace") {
        evento.preventDefault();
        return this.tratarTecla("APAGAR");
      }

      var letra = utils.normalizar(evento.key);
      if (letra.length === 1 && /^[A-Z]$/.test(letra)) this.tratarTecla(letra);
    },

    consultarRelatorio: function () {
      if (!TERM.partida.encerrada) return TERM.modals.abrirRelatorio(null);
      var ultimo = TERM.partida.resultados[TERM.partida.resultados.length - 1];
      var venceu = ultimo && TERM.engine.venceu(ultimo);
      TERM.modals.abrirRelatorio(venceu ? TERM.partida.resultados.length : "X");
    }
  };

  document.addEventListener("DOMContentLoaded", function () {
    TERM.app.iniciar();
  });

})(window.TERM);
