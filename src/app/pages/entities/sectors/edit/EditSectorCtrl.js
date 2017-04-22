/**
 * @author Gilliard Lopes
 * created on 22.04.2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.entities.sectors')
      .controller('EditSectorCtrl', EditSectorCtrl);

  /** @ngInject */
  function EditSectorCtrl($scope, $filter, $state, setor, sectorAPI, campi) {

    console.log('dentro do EDITSectorCtrl! ', setor);
    $scope.title = 'Editar';
    $scope.setor = setor.data;
    $scope.campi = campi.data;
    console.log('Campi array: ', campi.data);

    function checkCampus(campus) {

      return $scope.setor.campus == campus._id;
    }

    if ($scope.campi.length > 0){

      $scope.selected = { item: $scope.campi[$scope.campi.findIndex(checkCampus)] };
    }
    
    $scope.save = function (setor) {

      //acopla o campus ao setor
      setor.campus = $scope.selected.item;
      console.log('Setor enviado: ', setor);

      sectorAPI.update(setor).then(function sucessCallback(response){

        console.log('dados recebidos da atualização: ', response.data);
        $scope.successMsg = response.data.message;      
        
        //back to list
        $state.go('entities.sectors.list');

      }, function errorCallback(response){
        
        $scope.errorMsg = response.data.message;
        console.log('Erro de registro: ' + response.data.message);
        
      });   
    }
  }

})();
