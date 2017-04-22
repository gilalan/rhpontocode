/**
 * @author Gilliard Lopes
 * created on 21.04.2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.entities.institutions')
      .controller('NewInstitutionCtrl', NewInstitutionCtrl);

  /** @ngInject */
  function NewInstitutionCtrl($scope, $filter, $state, institutionAPI) {

    console.log("dentro do NewInstitutionCtrl!");
    $scope.title = 'Nova';
    
    $scope.save = function (instituicao) {

      //Péssima maneira ao meu ver...
      instituicao.enderecos = [instituicao.endereco];

      institutionAPI.create(instituicao).then(function sucessCallback(response){

        console.log("dados recebidos: ", response.data);
        $scope.successMsg = response.data.message;      
        
        //back to list
        $state.go('entities.institutions.list');

      }, function errorCallback(response){
        
        $scope.errorMsg = response.data.message;
        console.log("Erro de registro: " + response.data.message);
        
      });   
    }
  }

})();
