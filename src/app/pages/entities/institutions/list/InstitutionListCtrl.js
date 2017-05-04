/**
 * @author Gilliard Lopes
 * created on 21.04.2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.entities.institutions')
    .controller('InstitutionListCtrl', InstitutionListCtrl)
    .controller('ModalDeleteInstitutionCtrl', ModalDeleteInstitutionCtrl);

  /** @ngInject */
  function InstitutionListCtrl($scope, $state, $stateParams, $uibModal, institutionAPI, instituicoes) {
    //var vm = this;
    //vm.messages = mailMessages.getMessagesByLabel($stateParams.label);
    //vm.label = $stateParams.label;

    console.log('List controller');
    $scope.smartTablePageSize = 10;
    console.log('Instituicoes pelo Resolve: ', instituicoes);
    var pageDeletePath = 'app/pages/entities/institutions/list/deleteModal.html';
    var defaultSize = 'md';

    if (!instituicoes)
      alert('Houve um problema de captura das informações no banco de dados');
    else
      $scope.instituicoes = instituicoes.data;

    $scope.delete = function (id, index) {

      var modalInstance = $uibModal.open({
        animation: true,
        templateUrl: pageDeletePath,
        size: defaultSize,
        controller: 'ModalDeleteInstitutionCtrl',
        resolve: {
          institution: function (institutionAPI) {
            return institutionAPI.getInstituicao(id);
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

  function ModalDeleteInstitutionCtrl ($uibModalInstance, $scope, institution, institutionAPI) {
    
    $scope.institution = institution.data;
    var $ctrl = this;
    $ctrl.confirmation = true;

    $scope.delete = function(){
      institutionAPI.delete($scope.institution._id).then(function sucessCallback(response){

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
