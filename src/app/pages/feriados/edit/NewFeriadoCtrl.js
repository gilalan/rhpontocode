/**
 * @author Gilliard Lopes
 * created on 22.04.2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.feriados')
      .controller('NewFeriadoCtrl', NewFeriadoCtrl);

  /** @ngInject */
  function NewFeriadoCtrl($scope, $filter, $state, feriadoAPI) {

    $scope.title = 'Novo';
    $scope.feriado = {fixo: true};
        
    $scope.save = function (feriado) {
      
      if (!feriado.fixo)
        feriado.fixo = false;
      
      console.log('feriado enviado: ', feriado);

      feriadoAPI.create(feriado).then(function sucessCallback(response){

        console.log("dados recebidos: ", response.data);
        $scope.successMsg = response.data.message;      
        
        //back to list
        $state.go('feriados.list');

      }, function errorCallback(response){
        
        $scope.errorMsg = response.data.message;
        console.log("Erro de registro: " + response.data.message);
        
      });   
    }
  }

})();
