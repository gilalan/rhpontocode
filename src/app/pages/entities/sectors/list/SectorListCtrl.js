/**
 * @author Gilliard Lopes
 * created on 22.04.2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.entities.sectors')
    .controller('SectorListCtrl', SectorListCtrl)
    .controller('ModalDeleteSectorCtrl', ModalDeleteSectorCtrl);

  /** @ngInject */
  function SectorListCtrl($scope, $state, $stateParams, $uibModal, sectorAPI, setores) {
    //var vm = this;
    //vm.messages = mailMessages.getMessagesByLabel($stateParams.label);
    //vm.label = $stateParams.label;

    console.log('setores - List controller');
    $scope.smartTablePageSize = 10;
    console.log('Setores pelo Resolve: ', setores);
    var pageDeletePath = 'app/pages/entities/sectors/list/deleteModal.html';
    var defaultSize = 'md';

    if(!setores)
      alert('Houve um problema de captura das informações no banco de dados');
    else
      $scope.setores = setores.data;

    $scope.delete = function (id, index) {

      var modalInstance = $uibModal.open({
        animation: true,
        templateUrl: pageDeletePath,
        size: defaultSize,
        controller: 'ModalDeleteSectorCtrl',
        resolve: {
          setor: function (sectorAPI) {
            return sectorAPI.getSetor(id);
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

  function ModalDeleteSectorCtrl ($uibModalInstance, $scope, setor, sectorAPI) {
    
    $scope.setor = setor.data;
    var $ctrl = this;
    $ctrl.confirmation = true;

    $scope.delete = function(){
      
      sectorAPI.delete($scope.setor._id).then(function sucessCallback(response){

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
