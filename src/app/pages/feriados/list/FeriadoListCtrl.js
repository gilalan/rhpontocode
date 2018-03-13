/**
 * @author Gilliard Lopes
 * created on 22.04.2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.feriados')
    .controller('FeriadoListCtrl', FeriadoListCtrl)
    .controller('ModalDeleteFeriadoCtrl', ModalDeleteFeriadoCtrl);

  /** @ngInject */
  function FeriadoListCtrl($scope, $state, $stateParams, $uibModal, feriadoAPI, feriados) {
    
    console.log('feriados - List controller');
    $scope.smartTablePageSize = 15;
    var defaultSize = 'md';
    var pageDeletePath = 'app/pages/feriados/list/deleteModal.html';
    //var feriados = [];

    console.log('feriados pelo Resolve: ', feriados);
    if (!feriados)
      alert('Houve um problema de captura das informações no banco de dados');
    else 
      $scope.feriados = feriados.data;

    $scope.delete = function (id, index) {

      var modalInstance = $uibModal.open({
        animation: true,
        templateUrl: pageDeletePath,
        size: defaultSize,
        controller: 'ModalDeleteFeriadoCtrl',
        resolve: {
          feriado: function (feriadoAPI) {
            return feriadoAPI.getFeriado(id);
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

  function ModalDeleteFeriadoCtrl ($uibModalInstance, $scope, feriado, feriadoAPI) {
    
    $scope.feriado = feriado.data;
    console.log('$scope.feriado ', $scope.feriado);
    var $ctrl = this;
    $ctrl.confirmation = true;

    $scope.delete = function(){
      
      feriadoAPI.delete($scope.feriado._id).then(function sucessCallback(response){

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
