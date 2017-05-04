/**
 * @author Gilliard Lopes
 * created on 22.04.2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.jobs')
    .controller('JobListCtrl', JobListCtrl)
    .controller('ModalDeleteJobsCtrl', ModalDeleteJobsCtrl);

  /** @ngInject */
  function JobListCtrl($scope, $state, $stateParams, $uibModal, jobAPI, cargos) {
    //var vm = this;
    //vm.messages = mailMessages.getMessagesByLabel($stateParams.label);
    //vm.label = $stateParams.label;}

    console.log('cargos - List controller');
    $scope.smartTablePageSize = 10;
    console.log('cargos pelo Resolve: ', cargos);
    var pageDeletePath = 'app/pages/jobs/list/deleteModal.html';
    var defaultSize = 'md';

    if(!cargos)
      alert('Houve um problema de captura das informações no banco de dados');
    else
      $scope.cargos = cargos.data;

    $scope.delete = function (id, index) {

      var modalInstance = $uibModal.open({
        animation: true,
        templateUrl: pageDeletePath,
        size: defaultSize,
        controller: 'ModalDeleteJobsCtrl',
        resolve: {
          cargo: function (jobAPI) {
            return jobAPI.getCargo(id);
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

  function ModalDeleteJobsCtrl ($uibModalInstance, $scope, cargo, jobAPI) {
    
    $scope.cargo = cargo.data;
    var $ctrl = this;
    $ctrl.confirmation = true;

    $scope.delete = function(){
      
      jobAPI.delete($scope.cargo._id).then(function sucessCallback(response){

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
