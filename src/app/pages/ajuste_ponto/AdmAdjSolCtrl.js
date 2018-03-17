/**
 * @author Gilliard Lopes
 * created on 04/12/2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.admadjsol')
      .controller('AdmAdjSolCtrl', AdmAdjSolCtrl);

  /** @ngInject */
  function AdmAdjSolCtrl($scope, $filter, $location, $state, $interval, myhitpointAPI, adjSolicitations){

    $scope.smartTablePageSize = 20;
    $scope.total = adjSolicitations.data.length;
    $scope.adjSolicitations = adjSolicitations.data;

    $scope.excluir = function(adjSolId){

      myhitpointAPI.delete(adjSolId).then(function sucessCallback(response){

        console.log('deletou?', response.data);
        $scope.successMsg = response.data.message;
        console.log('msg: ', $scope.successMsg);
        $state.reload();

        }, function errorCallback(response){

          console.log('erro ao deletar ', response.data.message);
          $scope.errorMsg = response.data.message;
      });
    };

    init();
    
    function init () {

    };
  }   

})();
