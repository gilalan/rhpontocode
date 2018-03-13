/**
 * @author Gilliard Lopes
 * created on 22.04.2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.feriados')
      .controller('NewFeriadoCtrl', NewFeriadoCtrl);

  /** @ngInject */
  function NewFeriadoCtrl($scope, $filter, $window, $state, feriadoAPI, estados) {

    $scope.title = 'Novo';
    $scope.feriado = {fixo: true};
    $scope.abrangencias = [{id: 1, nome: 'Nacional'}, {id: 2, nome: 'Estadual'}, {id: 3, nome: 'Municipal'}];
    $scope.estados = estados.data;
    $scope.municipios = [];
    $scope.flagEstado = true;
    $scope.flagMunicipio = true;

    $scope.selectedAbrang = { item: $scope.abrangencias[0] };
    $scope.selectedEstado = { item: $scope.estados[0] };
    $scope.selectedMunicipio = {};
    var abID = $scope.abrangencias[0].id;

    $scope.selectedAbrangencia = function (sItem) {

      console.log("item: ", sItem);
      abID = sItem.id;
      if (sItem.id === 1){
        $scope.flagEstado = true;
        $scope.flagMunicipio = true;

      } else {
        $scope.flagEstado = false;
        if (sItem.id === 2){
          $scope.flagMunicipio = true;
        }
        if (sItem.id === 3){          
          console.log("selectedEstado: ", $scope.selectedEstado);
          if ($scope.selectedEstado){
            onSelectedUF($scope.selectedEstado);
          }
        }
      }
    }

    $scope.selectedUF = function (sItem) {

      onSelectedUF(sItem);      
    }

    $scope.save = function (feriado) {
      
      feriado.array = [];

      if (feriado.data.fim){
        var compDates = compareOnlyDates(feriado.data.inicio, feriado.data.fim);
        if (compDates == 1){
          
          $window.scrollTo(0, 0);
          $scope.errorMsg = 'A data de início deve ser anterior a data final.';
          return false;

        } else if (compDates == 0){

          feriado.array = [feriado.data.inicio];

        } else if (compDates == -1) {

          var current = new Date(feriado.data.inicio);
          var endDate = new Date(feriado.data.fim);

          while(current <= endDate) {

            feriado.array.push(current);
            current = addOrSubtractDays(current, 1); //passa 1 dia
          } 
        }
      } else {
        feriado.array = [feriado.data.inicio];
      }

      if (!feriado.fixo)
        feriado.fixo = false;

      feriado.abrangencia = $scope.selectedAbrang.item.nome;
      feriado.ftdString = fillFtdStringDate(feriado.data, feriado.fixo);
      feriado.local = {};

      if (abID === 2){
        feriado.local.estado = $scope.selectedEstado.item._id;
      } else if (abID === 3){
        feriado.local.estado = $scope.selectedEstado.item._id;
        feriado.local.municipio = $scope.selectedMunicipio.item._id;      
      }
      
      console.log('feriado enviado: ', feriado);

      feriadoAPI.create(feriado).then(function sucessCallback(response){

        console.log("dados recebidos: ", response.data);
        $scope.successMsg = response.data.message;      
        
        //back to list
        $state.go('feriados.list');

      }, function errorCallback(response){
        
        $scope.errorMsg = response.data.message;
        console.log("Erro de registro: " + response.data.message);
        
      });
    }

    function onSelectedUF(sItem) {

      $scope.selectedMunicipio = {};
      console.log("item Estado: ", sItem);
      if (abID === 3 && sItem){
        
        if (sItem.item){
          $scope.municipios = sItem.item.cidades;
        } else {
          $scope.municipios = sItem.cidades;
        }
        
        if($scope.municipios.length > 0)
          $scope.selectedMunicipio = $scope.municipios[0];

        $scope.flagMunicipio = false;
      }
    };

    function compareOnlyDates(date1, date2) {

      //como a passagem é por referência, devemos criar uma cópia do objeto
      var d1 = angular.copy(new Date(date1)); 
      var d2 = angular.copy(new Date(date2));
      
      d1.setHours(0,0,0,0);
      d2.setHours(0,0,0,0);

      if (d1.getTime() < d2.getTime())
        return -1;
      else if (d1.getTime() === d2.getTime())
        return 0;
      else
        return 1; 
    };

    function addOrSubtractDays(date, value) {
          
      date = angular.copy(date);
      date.setHours(0,0,0,0);

      return new Date(date.getTime() + (value*864e5));
    };

    function fillFtdStringDate(dateObj, isFixed){
      
      var rString = "";
      
      if (dateObj.fim){
        var result = compareOnlyDates(dateObj.inicio, dateObj.fim);
        if (result == 0){
          rString = isFixed ? $filter('date')(new Date(dateObj.inicio), "dd/MM") : $filter('date')(new Date(dateObj.inicio), "dd/MM/yyyy");

        } else if (result == -1) {
          if (isFixed) {
            
            rString = $filter('date')(new Date(dateObj.inicio), "dd/MM");
            rString += " até ";
            rString += $filter('date')(new Date(dateObj.fim), "dd/MM");

          } else {

            rString = $filter('date')(new Date(dateObj.inicio), "dd/MM/yyyy");
            rString += " até ";
            rString += $filter('date')(new Date(dateObj.fim), "dd/MM/yyyy");            
          }
        }
      } else {

        rString = isFixed ? $filter('date')(new Date(dateObj.inicio), "dd/MM") : $filter('date')(new Date(dateObj.inicio), "dd/MM/yyyy");
      }

      return rString;
    };
  }

})();
