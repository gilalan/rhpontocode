/**
 * @author Gilliard Lopes
 * created on 22.04.2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.employees')
      .controller('NewEmployeeCtrl', NewEmployeeCtrl);

  /** @ngInject */
  function NewEmployeeCtrl($scope, $filter, $state, employeeAPI, cargos, turnos, instituicoes) {

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

    if ($scope.turnos.length > 0)
      $scope.selectedTurno = { item: $scope.turnos[0] };

    if ($scope.instituicoes.length > 0)
      $scope.selectedInst = { item: $scope.instituicoes[0] };
    
    $scope.save = function (funcionario) {

      //acopla os dados ao funcionario
      funcionario.alocacao.cargo = $scope.selectedCargo.item;
      funcionario.alocacao.turno = $scope.selectedTurno.item;
      funcionario.alocacao.instituicao = $scope.selectedInst.item;
      funcionario.sexoMasculino = true;
      funcionario.rhponto = true;
      console.log('Funcionario enviado: ', funcionario);

      employeeAPI.create(funcionario).then(function sucessCallback(response){

        console.log("dados recebidos: ", response.data);
        $scope.successMsg = response.data.message;      
        
        //back to list
        $state.go('employees.list');

      }, function errorCallback(response){
        
        $scope.errorMsg = response.data.message;
        console.log("Erro de registro: " + response.data.message);
        
      });   
    }
  }

})();
