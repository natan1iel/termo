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
      celula(grade, String(l.jogos), meu);
      celula(grade, String(l.vitorias), meu);
      celula(grade, Math.round(100 * l.taxa) + "%", meu);
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

    aberta: function () {
      return document.querySelector(".sobreposicao.aberto");
    },

    abrirLogin: function (nomeAtual) {
      var campo = document.querySelector("#campo-nome");
      if (campo) campo.value = nomeAtual || "";
      this.abrir(this.login, "#campo-nome");
      if (campo) campo.select();
    },

    fecharLogin: function () {
      this.fechar(this.login);
    },

    nomeInformado: function () {
      return document.querySelector("#campo-nome").value;
    },

    abrirResolver: function () {
      this.abrir(this.resolver, "#btn-cancelar");
    },

    fecharResolver: function () {
      this.fechar(this.resolver);
    },

    abrirRanking: function () {
      this.desenharRanking(TERM.estatisticas.ranking());
      this.abrir(this.ranking, "#btn-fechar-ranking");
    },

    fecharRanking: function () {
      this.fechar(this.ranking);
    },

    desenharRanking: function (lista) {
      var corpo = document.querySelector("#rank-corpo");
      var eu = TERM.estatisticas.chave;
      corpo.innerHTML = "";

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
