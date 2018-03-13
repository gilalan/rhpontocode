/**
 * @author Gilliard Lopes
 * created on 22.04.2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.entities.sectors')
      .controller('NewSectorCtrl', NewSectorCtrl);

  /** @ngInject */
  function NewSectorCtrl($scope, $filter, $state, sectorAPI, campi, estados) {

    console.log("dentro do NewSectorCtrl! Lista de Campus: ", campi);
    $scope.title = 'Novo';
    $scope.campi = campi.data;
    $scope.estados = estados.data;
    $scope.municipios = [];
    
    $scope.selectedMunicipio = {};
    
    if ($scope.campi.length > 0)
      $scope.selected = { item: $scope.campi[0] };

    if ($scope.estados.length > 0)
      $scope.selectedEstado = { item: $scope.estados[0] };

    $scope.selectedUF = function(sItem){

      $scope.selectedMunicipio = {};
      console.log("item Estado: ", sItem);
      if (sItem){
        
        if (sItem.item){
          $scope.municipios = sItem.item.cidades;
        } else {
          $scope.municipios = sItem.cidades;
        }
        
        if($scope.municipios.length > 0)
          $scope.selectedMunicipio = $scope.municipios[0];
        
      }
    }
    
    $scope.save = function (setor) {

      //acopla o campus ao setor
      setor.campus = $scope.selected.item;
      setor.local = {};
      setor.local.estado = $scope.selectedEstado.item;
      setor.local.municipio = $scope.selectedMunicipio.item; 

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
