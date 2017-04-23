/**
 * @author Gilliard Lopes
 * created on 22.04.2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.jobs')
    .controller('ShiftListCtrl', ShiftListCtrl);

  /** @ngInject */
  function ShiftListCtrl($scope, $state, $stateParams, shiftAPI, turnos) {
    //var vm = this;
    //vm.messages = mailMessages.getMessagesByLabel($stateParams.label);
    //vm.label = $stateParams.label;}

    console.log('turnos - List controller');
    $scope.smartTablePageSize = 5;
    console.log('turnos pelo Resolve: ', turnos);
    $scope.turnos = turnos.data;

    $scope.delete = function (id, index) {

      shiftAPI.delete(id).then(function sucessCallback(response){

        console.log('deletou?', response.data);
        $scope.successMsg = response.data.message;
        console.log('msg: ', $scope.successMsg);
        //$scope.load();
	    //  não vai fucnionar o splice nessa smartTable...
      	//$scope.equipes.splice(index, 1);
        //Tem que dar refresh!

      }, function errorCallback(response){

        console.log('erro ao deletar ', response.data.message);
        $scope.errorMsg = response.data.message;
      });
    }

  }

})();
