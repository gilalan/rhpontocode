/**
 * @author Gilliard Lopes
 * created on 04/12/2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.hours')
      .controller('HoursCtrl', HoursCtrl);

  /** @ngInject */
  function HoursCtrl($scope, $filter, $location, $state, $interval, appointmentAPI, teamAPI, employeeAPI, reportsAPI, Auth, util, utilReports, utilCorrectApps, usuario, feriados, allEmployees, allEquipes) {

    var Usuario = usuario.data;
    var feriados = feriados.data;
    var _selected;
    var equipe = {};
    var funcSel = {};
    // ////////console.log('usuario.data: ', usuario.data);
    $scope.gestor = null;
    $scope.isGestorGeral = false;
    $scope.isAdmin = false;
    $scope.espelhoPonto = true;
    $scope.bancoHoras = false;
    $scope.filtroPonto = false;

    $scope.funcionario = {};
    $scope.funcionarioOficial = {};
    $scope.employees = [];
    $scope.employeesNames = []; //Auxiliar para o AutoComplete do Input do nome do funcionario
    $scope.meses = [];
    $scope.anos = [];
    $scope.periodoApontamento = [];
    $scope.checkboxModel = {
      equipe: false,
      funcionario: true
    };
    $scope.textoBotao = "Visualizar";

    // ////////console.log("### Dentro de ReportsCtrl!!!", $scope.gestor);

    init(allEmployees, allEquipes);
    
    $scope.showEspelhoPonto = function () {
      $scope.bancoHoras = false;
      $scope.espelhoPonto = true;
      ////////console.log("mostrar espelho de ponto");
    }

    $scope.showBancoHoras = function () {
      $scope.espelhoPonto = false;
      $scope.bancoHoras = true;
      ////////console.log("mostrar banco de horas");
    }  

    $scope.clickEmployeeCB = function(){
      //console.log('clicou employee', $scope.checkboxModel.funcionario);
      if ($scope.checkboxModel.funcionario){
          $scope.checkboxModel.equipe = false;
          $scope.textoBotao = "Visualizar";
      } else {
        $scope.checkboxModel.equipe = true;
        $scope.textoBotao = "Salvar Relatório de Equipe em PDF";
      }
    };

    $scope.clickTeamCB = function(){
      //console.log('clicou equipe', $scope.checkboxModel.equipe);
      if($scope.checkboxModel.equipe){
        $scope.checkboxModel.funcionario = false;
        $scope.textoBotao = "Salvar Relatório de Equipe em PDF";
      } else {
        $scope.checkboxModel.funcionario = true;
        $scope.textoBotao = "Visualizar";
      }
    };

    $scope.changeFunc = function(funcSel){
      
      $scope.funcionarioOficial = $scope.equipes[funcSel.indiceEq].componentes[funcSel.indiceComp];
      $scope.funcionarioOficial.equipe = angular.copy(funcSel.equipe);
      console.log("funcionario ferias do INIT: ", $scope.funcionarioOficial);
      if ($scope.funcionarioOficial.ferias){

        for (var i=0; i<$scope.funcionarioOficial.ferias.length; i++){
          $scope.funcionarioOficial.ferias[i].dataIniFtd = new Date($scope.funcionarioOficial.ferias[i].periodo.anoInicial, 
            $scope.funcionarioOficial.ferias[i].periodo.mesInicial-1, $scope.funcionarioOficial.ferias[i].periodo.dataInicial, 0, 0, 0, 0);
          $scope.funcionarioOficial.ferias[i].dataFinFtd = new Date($scope.funcionarioOficial.ferias[i].periodo.anoFinal, 
            $scope.funcionarioOficial.ferias[i].periodo.mesFinal-1, $scope.funcionarioOficial.ferias[i].periodo.dataFinal, 0, 0, 0, 0);
        }
      }
      $scope.infoHorario = util.getInfoHorario($scope.funcionarioOficial, []);
    };

    $scope.isEmptyFunc = function(){
      
      //console.log('is Empty func?');
      if (!$scope.funcionario.selected || $scope.funcionario.selected == ""){
        $scope.infoHorario = "";
        return true;
      }
      return false;
    };

    $scope.search = function () {

      if ($scope.checkboxModel.funcionario){

        if (!$scope.funcionario.selected){
        
          alert('Por favor, preencha o campo com o nome do funcionário.');

        } else {

          funcSel = searchEmployee($scope.funcionario.selected.id, $scope.employees);
          $scope.infoHorario = [];
          $scope.infoHorario = util.getInfoHorario(funcSel, []);
          equipe = funcSel.equipe;
          // console.log('funcionario AutoComplete: ', $scope.funcionario.selected);
          // console.log('funcionario pego: ', funcSel);

          var dataInicial = new Date(ano.value, mes._id, 1);
          //Esse é um workaround pra funcionar a obtenção da quantidade de dias em Javascript
          //Dessa maneira a gnt obtém o último dia (valor zero no últ argumento) do mês anterior, que dá exatamente a qtde de dias do mês que vc quer
          //var dataFinal = new Date(ano.value, mes._id+1, 0);
          var dataFinal = new Date(ano.value, mes._id+1, 1);//primeiro dia do mês posterior

          getApontamentosByDateRangeAndEquipe(dataInicial, dataFinal, funcSel);

          ////console.log('funcSelecionado para busca: ', funcSel);

          // employeeAPI.getEquipe(funcSel._id).then(function successCallback(response){

          //   equipe = response.data;
          //   ////console.log('response retornado da equipe do buscado: ', response);
          //   getApontamentosByDateRangeAndEquipe(dataInicial, dataFinal, funcSel);

          // }, function errorCallback(response){
            
          //   $scope.errorMsg = response.data.message;
          // });

          //initGetEquipe(funcSel);//Chama 
        }

      } 

      if ($scope.checkboxModel.equipe) {

        //console.log('Selected Equipe: ', $scope.selectedEquipe.item);
        //vou ter que calcular os totais para cada employee da equipe e depois gerar o PDF para concatenar num documento so
      }      
      
    }    

    /*     
     * Solicita ao servidor um objeto com os apontamentos dos componentes da equipe (apenas 1 componente nesse caso)     
    **/
    function getApontamentosByDateRangeAndEquipe(beginDate, endDate, funcionario) {

      var dateAux = new Date(beginDate);
      var endDateAux = new Date(endDate);

      var objDateWorker = {
        date: {
          raw: beginDate,
          year: dateAux.getFullYear(),
          month: dateAux.getMonth(),
          day: dateAux.getDate(),
          hour: dateAux.getHours(),
          minute: dateAux.getMinutes(),
          finalInclude: true,
          final: {
            raw: endDate,
            year: endDateAux.getFullYear(),
            month: endDateAux.getMonth(),
            day: endDateAux.getDate(),
            hour: endDateAux.getHours(),
            minute: endDateAux.getMinutes()
          }
        },
        funcionario: funcionario
      };

      //Ajeita a formatação da data para não ter problema com a visualização
      $scope.periodoApontamento = [];
      //console.log("objDateWorker Enviado: ", objDateWorker);

      appointmentAPI.getApontamentosByDateRangeAndFuncionario(objDateWorker).then(function successCallback(response){

        var apontamentosResponse = response.data;
        apontamentosTesteCorrect = response.data;
        ////console.log("!@# Apontamentos do funcionário: ", apontamentosResponse);
        //$scope.periodoApontamento = createArrayRangeDate(dateAux, endDateAux, 1, apontamentosResponse);
        $scope.periodoApontamento = testePetrolina(dateAux, endDateAux, 1, apontamentosResponse, funcionario);

      }, function errorCallback(response){
        
        $scope.errorMsg = response.data.message;
        ////////console.log("Erro ao obter apontamentos por um range de data e equipe");
      });
    };

    //Traz todos os employees para tela de Administrador
    function getAllEmployees(allEmployees, allEquipes) {
      
      //var empsArray = allEmployees.data;
      $scope.equipes = allEquipes.data;
      fillEquipes();
      $scope.filtroPonto = true;
    };

   /*
     * Função chamada no início do carregamento, traz as equipes do gestor atual
    **/
    function getEquipesByGestor() {

      teamAPI.getEquipesByGestor($scope.gestor).then(function successCallback(response){

        $scope.equipes = response.data;
        if($scope.equipes){
          if($scope.equipes.length > 0){
            fillEquipes();
          } 
        } 
      }, 
      function errorCallback(response){
        $errorMsg = response.data.message;
      });
    };

    function fillEquipes(){

      if ($scope.equipes.length > 0)
        $scope.selectedEquipe = { item: $scope.equipes[0] };

      fillEmployees();

      $scope.filtroPonto = true;
    };

    function fillEmployees(){
      ////console.log('gsetor, equipes comonentes: ', $scope.equipes);
      for (var i=0; i<$scope.equipes.length; i++){
        for (var j=0; j<$scope.equipes[i].componentes.length; j++) {
          setEquipeAttrsForEmployee($scope.equipes[i].componentes[j], $scope.equipes[i]);
          $scope.employees.push($scope.equipes[i].componentes[j]);
          $scope.employeesNames.push( {
            indiceEq: i, 
            indiceComp: j, 
            equipe: $scope.equipes[i], 
            //equipe: $scope.equipes[i].nome
            id: $scope.equipes[i].componentes[j]._id, 
            name: $scope.equipes[i].componentes[j].nome + ' ' + $scope.equipes[i].componentes[j].sobrenome,
            matricula: $scope.equipes[i].componentes[j].matricula,
            PIS: $scope.equipes[i].componentes[j].PIS,
            cargo: $scope.equipes[i].componentes[j].sexoMasculino ? $scope.equipes[i].componentes[j].alocacao.cargo.especificacao : $scope.equipes[i].componentes[j].alocacao.cargo.nomeFeminino
          });
        }
      }
    };

    function setEquipeAttrsForEmployee(employee, equipe){

      employee.equipe = {
        _id: equipe._id,
        nome: equipe.nome,
        gestor: equipe.gestor,
        fiscal: equipe.fiscal,
        setor: equipe.setor
      };
    };

    function getId (array) {
      return (array.length + 1);
    };    

    function init(allEmployees, allEquipes) {

      if (Usuario.perfil.accessLevel == 2 || Usuario.perfil.accessLevel == 3) {
        
        $scope.gestor = Usuario.funcionario;
        getEquipesByGestor();

      } else if (Usuario.perfil.accessLevel == 4) {
         
         $scope.isAdmin = true;
        //console.log('allEmployees: ', allEmployees.data);
        getAllEmployees(allEmployees, allEquipes);

      } else if (Usuario.perfil.accessLevel >= 5) {

        $scope.isAdmin = true;
        //console.log('allEmployees: ', allEmployees.data);
        getAllEmployees(allEmployees, allEquipes);

      } else {

        ////////console.log("Não deve ter acesso.");
        $scope.errorMsg = "Este funcionário não tem permissão para visualizar estas informações";

      }
    };
  }   

})();
