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

    var email = $scope.funcionario.email;

    function checkCargo(cargo) {

      return $scope.funcionario.alocacao.cargo._id == cargo._id;
    }

    function checkTurno(turno) {

      return $scope.funcionario.alocacao.turno._id == turno._id;
    }

    function checkInst(inst) {

      return $scope.funcionario.alocacao.instituicao._id == inst._id;
    }

    function initSelects(){
      
      if ($scope.cargos.length > 0){

        $scope.selectedCargo = { item: $scope.cargos[$scope.cargos.findIndex(checkCargo)] };
      }

      if ($scope.turnos.length > 0){

        $scope.selectedTurno = { item: $scope.turnos[$scope.turnos.findIndex(checkTurno)] };
      }

    	if ($scope.instituicoes.length > 0){

        $scope.selectedInst = { item: $scope.instituicoes[$scope.instituicoes.findIndex(checkInst)] };
      }
    };

    function salvarHistoricoTurno(turnoAtual, dataInicio) {
      
      var id = 1;

      var turno = {
        id: id,
        vigencia: {
          inicio: dataInicio,
          fim: new Date()
        },
        isFlexivel: turnoAtual.isFlexivel,
        intervaloFlexivel: turnoAtual.intervaloFlexivel,
        ignoraFeriados: turnoAtual.ignoraFeriados,
        tolerancia: turnoAtual.tolerancia,
        jornada: turnoAtual.jornada,
        escala: {
          codigo: turnoAtual.escala.codigo,
          nome: turnoAtual.escala.nome
        }
      };
      var arrayTurnos = [turno];

      if ($scope.funcionario.historico){
        
        if ($scope.funcionario.historico.turnos) {
          
          turno.id = $scope.funcionario.historico.turnos.length + 1;
          arrayTurnos = $scope.funcionario.historico.turnos;
          arrayTurnos.push(turno);
        } 
      }

      return arrayTurnos;
    };
  
    function salvarHistoricoCargo(cargoAtual, dataInicio) {
      
      var id = 1;

      var cargo =  {
        id: id,
        vigencia: {
          inicio: dataInicio,
          fim: new Date()
        },
        especificacao: cargoAtual.especificacao,
        nomeFeminino: cargoAtual.nomeFeminino,
        descricao: cargoAtual.descricao,        
        cbo: cargoAtual.cbo
      };

      var arrayCargos = [cargo];

      if ($scope.funcionario.historico){
        if ($scope.funcionario.historico.cargos){
          turno.id = $scope.funcionario.historico.cargos.length + 1;
          arrayCargos = $scope.funcionario.historico.turnos;
          arrayCargos.push(cargo);
        }
      }

      return arrayCargos;
    };

    function salvarHistoricoEmail(){

      var id = 1;

      if ($scope.funcionario.historico){
        if ($scope.funcionario.historico.emails){
          id = $scope.funcionario.historico.emails.length + 1;
          $scope.funcionario.historico.emails.push({id: id, email: email});
          return $scope.funcionario.historico.emails;
        }
        else {
          var arrayEmails = [{id: 1, email: email}];
          return arrayEmails;
        }
      }

      return [];      
    };

    $scope.save = function (funcionario) {

      // console.log('$scope.selectedTurno.item: ', $scope.selectedTurno.item);
      // console.log('$scope.selectedCargo.item: ', $scope.selectedCargo.item);
      // console.log('funcionario passado: ', funcionario);
      //se tiver alterado o turno, salvar o turno atual no historico do funcionario
      if ($scope.selectedTurno.item._id != funcionario.alocacao.turno._id){
        
        var historicoTurno = {turnos: salvarHistoricoTurno(funcionario.alocacao.turno, funcionario.alocacao.dataTurno)};
        
        if (!funcionario.historico)
          funcionario.historico = historicoTurno;          
        else
          funcionario.historico.turnos = salvarHistoricoTurno(funcionario.alocacao.turno, funcionario.alocacao.dataTurno);
      }
     
      if ($scope.selectedCargo.item._id != funcionario.alocacao.cargo._id){
        
        var historicoCargo = {cargos: salvarHistoricoCargo(funcionario.alocacao.cargo, funcionario.alocacao.dataCargo)};
        
        if (!funcionario.historico)
          funcionario.historico = historicoCargo;
        else
          funcionario.historico.cargos = salvarHistoricoCargo(funcionario.alocacao.cargo, funcionario.alocacao.dataCargo);
      }
      
      if (email != funcionario.email){
        
        var historicoEmail = {emails: salvarHistoricoEmail()};
        if (!funcionario.historico)
          funcionario.historico = historicoEmail;
        else
          funcionario.historico.emails = salvarHistoricoEmail();
      }

      if (!funcionario.sexoMasculino)
        funcionario.sexoMasculino = false;

      if (!funcionario.rhponto)
        funcionario.rhponto = false;

      if (!funcionario.alocacao.gestor)
        funcionario.alocacao.gestor = false;

      //acopla o setor aa funcionario
      funcionario.alocacao.cargo = $scope.selectedCargo.item;
      funcionario.alocacao.turno = $scope.selectedTurno.item;
      funcionario.alocacao.instituicao = $scope.selectedInst.item;
      funcionario.dataNascimento = util.fixDateFormat(funcionario.dataNascimento);        
      funcionario.alocacao.dataAdmissao = util.fixDateFormat(funcionario.alocacao.dataAdmissao);
      

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

    initSelects();
    $scope.checkEscala($scope.funcionario.alocacao.turno);
  }

})();
