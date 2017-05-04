/**
 * @author Gilliard Lopes
 * created on 22.04.2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.jobs')
    .controller('ShiftListCtrl', ShiftListCtrl)
    .controller('ModalDeleteShiftCtrl', ModalDeleteShiftCtrl);

  /** @ngInject */
  function ShiftListCtrl($scope, $state, $uibModal, $stateParams, shiftAPI, turnos) {
    
    console.log('turnos - List controller');
    $scope.smartTablePageSize = 5;
    console.log('turnos pelo Resolve: ', turnos);
    $scope.turnos = turnos.data;
    var defaultSize = 'md';
    var pageDeletePath = 'app/pages/shifts/list/deleteModal.html';

    $scope.delete = function (id, index) {

      var modalInstance = $uibModal.open({
        animation: true,
        templateUrl: pageDeletePath,
        size: defaultSize,
        controller: 'ModalDeleteShiftCtrl',
        resolve: {
          turno: function (shiftAPI) {
            return shiftAPI.getTurno(id);
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

  function ModalDeleteShiftCtrl ($uibModalInstance, $scope, turno, shiftAPI) {
    
    $scope.turno = turno.data;
    var $ctrl = this;
    $ctrl.confirmation = true;

    $scope.delete = function(){
      
      shiftAPI.delete($scope.turno._id).then(function sucessCallback(response){

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
