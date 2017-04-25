/**
 * @author Gilliard Lopes
 * created on 22.04.2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.employees')
      .controller('EditEmployeeCtrl', EditEmployeeCtrl);

  /** @ngInject */
  function EditEmployeeCtrl($scope, $filter, $state, $window, funcionario, employeeAPI, cargos, turnos, instituicoes, util) {

    console.log("dentro do EditEmployeeCtrl! Lista de cargos: ", cargos);
    console.log("dentro do EditEmployeeCtrl! Lista de turnos: ", turnos);
    console.log("dentro do EditEmployeeCtrl! Lista de instituicoes: ", instituicoes);

    //dados
    $scope.title = 'Editar';
    $scope.funcionario = funcionario.data;
    $scope.funcionario.dataNascimento = $filter('date')($scope.funcionario.dataNascimento, "dd/MM/yyyy");
    $scope.funcionario.alocacao.dataAdmissao = $filter('date')($scope.funcionario.alocacao.dataAdmissao, "dd/MM/yyyy");
    $scope.cargos = cargos.data;
    $scope.turnos = turnos.data;
    $scope.instituicoes = instituicoes.data;

    $scope.isInitDateRequired = false;
    $window.scrollTo(0, 0);

    function checkCargo(cargo) {

      return $scope.funcionario.alocacao.cargo._id == cargo._id;
    }

    function checkTurno(turno) {

      return $scope.funcionario.alocacao.turno._id == turno._id;
    }

    function checkInst(inst) {

      return $scope.funcionario.alocacao.instituicao._id == inst._id;
    }

    if ($scope.cargos.length > 0){

      $scope.selectedCargo = { item: $scope.cargos[$scope.cargos.findIndex(checkCargo)] };
    }

    if ($scope.turnos.length > 0){

      $scope.selectedTurno = { item: $scope.turnos[$scope.turnos.findIndex(checkTurno)] };
    }

  	if ($scope.instituicoes.length > 0){

      $scope.selectedInst = { item: $scope.instituicoes[$scope.instituicoes.findIndex(checkInst)] };
    }
    
    $scope.save = function (funcionario) {

      //acopla o setor aa funcionario
      funcionario.alocacao.cargo = $scope.selectedCargo.item;
      funcionario.alocacao.turno = $scope.selectedTurno.item;
      funcionario.alocacao.instituicao = $scope.selectedInst.item;
      funcionario.dataNascimento = util.fixDateFormat(funcionario.dataNascimento);        
      funcionario.alocacao.dataAdmissao = util.fixDateFormat(funcionario.alocacao.dataAdmissao);
      
      if (!funcionario.sexoMasculino)
        funcionario.sexoMasculino = false;

      if (!funcionario.rhponto)
        funcionario.rhponto = false;

      if (!funcionario.alocacao.gestor)
        funcionario.alocacao.gestor = false;

      console.log('funcionario enviada: ', funcionario);

      employeeAPI.update(funcionario).then(function sucessCallback(response){

        console.log('dados recebidos da atualização: ', response.data);
        $scope.successMsg = response.data.message;      
        
        //back to list
        $state.go('employees.list');

      }, function errorCallback(response){
        
        $scope.errorMsg = response.data.message;
        console.log('Erro de registro: ' + response.data.message);
        $window.scrollTo(0, 0);   
      });
    }

    $scope.checkEscala = function (turno) {
      //se for da escala 12x36
      $scope.isInitDateRequired = (turno.escala.codigo == 2) ? true : false;
    }

    $scope.checkEscala($scope.funcionario.alocacao.turno);
  }

})();
