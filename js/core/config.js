window.TERM = window.TERM || {};

(function (TERM) {
  "use strict";

  TERM.config = {
    LINHAS: 6,
    COLUNAS: 5,

    NOME_PADRAO: "convidado",
    TAMANHO_MAXIMO_NOME: 16,

    ATRASO_POR_LETRA: 180,
    ESPERA_APOS_REVELACAO: 200,
    ATRASO_RELATORIO_VITORIA: 900,
    ATRASO_RELATORIO_DERROTA: 700,

    INTERVALO_CRONOMETRO: 250,

    SOLVER_ABERTURAS: ["TRENS", "PODAM", "FUZIL"],

    SOLVER_PAUSA: 150,

    ARMAZENAMENTO_CHAVE: "terminal.ranking",

    RANKING_PESO: 5,

    ESTADO: {
      CORRETA: "correct",
      PRESENTE: "present",
      AUSENTE: "absent"
    },

    PRIORIDADE: {
      absent: 1,
      present: 2,
      correct: 3
    },

    MARCA: {
      correct: "+",
      present: "~",
      absent: "-"
    },

    CLASSE_MARCA: {
      correct: "g",
      present: "y",
      absent: "n"
    },

    TECLADO: [
      ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
      ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
      ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "APAGAR"]
    ],

    TEXTOS: {
      boot: "TERMinal",
      ajuda: [
        "descubra a palavra de 5 letras em 6 tentativas",
        "acentos são automáticos: digite <b>AVIAO</b> para AVIÃO",
        "a palavra pode ter letras repetidas"
      ],
      sorteio: "palavra-solução sorteada",
      pronto: "aguardando entrada…",
      faltamLetras: function (quantas) {
        return "faltam " + quantas + " letra(s)";
      },
      palavraInvalida: function (palavra) {
        return palavra + " não é uma palavra válida";
      },
      tentativasRestantes: function (quantas) {
        return quantas + " tentativa(s) restante(s)";
      },
      acertou: function (tentativas) {
        return "acertou em " + tentativas +
               (tentativas === 1 ? " tentativa" : " tentativas");
      },
      naoAcertou: function (palavra) {
        return "a palavra era <b>" + palavra + "</b>";
      },
      solverAssumiu: "solucionador assumiu a partida",
      solverAberturas: function (palavras) {
        return "abertura fixa: " + palavras.join(" · ");
      },
      solverCandidatas: function (quantas) {
        return quantas + (quantas === 1 ? " candidata restante"
                                        : " candidatas restantes");
      },
      solverEscolha: function (palavra, bits) {
        return "entropia escolheu <b>" + palavra + "</b> (" + bits + " bits)";
      },
      solverInterrompido: function (motivo) {
        return "execução interrompida — " + motivo;
      },
      solverSemCandidatas: "nenhuma candidata compatível restou",
      solverCancelado: "cancelado pelo jogador",
      solverRecusada: function (palavra) {
        return "a grade recusou " + palavra;
      },
      relatorioSolverVeredito: function (tentativas) {
        return "resolvido pelo algoritmo na tentativa <b>" +
               tentativas + "</b> de 6";
      },
      relatorioSolverFalhou: function (palavra) {
        return "o algoritmo não encontrou — a palavra era <b>" + palavra + "</b>";
      },
      relatorioSolverSub: "partida automática — fora do registro de desempenho",

      rankingVazio: "nenhuma partida registrada ainda",
      rankingClassificados: "CLASSIFICAÇÃO",
      rankingColunas: [
        { rotulo: "#",             ajuda: "posição" },
        { rotulo: "jogador",       ajuda: "quem jogou" },
        { rotulo: "rodadas",       ajuda: "partidas jogadas" },
        { rotulo: "vitórias",      ajuda: "partidas vencidas" },
        { rotulo: "taxa",          ajuda: "percentual de vitórias" },
        { rotulo: "tent./vitória", ajuda: "tentativas por acerto" },
        { rotulo: "tempo",         ajuda: "mediana das vitórias" }
      ],
      rankingConvidado: "partidas sem identificação"
    }
  };

})(window.TERM);
