/**
 * @author Gilliard Lopes
 * created on 22.04.2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.feriados')
      .controller('EditFeriadoCtrl', EditFeriadoCtrl);

  /** @ngInject */
  function EditFeriadoCtrl($scope, $filter, $window, $state, feriadoAPI, feriado, estados, util) {
    
    console.log('feriado recebido pelo resolve: ', feriado)
    //dados
    $scope.title = 'Editar';
    $scope.feriado = feriado.data;

    if ($scope.feriado.data){
      $scope.feriado.data.inicio = $filter('date')($scope.feriado.data.inicio, "dd/MM/yyyy");
      if ($scope.feriado.data.fim)
        $scope.feriado.data.fim = $filter('date')($scope.feriado.data.fim, "dd/MM/yyyy");
    }
    $scope.abrangencias = [{id: 1, nome: 'Nacional'}, {id: 2, nome: 'Estadual'}, {id: 3, nome: 'Municipal'}];
    $scope.estados = estados.data;
    $scope.municipios = [];
    
    $scope.flagEstado = true;
    $scope.flagMunicipio = true;
    var abID = $scope.abrangencias[0].id;

    init();


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
      
      if(feriado.data.inicio)
        feriado.data.inicio = util.fixDateFormat(feriado.data.inicio);

      if(feriado.data.fim)
        feriado.data.fim = util.fixDateFormat(feriado.data.fim);
      

      if (feriado.data.fim){
        var compDates = compareOnlyDates(feriado.data.inicio, feriado.data.fim);
        if (compDates == 1){
          
          $window.scrollTo(0, 0);
          $scope.errorMsg = 'A data de início deve ser anterior a data final.';
          return false;

        } else if (compDates == 0){

          feriado.array = [new Date(feriado.data.inicio)];

        } else if (compDates == -1) {

          var current = new Date(feriado.data.inicio);
          var endDate = new Date(feriado.data.fim);

          while(current <= endDate) {

            feriado.array.push(current);
            current = addOrSubtractDays(current, 1); //passa 1 dia
          } 
        }
      } else {
        feriado.array = [new Date(feriado.data.inicio)];
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

      console.log('feriado a ser enviado:', feriado);

      feriadoAPI.update(feriado).then(function sucessCallback(response){

        console.log('dados recebidos da atualização: ', response.data);
        $scope.successMsg = response.data.message;      
        
        //back to list
        $state.go('feriados.list');

      }, function errorCallback(response){
        
        $scope.errorMsg = response.data.message;
        console.log('Erro de registro: ' + response.data.message);
        
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

    function checkAbrangencia(abrangencia) {
      return ($scope.feriado.abrangencia) == abrangencia.nome;
    }

    function checkEstado(estado) {
      return $scope.feriado.local.estado == estado._id; 
    }

    function checkMunicipio(municipio) {
      return $scope.feriado.local.municipio == municipio._id; 
    }

    function initSelects(){
      
      if ($scope.abrangencias.length > 0){

        $scope.selectedAbrang = { item: $scope.abrangencias[$scope.abrangencias.findIndex(checkAbrangencia)] };
        abID = $scope.selectedAbrang.item.id;
        console.log('AB ID: ', abID);
      }

      if ($scope.feriado.abrangencia == $scope.abrangencias[1].nome){
        console.log("É ESTADUAL!");
        if ($scope.estados.length > 0){

          $scope.flagEstado = false;
          $scope.selectedEstado = { item: $scope.estados[$scope.estados.findIndex(checkEstado)] };
        }

      } else if ($scope.feriado.abrangencia == $scope.abrangencias[2].nome){
        console.log("É MUNICIPAL!");
        
        if ($scope.estados.length > 0){
          
          $scope.selectedEstado = { item: $scope.estados[$scope.estados.findIndex(checkEstado)] };
          $scope.flagEstado = false;
        }

        $scope.municipios = $scope.selectedEstado.item.cidades;
        if ($scope.municipios.length > 0) {
          $scope.selectedMunicipio = {item: $scope.municipios[$scope.municipios.findIndex(checkMunicipio)]};
          $scope.flagMunicipio = false;
        }
                
      }
    };
    
    function init(){

      initSelects();

    };
  }

})();
