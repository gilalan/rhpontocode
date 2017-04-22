/**
 * @author Gilliard Lopes
 * created on 22.04.2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.entities.campus')
      .controller('EditCampusCtrl', EditCampusCtrl);

  /** @ngInject */
  function EditCampusCtrl($scope, $filter, $state, campus, campusAPI, instituicoes) {

    console.log('dentro do EDITCampusCtrl! ', campus);
    $scope.title = 'Editar';
    $scope.campus = campus.data;
    $scope.instituicoes = instituicoes.data;
    console.log('instituicoes array: ', instituicoes.data);

    function checkInstituicao(instituicao) {

      return $scope.campus.instituicao == instituicao._id;
    }

    if ($scope.instituicoes.length > 0){

      $scope.selected = { item: $scope.instituicoes[$scope.instituicoes.findIndex(checkInstituicao)] };
    }
    
    $scope.save = function (campus) {

      //acopla a instituicao ao campus
      campus.instituicao = $scope.selected.item;
      console.log('Campus enviado: ', campus);

      campusAPI.update(campus).then(function sucessCallback(response){

        console.log('dados recebidos da atualização: ', response.data);
        $scope.successMsg = response.data.message;      
        
        //back to list
        $state.go('entities.campus.list');

      }, function errorCallback(response){
        
        $scope.errorMsg = response.data.message;
        console.log('Erro de registro: ' + response.data.message);
        
      });   
    }
  }

})();
