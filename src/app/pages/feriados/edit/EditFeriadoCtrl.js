/**
 * @author Gilliard Lopes
 * created on 22.04.2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.feriados')
      .controller('EditFeriadoCtrl', EditFeriadoCtrl);

  /** @ngInject */
  function EditFeriadoCtrl($scope, $filter, $state, feriadoAPI, feriado, util) {
    
    console.log('feriado recebido pelo resolve: ', feriado)
    //dados
    $scope.title = 'Editar';
    $scope.feriado = feriado.data;
    $scope.feriado.data = $filter('date')($scope.feriado.data, "dd/MM/yyyy");
    
    $scope.save = function (feriado) {
     
      console.log('feriado a ser enviado:', feriado);
      feriado.data = util.fixDateFormat(feriado.data);
      console.log('feriado a ser enviado corrigido:', feriado);

      if (!feriado.fixo)
        feriado.fixo = false;

      feriadoAPI.update(feriado).then(function sucessCallback(response){

        console.log('dados recebidos da atualização: ', response.data);
        $scope.successMsg = response.data.message;      
        
        //back to list
        $state.go('feriados.list');

      }, function errorCallback(response){
        
        $scope.errorMsg = response.data.message;
        console.log('Erro de registro: ' + response.data.message);
        
      });   
    }
  }

})();
