/**
 * @author Gilliard Lopes
 * created on 22.04.2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.jobs')
      .controller('EditJobCtrl', EditJobCtrl);

  /** @ngInject */
  function EditJobCtrl($scope, $filter, $state, jobAPI, cargo) {
    
    console.log('cargo recebido pelo resolve: ', cargo)
    //dados
    $scope.title = 'Editar';
    $scope.cargo = cargo.data;   
    
    $scope.save = function (cargo) {
     
      if (!cargo.nomeFeminino || cargo.nomeFeminino === "" || cargo.nomeFeminino === " ")
        cargo.nomeFeminino = cargo.especificacao;

      console.log('cargo enviada: ', cargo);
      
      jobAPI.update(cargo).then(function sucessCallback(response){

        console.log('dados recebidos da atualização: ', response.data);
        $scope.successMsg = response.data.message;      
        
        //back to list
        $state.go('jobs.list');

      }, function errorCallback(response){
        
        $scope.errorMsg = response.data.message;
        console.log('Erro de registro: ' + response.data.message);
        
      });   
    }
  }

})();
