/**
 * @author Gilliard Lopes
 * created on 22.04.2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.entities.sectors')
    .controller('SectorListCtrl', SectorListCtrl);

  /** @ngInject */
  function SectorListCtrl($scope, $state, $stateParams, sectorAPI, setores) {
    //var vm = this;
    //vm.messages = mailMessages.getMessagesByLabel($stateParams.label);
    //vm.label = $stateParams.label;

    console.log('setores - List controller');
    $scope.smartTablePageSize = 10;
    console.log('Setores pelo Resolve: ', setores);
    if(!setores)
      alert('Houve um problema de captura das informações no banco de dados');
    else
      $scope.setores = setores.data;

    $scope.delete = function (id, index) {

      sectorAPI.delete(id).then(function sucessCallback(response){

        console.log('deletou?', response.data);
        $scope.successMsg = response.data.message;
        console.log('msg: ', $scope.successMsg);
        //$scope.load();
	    //  não vai fucnionar o splice nessa smartTable...
      	//$scope.setores.splice(index, 1);
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
