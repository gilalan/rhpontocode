/**
 * @author Gilliard Lopes
 * created on 22.04.2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.employees')
      .controller('NewEmployeeCtrl', NewEmployeeCtrl);

  /** @ngInject */
  function NewEmployeeCtrl($scope, $filter, $state, $window, employeeAPI, cargos, turnos, instituicoes) {

    console.log("dentro do NewEmployeeCtrl! Lista de cargos: ", cargos);
    console.log("dentro do NewEmployeeCtrl! Lista de turnos: ", turnos);
    console.log("dentro do NewEmployeeCtrl! Lista de instituicoes: ", instituicoes);

    //dados
    $scope.title = 'Novo';
    $scope.cargos = cargos.data;
    $scope.turnos = turnos.data;
    $scope.instituicoes = instituicoes.data;
    
    if ($scope.cargos.length > 0)
      $scope.selectedCargo = { item: $scope.cargos[0] };

    //turno embaixo
    
    if ($scope.instituicoes.length > 0)
      $scope.selectedInst = { item: $scope.instituicoes[0] };
    
    $scope.save = function (funcionario) {

      if (!funcionario.email || funcionario.email == ""){
        
        $window.scrollTo(0, 0);
        $scope.errorMsg = 'Por favor, preencha o E-mail.';
        return false;
      }

      //acopla os dados ao funcionario
      funcionario.alocacao.cargo = $scope.selectedCargo.item;
      funcionario.alocacao.turno = $scope.selectedTurno.item;
      funcionario.alocacao.instituicao = $scope.selectedInst.item;
      
      if (!funcionario.sexoMasculino)
        funcionario.sexoMasculino = false;

      if (!funcionario.rhponto)
        funcionario.rhponto = false;

      if (!funcionario.alocacao.gestor)
        funcionario.alocacao.gestor = false;

      var funcLength = funcionario.PIS.length;
      if (funcLength < 12){
        var diff = 12 - funcLength;
        while(diff > 0)
        {
          "0" + funcionario.PIS;
          diff--;
        }
      }

      if (funcionario.localTrabalho) {
        funcionario.localTrabalho = funcionario.localTrabalho.toUpperCase();
      }

      console.log('Funcionario enviado: ', funcionario);

      employeeAPI.create(funcionario).then(function sucessCallback(response){

        console.log("dados recebidos: ", response.data);
        $scope.successMsg = response.data.message;
        
        //back to list
        $state.go('employees.list');

      }, function errorCallback(response){
        
        $window.scrollTo(0, 0);
        $scope.errorMsg = response.data.message;
        console.log("Erro de registro: " + response.data.message);
      });   
    }

    $scope.checkEscala = function (turno) {
      //se for da escala 12x36
      $scope.isInitDateRequired = (turno.escala.codigo == 2) ? true : false;
    }
    
    if ($scope.turnos.length > 0) {
      $scope.selectedTurno = { item: $scope.turnos[0] };
      $scope.checkEscala($scope.selectedTurno.item);
    }

  }

})();
