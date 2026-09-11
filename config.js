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
      solverPendente: "solucionador ainda não implementado"
    }
  };

})(window.TERM);
