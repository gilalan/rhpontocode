/**
 * @author Gilliard Lopes
 * created on 22.04.2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.motivosajuste')
    .controller('MotivoAjusteListCtrl', MotivoAjusteListCtrl)
    .controller('ModalDeleteMotivoAjusteCtrl', ModalDeleteMotivoAjusteCtrl);

  /** @ngInject */
  function MotivoAjusteListCtrl($scope, $state, $stateParams, $uibModal, motivosAjusteAPI, motivosAjuste) {
    
    console.log('motivosAjuste - List controller');
    $scope.smartTablePageSize = 15;
    var defaultSize = 'md';
    var pageDeletePath = 'app/pages/motivos_ajuste/list/deleteModal.html';
    //var motivosAjuste = [];

    console.log('motivosAjuste pelo Resolve: ', motivosAjuste.data);
    if (!motivosAjuste)
      alert('Houve um problema de captura das informações no banco de dados');
    else 
      $scope.motivosAjuste = motivosAjuste.data;

    $scope.delete = function (id, index) {

      var modalInstance = $uibModal.open({
        animation: true,
        templateUrl: pageDeletePath,
        size: defaultSize,
        controller: 'ModalDeleteMotivoAjusteCtrl',
        resolve: {
          motivoAjuste: function (motivosAjusteAPI) {
            return motivosAjusteAPI.getMotivoAjuste(id);
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

  function ModalDeleteMotivoAjusteCtrl ($uibModalInstance, $scope, motivoAjuste, motivosAjusteAPI) {
    
    $scope.motivoAjuste = motivoAjuste.data;
    console.log('$scope.motivoAjuste ', $scope.motivoAjuste);
    var $ctrl = this;
    $ctrl.confirmation = true;

    $scope.delete = function(){
      
      motivosAjusteAPI.delete($scope.motivoAjuste._id).then(function sucessCallback(response){

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
