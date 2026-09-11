/* ============================================================
   solver.js
   Resolução algorítmica — A IMPLEMENTAR.

   Este arquivo é o único ponto que precisa ser escrito para
   atender ao item "resolver algoritmicamente" do escopo. A
   interface, a confirmação e o encerramento da partida já
   estão prontos e chamam executar() ao final do fluxo.

   ------------------------------------------------------------
   CONTRATO SUGERIDO

   proximaTentativa(candidatas, historico) -> string
     candidatas  lista de palavras ainda compatíveis
     historico   [{ palavra, resultado }] das tentativas feitas
     retorno     a palavra a submeter, em forma normalizada

   O laço de execução ficaria em executar(): a cada passo,
   escolher a palavra, submetê-la pelo mesmo caminho de uma
   tentativa humana e filtrar as candidatas com o retorno
   obtido, até acertar ou esgotar as 6 tentativas.

   ------------------------------------------------------------
   FERRAMENTAS JÁ DISPONÍVEIS

   TERM.dictionary.palavras       lista completa
   TERM.utils.normalizar(txt)     remove acentos e cedilha
   TERM.engine.avaliar(a, b)      retorno de uma tentativa
   TERM.engine.venceu(resultado)  verifica acerto total
   TERM.partida.resultados        retornos já obtidos
   TERM.app.submeterTentativa()   caminho normal de submissão

   ------------------------------------------------------------
   FILTRAGEM DE CANDIDATAS

   Uma palavra continua candidata se, avaliada contra cada
   tentativa já feita, produziria exatamente o mesmo retorno
   que foi observado. Como avaliar() é simétrica nesse uso,
   o filtro sai direto dela:

     candidatas.filter(function (palavra) {
       return historico.every(function (h) {
         var esperado = TERM.engine.avaliar(h.palavra, palavra);
         return esperado.join() === h.resultado.join();
       });
     });

   A estratégia de escolha dentro das candidatas fica a seu
   critério: primeira da lista, maior cobertura de letras
   frequentes, maior redução esperada do espaço de busca.
   ============================================================ */
(function (TERM) {
  "use strict";

  TERM.solver = {

    /* Filtra as palavras ainda compatíveis com tudo que já foi
       observado. Deixada pronta por ser independente da
       estratégia escolhida. */
    filtrarCandidatas: function (candidatas, historico) {
      return candidatas.filter(function (palavra) {
        var alvo = TERM.utils.normalizar(palavra);
        return historico.every(function (registro) {
          var esperado = TERM.engine.avaliar(registro.palavra, alvo);
          return esperado.join() === registro.resultado.join();
        });
      });
    },

    /* A IMPLEMENTAR: escolha da próxima palavra. */
    proximaTentativa: function (candidatas) {
      return candidatas.length ? TERM.utils.normalizar(candidatas[0]) : null;
    },

    /* A IMPLEMENTAR: laço de resolução.
       Por ora apenas encerra a partida e informa a pendência. */
    executar: function () {
      TERM.modals.fecharResolver();
      TERM.partida.encerrada = true;
      TERM.percurso.descartar();

      TERM.log.escrever("solver", TERM.config.TEXTOS.solverPendente, "aviso");
      TERM.log.escrever("solver",
        "a palavra era <b>" + TERM.partida.solucao + "</b>", "aviso");
    }
  };

})(window.TERM);
