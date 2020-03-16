/**
 * @author Gilliard Lopes
 * created on 22.04.2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.employees')
      .controller('NewEmployeeCtrl', NewEmployeeCtrl);

  /** @ngInject */
  function NewEmployeeCtrl($scope, $filter, $state, $window, $timeout, employeeAPI, cargos, turnos, instituicoes) {

    // console.log("dentro do NewEmployeeCtrl! Lista de cargos: ", cargos);
    // console.log("dentro do NewEmployeeCtrl! Lista de turnos: ", turnos);
    // console.log("dentro do NewEmployeeCtrl! Lista de instituicoes: ", instituicoes);

    //dados
    $scope.title = 'Novo';
    $scope.cargos = cargos.data;
    $scope.turnos = turnos.data;
    $scope.instituicoes = instituicoes.data;
    $scope.perfis = [{id: 1, nome: 'Colaborador'}, {id: 2, nome: 'Fiscal'}, {id: 3, nome: 'Gestor'}];    
    
    $scope.selectedPerfil = { item: $scope.perfis[0] };

    if ($scope.cargos.length > 0)
      $scope.selectedCargo = { item: $scope.cargos[0] };

    //turno embaixo
    
    if ($scope.instituicoes.length > 0)
      $scope.selectedInst = { item: $scope.instituicoes[0] };
    
    $scope.outMatr = function(matricula) {

      //var matricula = funcionario.matricula;
      if (matricula != null && matricula != ""){
        console.log("matricula", matricula);
        employeeAPI.checkMatricula({'matr': matricula}).then(function sucessCallback(response){

          console.log("dados recebidos: ", response.data);
          var func = response.data;          
          if (func){
            $window.scrollTo(0, 0);
            $scope.errorMsg = "Número de matrícula já existe!";
            $timeout(hideTimeErrorMsg, 5000);
            return $scope.errorMsg;
          } else {
            $window.scrollTo(0, 0);
            $scope.successMsg = "Número de matrícula válido.!";
            $timeout(hideTimeSuccMsg, 5000);
            return $scope.successMsg;
          }
          //back to list
          //$state.go('employees.list');

        }, function errorCallback(response){
          
          $window.scrollTo(0, 0);
          $scope.errorMsg = response.data.message;
          console.log("Erro ao inserir matricula: " + response.data.message);
        });   
      }
    };

    $scope.outEmail = function(email) {

      if (email != null && email != ""){
        console.log("email", email);
        employeeAPI.checkEmail({'email': email}).then(function sucessCallback(response){

          console.log("dados recebidos: ", response.data);
          var func = response.data;          
          if (func){
            $window.scrollTo(0, 0);
            $scope.errorMsg = "E-mail já existe!";
            $timeout(hideTimeErrorMsg, 5000);
            return $scope.errorMsg;
          } else {
            $window.scrollTo(0, 0);
            $scope.successMsg = "E-mail válido.!";
            $timeout(hideTimeSuccMsg, 5000);
            return $scope.successMsg;
          }
          //back to list
          //$state.go('employees.list');

        }, function errorCallback(response){
          
          $window.scrollTo(0, 0);
          $scope.errorMsg = response.data.message;
          console.log("Erro ao inserir e-mail: " + response.data.message);
        });   
      }
    };

    $scope.save = function (funcionario) {

      if (!funcionario.email || funcionario.email == ""){
        
        $window.scrollTo(0, 0);
        $scope.errorMsg = 'Por favor, preencha o E-mail.';
        return false;
      }

      //acopla os dados ao funcionario
      funcionario.active = true;
      funcionario.alocacao.cargo = $scope.selectedCargo.item;
      funcionario.alocacao.turno = $scope.selectedTurno.item;
      funcionario.alocacao.instituicao = $scope.selectedInst.item;
      funcionario.alocacao.fiscal = false;
      funcionario.alocacao.gestor = false;
      
      if (!funcionario.sexoMasculino)
        funcionario.sexoMasculino = false;

      if (!funcionario.rhponto)
        funcionario.rhponto = false;

      if ($scope.selectedPerfil.item.id == 2)
        funcionario.alocacao.fiscal = true;

      if ($scope.selectedPerfil.item.id == 3)
        funcionario.alocacao.gestor = true;        

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
    
    function hideTimeErrorMsg(seconds){
      $scope.errorMsg = null;
    };

    function hideTimeSuccMsg(seconds){
      $scope.successMsg = null;
    };

    if ($scope.turnos.length > 0) {
      $scope.selectedTurno = { item: $scope.turnos[0] };
      $scope.checkEscala($scope.selectedTurno.item);
    }



  }

})();
