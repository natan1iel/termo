/* ============================================================
   ui/modals.js
   As três janelas sobrepostas: login, relatório e confirmação.
   Concentra também qual delas está aberta, que o tratamento de
   teclado usa para não deixar tecla vazar para o jogo atrás.
   ============================================================ */
(function (TERM) {
  "use strict";

  var cfg = TERM.config;
  var utils = TERM.utils;



  function criar(tag, classe, texto) {
    var el = document.createElement(tag);
    if (classe) el.className = classe;
    if (texto !== undefined) el.textContent = texto;
    return el;
  }

  function celula(grade, texto, classe, ajuda) {
    var el = criar("span", classe, texto);
    if (ajuda) el.title = ajuda;
    grade.appendChild(el);
  }

  function ehConvidado(nome) {
    return utils.normalizar(nome) === utils.normalizar(cfg.NOME_PADRAO);
  }

  function rotulo(linha) {
    return ehConvidado(linha.nome) ? linha.nome + " *" : linha.nome;
  }

  function tempoDe(segundos) {
    return utils.formatarTempo(segundos === null ? null : segundos * 1000);
  }

  function tabela(linhas, eu) {
    var rolagem = criar("div", "rank-rolagem");
    var grade = criar("div", "rank-tabela");

    cfg.TEXTOS.rankingColunas.forEach(function (c) {
      celula(grade, c.rotulo, "cabecalho", c.ajuda);
    });

    linhas.forEach(function (l, i) {
      var meu = l.chave === eu ? " eu" : "";
      celula(grade, String(i + 1), "num" + meu);
      celula(grade, rotulo(l), "nome" + meu);
      celula(grade, l.pontos.toFixed(2), "pontos" + meu);
      celula(grade, String(l.jogos), meu);
      celula(grade, String(l.vitorias), meu);
      celula(grade, Math.round(100 * l.taxa) + "%", meu);
      /* sem vitória não há média de tentativas a exibir */
      celula(grade, l.media === null ? "—" : l.media.toFixed(2), meu);
      celula(grade, tempoDe(l.medianaS), meu);
    });

    rolagem.appendChild(grade);
    return rolagem;
  }

  TERM.modals = {
    login: null,
    relatorio: null,
    resolver: null,
    ranking: null,
    cronometro: null,

    init: function () {
      this.login = document.querySelector("#modal-login");
      this.relatorio = document.querySelector("#modal-relatorio");
      this.resolver = document.querySelector("#modal-resolver");
      this.ranking = document.querySelector("#modal-ranking");
      return this;
    },

    abrir: function (elemento, focar) {
      /* Uma janela de cada vez: aberta() devolve a primeira do
         DOM, não a de cima, então duas abertas confundem o Esc. */
      var atual = this.aberta();
      if (atual && atual !== elemento) {
        if (atual === this.relatorio) this.pararCronometro();
        atual.classList.remove("aberto");
      }

      elemento.classList.add("aberto");
      if (focar) {
        var alvo = elemento.querySelector(focar);
        if (alvo) alvo.focus();
      }
    },

    fechar: function (elemento) {
      elemento.classList.remove("aberto");
    },

    /* Devolve a janela aberta, ou null. */
    aberta: function () {
      return document.querySelector(".sobreposicao.aberto");
    },

    /* ---------- Login ---------- */

    abrirLogin: function (nomeAtual) {
      var campo = document.querySelector("#campo-nome");
      if (campo) campo.value = nomeAtual || "";
      this.abrir(this.login, "#campo-nome");
      /* Selecionado para o próximo jogador digitar por cima, e
         não emendar no nome anterior até estourar o limite. */
      if (campo) campo.select();
    },

    fecharLogin: function () {
      this.fechar(this.login);
    },

    nomeInformado: function () {
      return document.querySelector("#campo-nome").value;
    },

    /* ---------- Confirmação do solucionador ---------- */

    abrirResolver: function () {
      this.abrir(this.resolver, "#btn-cancelar");
    },

    fecharResolver: function () {
      this.fechar(this.resolver);
    },

    /* ---------- Ranking ---------- */

    abrirRanking: function () {
      this.desenharRanking(TERM.estatisticas.ranking());
      this.abrir(this.ranking, "#btn-fechar-ranking");
    },

    fecharRanking: function () {
      this.fechar(this.ranking);
    },

    /* Recebe a lista já ordenada e cortada; não decide nada. */
    desenharRanking: function (lista) {
      var corpo = document.querySelector("#rank-corpo");
      var eu = TERM.estatisticas.chave;
      corpo.innerHTML = "";

      /* innerHTML porque o texto marca termos com <b>; vem de
         config, sem nada digitado pelo jogador. */
      if (!lista.length) {
        corpo.appendChild(criar("p", "rank-nota", cfg.TEXTOS.rankingVazio));
        return;
      }

      corpo.appendChild(criar("p", "secao-titulo", cfg.TEXTOS.rankingClassificados));
      corpo.appendChild(tabela(lista, eu));

      var temConvidado = lista.some(function (l) { return ehConvidado(l.nome); });
      if (temConvidado) {
        corpo.appendChild(criar("p", "rank-nota", "* " + cfg.TEXTOS.rankingConvidado));
      }
    },

    /* ---------- Relatório ----------

       desfecho: número da tentativa em que venceu, "X" para
       derrota, ou null para consulta com partida em andamento. */
    abrirRelatorio: function (desfecho) {
      var dados = TERM.estatisticas.dados;
      var partida = TERM.partida;

      this.definirTexto("#rel-comando",
        "--jogador " + TERM.jogador.nome + " --rodada " + partida.rodada);

      this.definirTexto("#rel-jogos", dados.jogos);
      this.definirTexto("#rel-sequencia", dados.sequencia);
      this.definirTexto("#rel-recorde", dados.recorde);
      this.atualizarTempo();

      var veredito = document.querySelector("#rel-veredito");
      var subtitulo = document.querySelector("#rel-tempo-sub");

      if (TERM.solver.resolveuUltima) {
        /* Partida da máquina: estatísticas paradas e sem tempo.
           Dizer "acertou" aqui leria como defeito. */
        veredito.className = "veredito";
        veredito.innerHTML = desfecho === "X"
          ? cfg.TEXTOS.relatorioSolverFalhou(partida.solucao)
          : cfg.TEXTOS.relatorioSolverVeredito(desfecho);
        subtitulo.textContent = cfg.TEXTOS.relatorioSolverSub;
      } else if (desfecho === "X") {
        veredito.className = "veredito derrota";
        veredito.innerHTML = "não acertou — a palavra era <b>" +
                             partida.solucao + "</b>";
        subtitulo.textContent = "nesta partida, sem acerto em 6 tentativas";
      } else if (typeof desfecho === "number") {
        veredito.className = "veredito";
        veredito.innerHTML = "<span class='marca'><b>TERM</b>inal</span>" +
                             " — acertou na tentativa <b>" + desfecho + "</b> de 6";
        subtitulo.textContent = "nesta partida com " + desfecho +
                                (desfecho === 1 ? " tentativa" : " tentativas");
      } else {
        veredito.className = "veredito";
        veredito.innerHTML = "partida em andamento — tentativa <b>" +
                             (partida.linha + 1) + "</b> de 6";
        subtitulo.textContent = "decorrido até agora";
      }

      this.abrir(this.relatorio, "#btn-sortear");

      /* Em andamento, o relatório é consulta e o tempo precisa
         seguir correndo. Encerrada, a duração é final. */
      if (TERM.percurso.emAndamento()) this.iniciarCronometro();
    },

    fecharRelatorio: function () {
      this.pararCronometro();
      this.fechar(this.relatorio);
    },

    atualizarTempo: function () {
      this.definirTexto("#rel-tempo", utils.formatarTempo(TERM.percurso.duracao()));
    },

    iniciarCronometro: function () {
      this.pararCronometro();
      var self = this;
      this.cronometro = setInterval(function () {
        /* Encerrar com o relatório aberto congela o valor. */
        if (!TERM.percurso.emAndamento()) return self.pararCronometro();
        self.atualizarTempo();
      }, cfg.INTERVALO_CRONOMETRO);
    },

    pararCronometro: function () {
      if (this.cronometro === null) return;
      clearInterval(this.cronometro);
      this.cronometro = null;
    },

    definirTexto: function (seletor, valor) {
      var el = document.querySelector(seletor);
      if (el) el.textContent = valor;
    }
  };

})(window.TERM);
