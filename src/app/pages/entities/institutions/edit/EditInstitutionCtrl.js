/**
 * @author Gilliard Lopes
 * created on 12.04.2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.entities.institutions')
      .controller('EditInstitutionCtrl', EditInstitutionCtrl);

  /** @ngInject */
  function EditInstitutionCtrl($scope, $filter, $state, instituicao, institutionAPI) {

    console.log('dentro do EDITInstitutionCtrl! ', instituicao);
    $scope.title = 'Editar';
    $scope.instituicao = instituicao.data;
    $scope.instituicao.endereco = instituicao.data.enderecos[0];
    
    $scope.save = function (instituicao) {

      //Péssima maneira ao meu ver...
      instituicao.enderecos = [instituicao.endereco];

      institutionAPI.update(instituicao).then(function sucessCallback(response){

        console.log('dados recebidos da atualização: ', response.data);
        $scope.successMsg = response.data.message;      
        
        //back to list
        $state.go('entities.institutions.list');

      }, function errorCallback(response){
        
        $scope.errorMsg = response.data.message;
        console.log('Erro de registro: ' + response.data.message);
        
      });   
    }
  }

})();
