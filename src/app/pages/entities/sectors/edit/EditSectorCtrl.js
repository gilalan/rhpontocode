/**
 * @author Gilliard Lopes
 * created on 22.04.2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.entities.sectors')
      .controller('EditSectorCtrl', EditSectorCtrl);

  /** @ngInject */
  function EditSectorCtrl($scope, $filter, $state, setor, sectorAPI, campi, estados) {

    console.log('dentro do EDITSectorCtrl! ', setor);
    $scope.title = 'Editar';
    $scope.setor = setor.data;
    $scope.campi = campi.data;
    $scope.estados = estados.data;
    $scope.municipios = [];
    console.log('Campi array: ', campi.data);
    
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

    function checkCampus(campus) {

      return $scope.setor.campus == campus._id;
    };

    function checkEstado(estado) {

      if($scope.setor.local)
        return $scope.setor.local.estado == estado._id; 
    };

    function checkMunicipio(municipio) {

      if($scope.setor.local)
        return $scope.setor.local.municipio == municipio._id; 
    };


    function initSelects(){
      

      if ($scope.campi.length > 0){

        $scope.selected = { item: $scope.campi[$scope.campi.findIndex(checkCampus)] };
      }

      if ($scope.estados.length > 0){
        $scope.selectedEstado = { item: $scope.estados[$scope.estados.findIndex(checkEstado)] };
        if ($scope.selectedEstado.item) {

          $scope.municipios = $scope.selectedEstado.item.cidades;

          if ($scope.municipios.length > 0)
            $scope.selectedMunicipio = {item: $scope.municipios[$scope.municipios.findIndex(checkMunicipio)]};
        }
      }
    };

    initSelects();
  }

})();
