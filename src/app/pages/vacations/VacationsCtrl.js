/**
 * @author Gilliard Lopes
 * created on 04/12/2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.testes')
      .controller('VacationsCtrl', VacationsCtrl);

  /** @ngInject */
  function VacationsCtrl($scope, $filter, $location, $state, $uibModal, $timeout, $interval, appointmentAPI, teamAPI, employeeAPI, pointsAPI, Auth, util, utilReports, utilCorrectApps, utilBancoHoras, usuario, feriados, motivosAjuste, allEmployees, allEquipes){

    console.log("Ja entrou no controller: ", feriados);
    var Usuario = usuario.data;
    var feriados = feriados.data;
    var mes = null;
    var ano = null;
    var equipe = {};
    var funcSel = {};
    var apontamentosTesteCorrect;
    var gestor = {};
    $scope.smartTablePageSize = 35;
    $scope.gestor = null;
    $scope.isGestorGeral = false;
    $scope.isAdmin = false;
    $scope.espelhoPonto = true;
    $scope.dataProcess = false;

    $scope.funcionario = {};
    $scope.employees = [];
    $scope.employeesNames = []; //Auxiliar para o AutoComplete do Input do nome do funcionario
    $scope.periodoFerias = [];
    $scope.periodoApontamento = [];
    
    init();

    $scope.search = function () {

      if (!$scope.funcionario.selected){
      
        alert('Por favor, preencha o campo com o nome do funcionário.');

      } else {

        funcSel = searchEmployee($scope.funcionario.selected.id, $scope.employees);
        $scope.infoHorario = [];
        $scope.infoHorario = util.getInfoHorario(funcSel, []);
        equipe = funcSel.equipe;
        console.log('funcionario pego: ', funcSel);        

        showEmployeeVacations(funcSel);
      }
    };

    $scope.reverterFerias = function (itemFerias) {

      if (!funcSel){
      
        alert('Por favor, preencha o campo com o nome do funcionário.');

      } else {
          
        updateRevertVacations(funcSel, itemFerias);
      }
    };
    
    function showEmployeeVacations(funcionario){

      $scope.periodoFerias = new Array();
      var itemFerias = {};
      for (var i=0; i<funcionario.ferias.length; i++){
        itemFerias = {};
        itemFerias.dataIniFtd = new Date(funcionario.ferias[i].periodo.anoInicial, 
          funcionario.ferias[i].periodo.mesInicial-1, funcionario.ferias[i].periodo.dataInicial, 0, 0, 0, 0);
        itemFerias.dataFinFtd = new Date(funcionario.ferias[i].periodo.anoFinal, 
          funcionario.ferias[i].periodo.mesFinal-1, funcionario.ferias[i].periodo.dataFinal, 0, 0, 0, 0);
        itemFerias.qtdeDias = funcionario.ferias[i].qtdeDias;
        itemFerias.aprovadoPor = funcionario.ferias[i].cadastradoPor;
        itemFerias.arrayDias = funcionario.ferias[i].arrayDias;
        itemFerias._id = funcionario.ferias[i]._id;
        $scope.periodoFerias.push(itemFerias);
      }

    };

    function searchEmployee(nameKey, myArray){
      for (var i=0; i < myArray.length; i++) {
          if (myArray[i]._id === nameKey) {
              return myArray[i];
          }
      }
    };

    //Traz todos os employees para tela de Administrador
    function getAllEmployees(allEmployees, allEquipes) {
      
      //var empsArray = allEmployees.data;
      $scope.equipes = allEquipes.data;
      fillEquipes();
      
      $scope.filtroPonto = true;
    };

   /*
     *
     * Função chamada no início do carregamento, traz as equipes do gestor atual
     *
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
      for (var i=0; i<$scope.equipes.length; i++){
        for (var j=0; j<$scope.equipes[i].componentes.length; j++) {
          setEquipeAttrsForEmployee($scope.equipes[i].componentes[j], $scope.equipes[i]);
          $scope.employees.push($scope.equipes[i].componentes[j]);
          $scope.employeesNames.push( { 
            id: $scope.equipes[i].componentes[j]._id, 
            name: $scope.equipes[i].componentes[j].nome + ' ' + $scope.equipes[i].componentes[j].sobrenome,
            matricula: $scope.equipes[i].componentes[j].matricula,
            PIS: $scope.equipes[i].componentes[j].PIS,
            cargo: $scope.equipes[i].componentes[j].sexoMasculino ? $scope.equipes[i].componentes[j].alocacao.cargo.especificacao : $scope.equipes[i].componentes[j].alocacao.cargo.nomeFeminino,
            equipe: $scope.equipes[i].nome
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

    function updateRevertVacations(emp, itemFerias){

      var objEmployeeFerias = {employee: emp, ferias: itemFerias};
      console.log("Objeto Enviado", objEmployeeFerias);

      appointmentAPI.reverterFerias(objEmployeeFerias).then(function successCallback(response){

        var feriasResponse = response.data;
        if(feriasResponse){
          console.log("Response: ", feriasResponse);
        } 

      }, 
      function errorCallback(response){
        $errorMsg = response.data.message;
      });

    };
    
    function init () {
      
      console.log("Perfil: ", Usuario.perfil);

      if (Usuario.perfil.accessLevel == 2 || Usuario.perfil.accessLevel == 3) {
        
        $scope.gestor = Usuario.funcionario;
        getEquipesByGestor();

      } else if (Usuario.perfil.accessLevel == 4) {
         
        $scope.isAdmin = true;
        getAllEmployees(allEmployees, allEquipes);

      } else if (Usuario.perfil.accessLevel >= 5) {

        $scope.isAdmin = true;
        getAllEmployees(allEmployees, allEquipes);

      } else {

        $scope.errorMsg = "Este funcionário não tem permissão para visualizar estas informações";

      }

      if (!$scope.gestor){
          
        var currentUser = Auth.getCurrentUser();
        gestor = {
          nome: currentUser._id,
          sobrenome: currentUser._id,
          email: currentUser.email,
          PIS: currentUser.email
        };
      } else {
        gestor.nome = $scope.gestor.nome;
        gestor.sobrenome = $scope.gestor.sobrenome;
        gestor.PIS = $scope.gestor.PIS;
        gestor.email = $scope.gestor.email;
      }
    };
  }   

})();
