/**
 * @author Gilliard Lopes
 * created on 22.04.2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.eventosabono')
    .controller('EventoAbonoListCtrl', EventoAbonoListCtrl)
    .controller('ModalDeleteEventoAbonoCtrl', ModalDeleteEventoAbonoCtrl);

  /** @ngInject */
  function EventoAbonoListCtrl($scope, $state, $stateParams, $uibModal, eventosAbonoAPI, eventosAbono) {
    
    console.log('eventosAbono - List controller');
    $scope.smartTablePageSize = 15;
    var defaultSize = 'md';
    var pageDeletePath = 'app/pages/eventos_abono/list/deleteModal.html';
    //var eventosAbono = [];

    console.log('eventosAbono pelo Resolve: ', eventosAbono.data);
    if (!eventosAbono)
      alert('Houve um problema de captura das informações no banco de dados');
    else 
      $scope.eventosAbono = eventosAbono.data;

    $scope.delete = function (id, index) {

      var modalInstance = $uibModal.open({
        animation: true,
        templateUrl: pageDeletePath,
        size: defaultSize,
        controller: 'ModalDeleteEventoAbonoCtrl',
        resolve: {
          eventoAbono: function (eventosAbonoAPI) {
            return eventosAbonoAPI.getEventoAbono(id);
          }
        }
      });

      modalInstance.result.then(function (confirmation) {
        console.log('confirmação: ', confirmation);
        if (confirmation){
          $state.reload();
        }
      }, function () {
        console.log('modal-component dismissed at: ' + new Date());
      });
    }
  };

  function ModalDeleteEventoAbonoCtrl ($uibModalInstance, $scope, eventoAbono, eventosAbonoAPI) {
    
    $scope.eventoAbono = eventoAbono.data;
    console.log('$scope.eventoAbono ', $scope.eventoAbono);
    var $ctrl = this;
    $ctrl.confirmation = true;

    $scope.delete = function(){
      
      eventosAbonoAPI.delete($scope.eventoAbono._id).then(function sucessCallback(response){

        console.log('deletou?', response.data);
        $scope.successMsg = response.data.message;
        console.log('msg: ', $scope.successMsg);
        $uibModalInstance.close($ctrl.confirmation);

      }, function errorCallback(response){

        console.log('erro ao deletar ', response.data.message);
        $scope.errorMsg = response.data.message;
      });
    }
  };

})();
