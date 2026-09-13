/* ============================================================
   core/config.js
   Namespace raiz e parâmetros do jogo.

   Este é o primeiro arquivo carregado: cria o objeto global
   TERM, do qual todos os demais módulos dependem.

   Textos ficam aqui, e não espalhados pelo código, para que
   ajuste de redação ou tradução aconteça em um lugar só.
   ============================================================ */
window.TERM = window.TERM || {};

(function (TERM) {
  "use strict";

  TERM.config = {
    /* Regras estruturais */
    LINHAS: 6,
    COLUNAS: 5,

    /* Identificação */
    NOME_PADRAO: "convidado",
    TAMANHO_MAXIMO_NOME: 16,

    /* Tempos de animação, em milissegundos */
    ATRASO_POR_LETRA: 180,
    ESPERA_APOS_REVELACAO: 200,
    ATRASO_RELATORIO_VITORIA: 900,
    ATRASO_RELATORIO_DERROTA: 700,

    /* Passo do cronômetro do relatório. Menor que um segundo
       para que a virada do mostrador não atrase até um segundo
       inteiro em relação ao tempo real. */
    INTERVALO_CRONOMETRO: 250,

    /* ---------- Solucionador ----------

       As três aberturas são jogadas sempre, nesta ordem, sem
       olhar o resultado das anteriores. Valem pelo conjunto, e
       não uma a uma: juntas testam 15 letras distintas sem
       nenhuma sobreposição — A D E F I L M N O P R S T U Z.
       Da quarta em diante a escolha passa a ser por entropia.  */
    SOLVER_ABERTURAS: ["TRENS", "PODAM", "FUZIL"],

    /* Folga sobre a duração da revelação antes do próximo
       chute. Sem ela o passo do solver disputaria o mesmo
       instante com o desenho que submeterTentativa agenda. */
    SOLVER_PAUSA: 150,

    /* Estados possíveis de uma letra avaliada */
    ESTADO: {
      CORRETA: "correct",
      PRESENTE: "present",
      AUSENTE: "absent"
    },

    /* Precedência usada no teclado: um estado nunca regride */
    PRIORIDADE: {
      absent: 1,
      present: 2,
      correct: 3
    },

    /* Símbolo de cada estado nas linhas do registro */
    MARCA: {
      correct: "+",
      present: "~",
      absent: "-"
    },

    /* Classe CSS de cor de cada estado nas linhas do registro */
    CLASSE_MARCA: {
      correct: "g",
      present: "y",
      absent: "n"
    },

    /* Layout do teclado virtual */
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
      solverResolveu: function (tentativas) {
        return "resolvido em " + tentativas +
               (tentativas === 1 ? " tentativa" : " tentativas");
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
      relatorioSolverSub: "partida automática — fora do registro de desempenho"
    }
  };

})(window.TERM);
