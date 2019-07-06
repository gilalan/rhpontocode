/**
 * @author Gilliard Lopes
 * created on 22.04.2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.motivosajuste')
      .controller('NewMotivoAjusteCtrl', NewMotivoAjusteCtrl);

  /** @ngInject */
  function NewMotivoAjusteCtrl($scope, $filter, $window, $state, motivosAjusteAPI) {

    $scope.title = 'Novo';
    
    $scope.save = function (motivoAjuste) {
      
      if (motivoAjuste != null && motivoAjuste.nome != ""){

        console.log('motivoAjuste a ser enviado:', motivoAjuste);

        motivosAjusteAPI.create(motivoAjuste).then(function sucessCallback(response){

          console.log('dados recebidos da atualização: ', response.data);
          $scope.successMsg = response.data.message;      
          
          //back to list
          $state.go('motivosajuste.list');

        }, function errorCallback(response){
          
          $scope.errorMsg = response.data.message;
          console.log('Erro de registro: ' + response.data.message);
          
        });   
      } 
      else {
        alert("O Motivo de AJuste tem que ter um nome.");
      }
        
    };
  }

})();
