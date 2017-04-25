/**
 * @author Gilliard Lopes
 * created on 21.04.2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.entities.institutions')
    .controller('InstitutionListCtrl', InstitutionListCtrl);

  /** @ngInject */
  function InstitutionListCtrl($scope, $state, $stateParams, institutionAPI, instituicoes) {
    //var vm = this;
    //vm.messages = mailMessages.getMessagesByLabel($stateParams.label);
    //vm.label = $stateParams.label;

    console.log('List controller');
    $scope.smartTablePageSize = 5;
    console.log('Instituicoes pelo Resolve: ', instituicoes);
    $scope.instituicoes = instituicoes.data;

    $scope.delete = function (id, index) {

      institutionAPI.delete(id).then(function sucessCallback(response){

        console.log('deletou?', response.data);
        $scope.successMsg = response.data.message;
        console.log('msg: ', $scope.successMsg);
        //$scope.load();
	    //  não vai fucnionar o splice nessa smartTable...
      	//$scope.instituicoes.splice(index, 1);
        $state.reload();

      }, function errorCallback(response){

        console.log('erro ao deletar ', response.data.message);
        $scope.errorMsg = response.data.message;
      });
    }

    $scope.edit = function(instituicaoId) {

       // $location.path("/editInstituicao/"+instituicaoId);
    }

    $scope.new = function() {

        $state.go('entities.campus');
    }
  }

})();
