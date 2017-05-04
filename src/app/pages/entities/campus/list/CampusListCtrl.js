/**
 * @author Gilliard Lopes
 * created on 22.04.2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.entities.campus')
    .controller('CampusListCtrl', CampusListCtrl)
    .controller('ModalDeleteCampusCtrl', ModalDeleteCampusCtrl);

  /** @ngInject */
  function CampusListCtrl($scope, $state, $stateParams, $uibModal, campusAPI, campi) {
    //var vm = this;
    //vm.messages = mailMessages.getMessagesByLabel($stateParams.label);
    //vm.label = $stateParams.label;

    console.log('campi - List controller');
    $scope.smartTablePageSize = 10;
    console.log('Campi pelo Resolve: ', campi);
    var pageDeletePath = 'app/pages/entities/campus/list/deleteModal.html';
    var defaultSize = 'md';

    if (!campi)
      alert('Houve um problema de captura das informações no banco de dados');
    else
      $scope.campi = campi.data;

    $scope.delete = function (id, index) {

      var modalInstance = $uibModal.open({
        animation: true,
        templateUrl: pageDeletePath,
        size: defaultSize,
        controller: 'ModalDeleteCampusCtrl',
        resolve: {
          campus: function (campusAPI) {
            return campusAPI.getCampus(id);
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

  function ModalDeleteCampusCtrl ($uibModalInstance, $scope, campus, campusAPI) {
    
    $scope.campus = campus.data;
    var $ctrl = this;
    $ctrl.confirmation = true;

    $scope.delete = function(){
      
      campusAPI.delete($scope.campus._id).then(function sucessCallback(response){

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
