/**
 * @author Gilliard Lopes
 * created on 22.04.2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.employees')
      .controller('EditEmployeeCtrl', EditEmployeeCtrl);

  /** @ngInject */
  function EditEmployeeCtrl($scope, $filter, $state, funcionario, employeeAPI, cargos, turnos, instituicoes) {

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
      funcionario.dataNascimento = fixDateFormat(funcionario.dataNascimento);        
      funcionario.alocacao.dataAdmissao = fixDateFormat(funcionario.alocacao.dataAdmissao);
      if (!funcionario.sexoMasculino)
        funcionario.sexoMasculino = false;
      funcionario.rhponto = true;
      console.log('funcionario enviada: ', funcionario);

      employeeAPI.update(funcionario).then(function sucessCallback(response){

        console.log('dados recebidos da atualização: ', response.data);
        $scope.successMsg = response.data.message;      
        
        //back to list
        $state.go('employees.list');

      }, function errorCallback(response){
        
        $scope.errorMsg = response.data.message;
        console.log('Erro de registro: ' + response.data.message);
        
      });   
    }

    function fixDateFormat (data) {
                
        var regex = /[0-9]{2}\/[0-9]{2}\/[0-9]{4}/;

        if (regex.test(data)){
            if(data.length === 10) {
                var dateArray = data.split("/");
                return new Date(dateArray[2], dateArray[1]-1, dateArray[0]).getTime();
            }
        } 

        return data;
    }
  }

})();
