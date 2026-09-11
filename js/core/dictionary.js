/* ============================================================
   core/dictionary.js
   Banco de palavras. Mantidas COM acento: a comparação usa a
   forma normalizada, mas a revelação exibe o acento correto.
   Trocar esta lista não exige alteração em nenhum outro arquivo.
   ============================================================ */
(function (TERM) {
  "use strict";

  TERM.dictionary = {
    palavras: [
  "ABRIR", "AGUDO", "ALTAR", "AMIGO", "AMORA", "ANTES", "APOIO", "AREIA", "ARROZ", "ASSAR",
  "ATRÁS", "AUDAZ", "AVIÃO", "AZEDO", "BAIXO", "BALDE", "BANHO", "BARCO", "BEBER", "BEIJO",
  "BICHO", "BOLSA", "BONDE", "BRAÇO", "BRAVO", "BREVE", "BRISA", "CABRA", "CAIXA", "CALMA",
  "CAMPO", "CANTO", "CARRO", "CARTA", "CASAL", "CAUSA", "CEDRO", "CERCA", "CESTA", "CHAVE",
  "CHUVA", "CINCO", "CIRCO", "CLARO", "COBRA", "COLAR", "COMER", "CONTA", "CORAL", "CORPO",
  "CORTE", "COSTA", "COUVE", "CRAVO", "CREME", "CRIAR", "CULPA", "CURSO", "CURVA", "DANÇA",
  "DENTE", "DEVER", "DIGNO", "DISCO", "DOBRA", "DOIDO", "DUELO", "DUPLA", "ENTRE", "ESTAR",
  "ETAPA", "EXATO", "FALAR", "FALSO", "FARDO", "FAROL", "FAVOR", "FEBRE", "FEIRA", "FENDA",
  "FERRO", "FESTA", "FIBRA", "FICAR", "FILHO", "FILME", "FIRME", "FLORA", "FOGÃO", "FOLHA",
  "FONTE", "FORÇA", "FORMA", "FORNO", "FRACO", "FRASE", "FREIO", "FRUTA", "FURTO", "GALHO",
  "GANHO", "GARFO", "GENRO", "GESSO", "GLOBO", "GOLPE", "GORDO", "GOSTO", "GRADE", "GRAMA",
  "GRAVE", "GREVE", "GRITO", "GRUPO", "GUIAR", "HAVER", "HONRA", "HORTA", "HUMOR", "IDEAL",
  "IDEIA", "IGUAL", "ÍNDIO", "IRMÃO", "JOGAR", "JOVEM", "JUNTO", "JUSTO", "LAGOA", "LARGO",
  "LEGAL", "LEITE", "LENTO", "LEQUE", "LETRA", "LEVAR", "LIMÃO", "LIMPO", "LINDO", "LINHA",
  "LIVRE", "LIVRO", "LOCAL", "LONGE", "LOUÇA", "LOUCO", "LUCRO", "LUGAR", "LUTAR", "MACIO",
  "MAGRO", "MANGA", "MANHÃ", "MARCA", "MASSA", "MEDIR", "MEIGO", "MELÃO", "MENOR", "MENTE",
  "MESMO", "METAL", "METRO", "MEXER", "MOEDA", "MOLHO", "MONTE", "MORAL", "MORRO", "MOTOR",
  "MOVER", "MUDAR", "MUITO", "MUNDO", "MURAL", "MUSEU", "NADAR", "NARIZ", "NAVIO", "NERVO",
  "NÍVEL", "NOBRE", "NOITE", "NOIVA", "NORMA", "NORTE", "NOSSO", "NUNCA", "NUVEM", "OLHAR",
  "ONTEM", "ÓPERA", "ORDEM", "OUTRO", "OUVIR", "PACTO", "PADRE", "PAGAR", "PALCO", "PANDA",
  "PAPEL", "PARAR", "PARDO", "PARTE", "PASSO", "PASTA", "PÁTIO", "PAUSA", "PEDIR", "PEDRA",
  "PEIXE", "PERDA", "PERTO", "PESAR", "PESCA", "PILAR", "PINTO", "PISTA", "PLACA", "PLANO",
  "PLENO", "POBRE", "PODER", "POEMA", "POETA", "POLPA", "PONTA", "PONTE", "PORCO", "PORTA",
  "PORTE", "POSTO", "POUCO", "PRADO", "PRATA", "PRATO", "PRAZO", "PREÇO", "PREGO", "PRESA",
  "PRETO", "PRIMO", "PROSA", "PROVA", "PULSO", "PUNHO", "QUASE", "QUEDA", "RÁDIO", "RAIVA",
  "RAPAZ", "REGRA", "REINO", "REMAR", "RENDA", "RESTO", "REZAR", "RISCO", "RITMO", "RIVAL",
  "ROCHA", "RODAR", "ROSTO", "ROUPA", "RUMOR", "SABER", "SABOR", "SAGAZ", "SALÃO", "SALTO",
  "SANTO", "SAÚDE", "SELVA", "SENDO", "SENHA", "SERRA", "SERVO", "SETOR", "SINAL", "SOBRE",
  "SOLAR", "SOLTO", "SONHO", "SORTE", "SUAVE", "SUBIR", "SURDO", "TALCO", "TALHO", "TAMPA",
  "TARDE", "TECER", "TECLA", "TELHA", "TEMPO", "TENDA", "TÊNIS", "TERÇO", "TERMO", "TERRA",
  "TESTE", "TEXTO", "TIGRE", "TINTA", "TIRAR", "TOCAR", "TOMAR", "TORRE", "TOSSE", "TRAÇO",
  "TRAMA", "TRAVE", "TRIBO", "TRIGO", "TROCA", "TROCO", "TRONO", "TROPA", "TURMA", "UNIÃO",
  "USADO", "USINA", "VALER", "VALOR", "VAPOR", "VARAL", "VAZIO", "VELHO", "VENDA", "VENTO",
  "VERBO", "VERDE", "VERSO", "VIDRO", "VIGIA", "VILÃO", "VINHO", "VIOLA", "VIRAR", "VÍRUS",
  "VISTA", "VIVER", "VOLTA", "VULTO", "ZEBRA"
    ],

    /* Conjunto normalizado, usado na validação das tentativas.
       Construído uma vez no carregamento. */
    validas: null,

    init: function () {
      this.validas = new Set(this.palavras.map(TERM.utils.normalizar));
      return this;
    },

    existe: function (palavraNormalizada) {
      return this.validas.has(palavraNormalizada);
    },

    total: function () {
      return this.palavras.length;
    }
  };

})(window.TERM);
