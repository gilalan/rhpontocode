/**
 * @author Gilliard Lopes
 * created on 22.04.2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.employees')
      .controller('EditEmployeeCtrl', EditEmployeeCtrl);

  /** @ngInject */
  function EditEmployeeCtrl($scope, $filter, $state, $window, $timeout, funcionario, employeeAPI, cargos, turnos, instituicoes, util) {

    // console.log("dentro do EditEmployeeCtrl! Lista de cargos: ", cargos);
    // console.log("dentro do EditEmployeeCtrl! Lista de turnos: ", turnos);
    // console.log("dentro do EditEmployeeCtrl! Lista de instituicoes: ", instituicoes);

    //dados
    $scope.title = 'Editar';
    $scope.funcionario = funcionario.data;
    console.log("$scope.funcionario: ", $scope.funcionario);
    $scope.funcionario.dataNascimento = $filter('date')($scope.funcionario.dataNascimento, "dd/MM/yyyy");
    $scope.funcionario.alocacao.dataAdmissao = $filter('date')($scope.funcionario.alocacao.dataAdmissao, "dd/MM/yyyy");
    $scope.cargos = cargos.data;
    $scope.turnos = turnos.data;
    $scope.instituicoes = instituicoes.data;
    $scope.perfis = [{id: 1, nome: 'Colaborador'}, {id: 2, nome: 'Fiscal'}, {id: 3, nome: 'Gestor'}];

    $scope.isInitDateRequired = false;
    $window.scrollTo(0, 0);

    var _email = $scope.funcionario.email;
    var _matricula = $scope.funcionario.matricula;

    function checkCargo(cargo) {

      return $scope.funcionario.alocacao.cargo._id == cargo._id;
    }

    function checkTurno(turno) {

      return $scope.funcionario.alocacao.turno._id == turno._id;
    }

    function checkInst(inst) {

      return $scope.funcionario.alocacao.instituicao._id == inst._id;
    }

    function checkPerfil(perfil) {

      return ($scope.funcionario.alocacao) == perfil.nome;
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

      if ($scope.funcionario.alocacao){

        if ($scope.funcionario.alocacao.fiscal)
          $scope.selectedPerfil = { item: $scope.perfis[1] };  
        else if ($scope.funcionario.alocacao.gestor)
          $scope.selectedPerfil = { item: $scope.perfis[2] };
        else
          $scope.selectedPerfil = { item: $scope.perfis[0] };
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
          cargo.id = $scope.funcionario.historico.cargos.length + 1;
          arrayCargos = $scope.funcionario.historico.cargos;
          arrayCargos.push(cargo);
        }
      }

      return arrayCargos;
    };

    function salvarHistoricoEmail(email){

      //var id = 1;

      if ($scope.funcionario.historico){
        if ($scope.funcionario.historico.emails){
          //id = $scope.funcionario.historico.emails.length + 1;
          $scope.funcionario.historico.emails.push(email);
          return $scope.funcionario.historico.emails;
        }
        else {
          var arrayEmails = [email];
          return arrayEmails;
        }
      }

      return [];      
    };

    $scope.outMatr = function(matricula) {

      //var matricula = funcionario.matricula;
      if (matricula != null && matricula != "" && matricula != _matricula){
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

      if (email != null && email != "" && email != _email){
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
      
      console.log("_email anterior: ", _email);
      console.log("funcionario.email: ", funcionario.email);
      funcionario.alocacao.fiscal = false;
      funcionario.alocacao.gestor = false; //reset and couple after

      if (_email != funcionario.email){
                
        if (!funcionario.historico)
          funcionario.historico = {emails: salvarHistoricoEmail(_email)};
        else
          funcionario.historico.emails = salvarHistoricoEmail(_email);
      } else {
        console.log("Não entrou pra salvar email");
      }

      if (!funcionario.sexoMasculino)
        funcionario.sexoMasculino = false;

      if (!funcionario.rhponto)
        funcionario.rhponto = false;

      if ($scope.selectedPerfil.item.id == 2)
        funcionario.alocacao.fiscal = true;

      if ($scope.selectedPerfil.item.id == 3)
        funcionario.alocacao.gestor = true;

      if (funcionario.localTrabalho) {
        funcionario.localTrabalho = funcionario.localTrabalho.toUpperCase();
      }

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

    function hideTimeErrorMsg(seconds){
      $scope.errorMsg = null;
    };

    function hideTimeSuccMsg(seconds){
      $scope.successMsg = null;
    };

    initSelects();
    $scope.checkEscala($scope.funcionario.alocacao.turno);
  }

})();
