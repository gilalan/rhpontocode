/**
 * @author Gilliard Lopes
 * created on 22.04.2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.feriados')
    .controller('FeriadoListCtrl', FeriadoListCtrl);

  /** @ngInject */
  function FeriadoListCtrl($scope, $state, $stateParams, feriadoAPI, feriados) {
    //var vm = this;
    //vm.messages = mailMessages.getMessagesByLabel($stateParams.label);
    //vm.label = $stateParams.label;}
    console.log('feriados - List controller');
    $scope.smartTablePageSize = 10;
    //var feriados = [];
    console.log('feriados pelo Resolve: ', feriados);
    if (!feriados)
      alert('Houve um problema de captura das informações no banco de dados');
    else 
      $scope.feriados = feriados.data;

    $scope.delete = function (id, index) {

      feriadoAPI.delete(id).then(function sucessCallback(response){

        console.log('deletou?', response.data);
        $scope.successMsg = response.data.message;
        console.log('msg: ', $scope.successMsg);
        //$scope.load();
	    //  não vai fucnionar o splice nessa smartTable...
      	//$scope.equipes.splice(index, 1);
        //Tem que dar refresh!
        $state.reload();

      }, function errorCallback(response){

        console.log('erro ao deletar ', response.data.message);
        $scope.errorMsg = response.data.message;
      });
    }

  }

})();
