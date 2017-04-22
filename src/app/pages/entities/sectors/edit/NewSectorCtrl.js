/**
 * @author Gilliard Lopes
 * created on 22.04.2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.entities.sectors')
      .controller('NewSectorCtrl', NewSectorCtrl);

  /** @ngInject */
  function NewSectorCtrl($scope, $filter, $state, sectorAPI, campi) {

    console.log("dentro do NewSectorCtrl! Lista de Campus: ", campi);
    $scope.title = 'Novo';
    $scope.campi = campi.data;
    
    if ($scope.campi.length > 0)
      $scope.selected = { item: $scope.campi[0] };
    
    $scope.save = function (setor) {

      //acopla o campus ao setor
      setor.campus = $scope.selected.item;
      console.log('Setor enviado: ', setor);
      sectorAPI.create(setor).then(function sucessCallback(response){

        console.log("dados recebidos: ", response.data);
        $scope.successMsg = response.data.message;      
        
        //back to list
        $state.go('entities.sectors.list');

      }, function errorCallback(response){
        
        $scope.errorMsg = response.data.message;
        console.log("Erro de registro: " + response.data.message);
        
      });   
    }
  }

})();
