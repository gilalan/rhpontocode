/**
 * @author Gilliard Lopes
 * created on 22.04.2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.motivosajuste')
      .controller('EditMotivoAjusteCtrl', EditMotivoAjusteCtrl);

  /** @ngInject */
  function EditMotivoAjusteCtrl($scope, $filter, $window, $state, motivosAjusteAPI, motivoAjuste, util) {
    
    console.log('motivoAjuste recebido pelo resolve: ', motivoAjuste)
    //dados
    $scope.title = 'Editar';
    $scope.motivoAjuste = motivoAjuste.data;

    $scope.save = function (motivoAjuste) {
      
      if (motivoAjuste != null && motivoAjuste.nome != ""){

        console.log('motivoAjuste a ser enviado:', motivoAjuste);

        motivosAjusteAPI.update(motivoAjuste).then(function sucessCallback(response){

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
        alert("O Motivo de Ajuste tem que ter um nome.");
      }
        
    }
  }

})();
