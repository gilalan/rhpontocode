/**
 * @author Gilliard Lopes
 * created on 22.04.2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.eventosabono')
      .controller('EditEventoAbonoCtrl', EditEventoAbonoCtrl);

  /** @ngInject */
  function EditEventoAbonoCtrl($scope, $filter, $window, $state, eventosAbonoAPI, eventoAbono, util) {
    
    console.log('eventoAbono recebido pelo resolve: ', eventoAbono)
    //dados
    $scope.title = 'Editar';
    $scope.eventoAbono = eventoAbono.data;

    $scope.save = function (eventoAbono) {
      
      if (eventoAbono != null && eventoAbono.nome != ""){

        console.log('eventoAbono a ser enviado:', eventoAbono);

        eventosAbonoAPI.update(eventoAbono).then(function sucessCallback(response){

          console.log('dados recebidos da atualização: ', response.data);
          $scope.successMsg = response.data.message;      
          
          //back to list
          $state.go('eventosabono.list');

        }, function errorCallback(response){
          
          $scope.errorMsg = response.data.message;
          console.log('Erro de registro: ' + response.data.message);
          
        });   
      } 
      else {
        alert("O Evento de Abono tem que ter um nome.");
      }
        
    }
  }

})();
