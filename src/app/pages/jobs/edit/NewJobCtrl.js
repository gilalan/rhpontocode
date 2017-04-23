/**
 * @author Gilliard Lopes
 * created on 22.04.2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.jobs')
      .controller('NewJobCtrl', NewJobCtrl);

  /** @ngInject */
  function NewJobCtrl($scope, $filter, $state, jobAPI) {

    $scope.title = 'Novo';
        
    $scope.save = function (cargo) {
      
      console.log('Cargo enviado: ', cargo);

      jobAPI.create(cargo).then(function sucessCallback(response){

        console.log("dados recebidos: ", response.data);
        $scope.successMsg = response.data.message;      
        
        //back to list
        $state.go('jobs.list');

      }, function errorCallback(response){
        
        $scope.errorMsg = response.data.message;
        console.log("Erro de registro: " + response.data.message);
        
      });   
    }
  }

})();
