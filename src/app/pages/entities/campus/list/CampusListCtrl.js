/**
 * @author Gilliard Lopes
 * created on 22.04.2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.entities.campus')
    .controller('CampusListCtrl', CampusListCtrl);

  /** @ngInject */
  function CampusListCtrl($scope, $state, $stateParams, campusAPI, campi) {
    //var vm = this;
    //vm.messages = mailMessages.getMessagesByLabel($stateParams.label);
    //vm.label = $stateParams.label;

    console.log('campi - List controller');
    $scope.smartTablePageSize = 5;
    console.log('Campi pelo Resolve: ', campi);
    $scope.campi = campi.data;

    $scope.delete = function (id, index) {

      campusAPI.delete(id).then(function sucessCallback(response){

        console.log('deletou?', response.data);
        $scope.successMsg = response.data.message;
        console.log('msg: ', $scope.successMsg);
        //$scope.load();
	    //  não vai fucnionar o splice nessa smartTable...
      	//$scope.campi.splice(index, 1);
        $state.reload();

      }, function errorCallback(response){

        console.log('erro ao deletar ', response.data.message);
        $scope.errorMsg = response.data.message;
      });
    }
  }

})();
