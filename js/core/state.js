(function (TERM) {
  "use strict";

  var cfg = TERM.config;

  TERM.jogador = {
    nome: cfg.NOME_PADRAO,

    definir: function (nome) {
      var limpo = TERM.utils.limparNome(nome, cfg.TAMANHO_MAXIMO_NOME);
      this.nome = limpo || cfg.NOME_PADRAO;
      return this.nome;
    }
  };

  TERM.partida = {
    solucao: "",
    solucaoNormalizada: "",
    linha: 0,
    letras: [],
    cursor: 0,
    encerrada: false,
    contabilizada: false,
    rodada: 0,
    resultados: [],
    estadosTeclado: {},

    iniciar: function (solucao, rodada) {
      this.solucao = solucao;
      this.solucaoNormalizada = TERM.utils.normalizar(solucao);
      this.linha = 0;
      this.limparLinha();
      this.encerrada = false;
      this.contabilizada = false;
      this.rodada = rodada;
      this.resultados = [];
      this.estadosTeclado = {};
    },

    limparLinha: function () {
      this.letras = new Array(cfg.COLUNAS).fill("");
      this.cursor = 0;
    },

    texto: function () {
      return this.letras.join("");
    },

    lacunas: function () {
      return this.letras.filter(function (letra) {
        return letra === "";
      }).length;
    },

    completa: function () {
      return this.lacunas() === 0;
    },

    proximaLacuna: function (partindoDe) {
      for (var c = partindoDe; c < cfg.COLUNAS; c++) {
        if (this.letras[c] === "") return c;
      }
      return -1;
    },

    digitar: function (letra) {
      this.letras[this.cursor] = letra;
      var proxima = this.proximaLacuna(this.cursor + 1);
      if (proxima !== -1) this.cursor = proxima;
      return true;
    },

    apagar: function () {
      if (this.letras[this.cursor] !== "") {
        this.letras[this.cursor] = "";
        return true;
      }
      if (this.cursor === 0) return false;
      this.cursor--;
      this.letras[this.cursor] = "";
      return true;
    },

    mover: function (passo) {
      return this.irPara(this.cursor + passo);
    },

    irPara: function (coluna) {
      if (coluna < 0 || coluna >= cfg.COLUNAS) return false;
      this.cursor = coluna;
      return true;
    },

    tentativasRestantes: function () {
      return cfg.LINHAS - this.linha - 1;
    },

    ehUltimaLinha: function () {
      return this.linha === cfg.LINHAS - 1;
    },

    avancarLinha: function () {
      this.linha++;
      this.limparLinha();
    }
  };

  TERM.percurso = {
    atual: null,
    historico: [],

    iniciar: function (jogador, solucao) {
      this.atual = {
        jogador: jogador,
        palavra: solucao,
        inicio: Date.now(),
        fim: null,
        duracaoMs: null,
        venceu: false,
        tentativas: []
      };
    },

    registrarTentativa: function (palavra, resultado) {
      if (!this.atual) return;
      this.atual.tentativas.push({
        palavra: palavra,
        resultado: resultado.slice(),
        msDecorridos: Date.now() - this.atual.inicio
      });
    },

    emAndamento: function () {
      return !!(this.atual && !this.atual.fim);
    },

    duracao: function () {
      if (!this.atual) return null;
      return this.atual.fim
        ? this.atual.duracaoMs
        : Date.now() - this.atual.inicio;
    },

    encerrar: function (venceu) {
      if (!this.atual) return null;
      this.atual.fim = Date.now();
      this.atual.duracaoMs = this.atual.fim - this.atual.inicio;
      this.atual.venceu = venceu;
      this.historico.push(this.atual);
      return this.atual.duracaoMs;
    },

    descartar: function () {
      this.atual = null;
    }
  };

  function armazenamento() {
    try {
      return window.localStorage || null;
    } catch (erro) {
      return null;
    }
  }

  function registroVazio(nome) {
    return {
      nome: nome || cfg.NOME_PADRAO,
      jogos: 0,
      vitorias: 0,
      derrotas: 0,
      abandonos: 0,
      sequencia: 0,
      recorde: 0,
      zerarNaProxima: false,
      tentativas: new Array(cfg.LINHAS).fill(0),
      duracoes: [],
      melhorTempoS: null,
      ultimoJogo: null
    };
  }

  function inteiro(valor) {
    var n = Math.floor(Number(valor));
    return isFinite(n) && n > 0 ? n : 0;
  }

  function normalizarRegistro(bruto, nome) {
    var limpo = registroVazio(nome);
    if (!bruto || typeof bruto !== "object") return limpo;

    if (typeof bruto.nome === "string" && bruto.nome) limpo.nome = bruto.nome;
    limpo.jogos = inteiro(bruto.jogos);
    limpo.vitorias = inteiro(bruto.vitorias);
    limpo.derrotas = inteiro(bruto.derrotas);
    limpo.abandonos = inteiro(bruto.abandonos);
    limpo.sequencia = inteiro(bruto.sequencia);
    limpo.recorde = inteiro(bruto.recorde);
    limpo.zerarNaProxima = bruto.zerarNaProxima === true;
    limpo.ultimoJogo = inteiro(bruto.ultimoJogo) || null;

    if (Array.isArray(bruto.tentativas)) {
      for (var i = 0; i < cfg.LINHAS; i++) {
        limpo.tentativas[i] = inteiro(bruto.tentativas[i]);
      }
    }
    if (Array.isArray(bruto.duracoes)) {
      limpo.duracoes = bruto.duracoes.map(inteiro).filter(function (s) {
        return s > 0;
      });
    }
    limpo.melhorTempoS = inteiro(bruto.melhorTempoS) || null;
    return limpo;
  }

  function chaveDe(nome) {
    return "j:" + TERM.utils.normalizar(nome);
  }

  function mediana(lista) {
    if (!lista.length) return null;
    var ordenada = lista.slice().sort(function (a, b) { return a - b; });
    var meio = ordenada.length >> 1;
    return ordenada.length % 2
      ? ordenada[meio]
      : (ordenada[meio - 1] + ordenada[meio]) / 2;
  }

  TERM.estatisticas = {
    dados: null,
    jogadores: {},
    chave: null,

    init: function () {
      this.jogadores = this.carregar();
      this.dados = registroVazio();
      this.chave = null;
      return this;
    },

    carregar: function () {
      var ls = armazenamento();
      if (!ls) return {};

      var bruto;
      try {
        bruto = JSON.parse(ls.getItem(cfg.ARMAZENAMENTO_CHAVE));
      } catch (erro) {
        return {};
      }
      if (!bruto || typeof bruto !== "object" || Array.isArray(bruto) ||
          bruto.versao !== 1 || !bruto.jogadores ||
          typeof bruto.jogadores !== "object") {
        return {};
      }

      var limpos = {};
      for (var chave in bruto.jogadores) {
        if (!Object.prototype.hasOwnProperty.call(bruto.jogadores, chave)) continue;
        limpos[chave] = normalizarRegistro(bruto.jogadores[chave]);
      }
      return limpos;
    },

    salvar: function () {
      var ls = armazenamento();
      if (!ls || !this.chave) return;

      var todos = this.carregar();
      todos[this.chave] = this.dados;
      this.jogadores = todos;

      try {
        ls.setItem(cfg.ARMAZENAMENTO_CHAVE,
                   JSON.stringify({ versao: 1, jogadores: todos }));
      } catch (erro) {
      }
    },

    entrar: function (nome) {
      var doDisco = this.carregar();
      for (var k in doDisco) {
        if (Object.prototype.hasOwnProperty.call(doDisco, k)) {
          this.jogadores[k] = doDisco[k];
        }
      }

      this.chave = chaveDe(nome);

      var registro =
        Object.prototype.hasOwnProperty.call(this.jogadores, this.chave)
          ? this.jogadores[this.chave]
          : registroVazio(nome);

      registro.nome = nome;
      this.dados = registro;
      this.jogadores[this.chave] = registro;
      return registro;
    },

    registrar: function (venceu, duracaoMs, tentativas) {
      if (TERM.partida.contabilizada) return;
      TERM.partida.contabilizada = true;

      var d = this.dados;
      d.jogos++;
      d.ultimoJogo = Date.now();

      if (venceu) {
        d.vitorias++;
        d.sequencia++;
        if (d.sequencia > d.recorde) d.recorde = d.sequencia;

        var indice = Number(tentativas) - 1;
        if (indice >= 0 && indice < d.tentativas.length) d.tentativas[indice]++;

        var segundos = Math.max(1, Math.round(Number(duracaoMs) / 1000));
        if (isFinite(segundos)) {
          d.duracoes.push(segundos);
          if (d.melhorTempoS === null || segundos < d.melhorTempoS) {
            d.melhorTempoS = segundos;
          }
        }
      } else {
        d.derrotas++;
        d.zerarNaProxima = true;
      }

      this.salvar();
    },

    registrarAbandono: function () {
      if (TERM.partida.contabilizada) return false;
      this.dados.abandonos++;
      this.registrar(false, 0);
      return true;
    },

    aplicarResetPendente: function () {
      if (!this.dados || !this.dados.zerarNaProxima) return;
      this.dados.sequencia = 0;
      this.dados.zerarNaProxima = false;
      this.salvar();
    },

    ranking: function (peso) {
      var pesoRef = peso === undefined ? cfg.RANKING_PESO : peso;
      var penalidade = cfg.LINHAS + 1;
      var linhas = [];
      var somaGrupo = 0, jogosGrupo = 0;

      for (var chave in this.jogadores) {
        if (!Object.prototype.hasOwnProperty.call(this.jogadores, chave)) continue;
        var r = this.jogadores[chave];
        if (!r.jogos) continue;

        var somaVitorias = 0;
        for (var i = 0; i < r.tentativas.length; i++) {
          somaVitorias += (i + 1) * r.tentativas[i];
        }
        var gasto = somaVitorias + penalidade * r.derrotas;
        somaGrupo += gasto;
        jogosGrupo += r.jogos;

        linhas.push({
          chave: chave,
          nome: r.nome,
          jogos: r.jogos,
          vitorias: r.vitorias,
          gasto: gasto,
          taxa: r.vitorias / r.jogos,
          media: r.vitorias ? somaVitorias / r.vitorias : null,
          medianaS: mediana(r.duracoes)
        });
      }

      var referencia = jogosGrupo ? somaGrupo / jogosGrupo : penalidade;

      linhas.forEach(function (l) {
        l.pontos = (l.gasto + pesoRef * referencia) / (l.jogos + pesoRef);
        delete l.gasto;
      });

      return linhas.sort(function (a, b) {
        return a.pontos - b.pontos || b.taxa - a.taxa || b.jogos - a.jogos;
      });
    }
  };

})(window.TERM);
