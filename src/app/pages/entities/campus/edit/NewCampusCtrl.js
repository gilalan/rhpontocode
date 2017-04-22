/**
 * @author Gilliard Lopes
 * created on 22.04.2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.entities.campus')
      .controller('NewCampusCtrl', NewCampusCtrl);

  /** @ngInject */
  function NewCampusCtrl($scope, $filter, $state, campusAPI, instituicoes) {

    console.log("dentro do NewCampusCtrl! Lista de instituicoes: ", instituicoes);
    $scope.title = 'Novo';
    $scope.instituicoes = instituicoes.data;
    
    if ($scope.instituicoes.length > 0)
      $scope.selected = { item: $scope.instituicoes[0] };
    
    $scope.save = function (campus) {

      //acopla a instituição ao campus
      campus.instituicao = $scope.selected.item;
      console.log('Campus enviado: ', campus);

      campusAPI.create(campus).then(function sucessCallback(response){

        console.log("dados recebidos: ", response.data);
        $scope.successMsg = response.data.message;      
        
        //back to list
        $state.go('entities.campus.list');

      }, function errorCallback(response){
        
        $scope.errorMsg = response.data.message;
        console.log("Erro de registro: " + response.data.message);
        
      });   
    }
  }

})();
