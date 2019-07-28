/**
 * @author Gilliard Lopes
 * created on 04/12/2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.estatisticas')
      .controller('EstatisticasCtrl', EstatisticasCtrl);

  /** @ngInject */
  function EstatisticasCtrl($scope, $filter, $location, $state, $interval, appointmentAPI, employeeAPI, myhitpointAPI, util, utilReports, Auth, usuario, equipes, allEmployees){//, rawAppoints) {

    console.log("dentro do EstatisticasCtrl, USUARIO: ", usuario);
    $scope.funcionario = usuario.data.funcionario;
    console.log('Funcionário: ', $scope.funcionario);
    var arrayTestEmployees = ["0012315", "0192461", "098127615", "980157", "0009841", "0010002", "0000000111222"] //(BLACK LIST USUARIOS)
    $scope.newResource = {};
    $scope.files = [];
    var resourcesFiles = [];
    $scope.flags = {
      funcs: true,
      appoints: false
    };

    if (allEmployees.data){
      allEmployees.data.sort(function (a, b) {
        if (a.nome > b.nome) {
          return 1;
        }
        if (a.nome < b.nome) {
          return -1;
        }
        // a must be equal to b
        return 0;
      });
    }
    $scope.employees = allEmployees.data;
    $scope.equipes = equipes.data;
    $scope.rawApps = [];
    //$scope.apontamentos = allApontamentos.data;
    //$scope.rawApps = rawAppoints.data.rawReps;
    console.log("Equipes: ", $scope.equipes);
    console.log("employees: ", $scope.employees);

    $scope.datepic = {
      dt: new Date()
    };

    $scope.options = {
      showWeeks: false
    };
    $scope.open = open;
    $scope.something = {
      opened: false
    };

    $scope.formats = ['dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate'];
    $scope.format = $scope.formats[0];  

    init();

    $scope.allFuncs = function(){

      $scope.flags.funcs = true;
      $scope.flags.appoints = false;
      indicateFiredEmployees();
      getAllEquipesEstatistica($scope.equipes);

    };

    $scope.adjustAppoints = function(){

      $scope.flags.funcs = false;
      $scope.flags.appoints = true;
      console.log("Vai solicitar o ajuste!");
      appointmentAPI.adjustRepeated().then(function successCallback(response){

        var apontamentosResponse = response.data;
        fillFields(apontamentosResponse);

      }, function errorCallback(response){
        
        $scope.errorMsg = response.data.message;
      });
    };

    function open() {
        console.log("open function", $scope.something.opened);
        $scope.something.opened = true;
    };

    $scope.adjustAppointsEmp = function(empl){

      console.log("employee: ", empl);

      appointmentAPI.adjustRepeatedEmp(empl).then(function successCallback(response){

        var apontamentosResponse = response.data;
        fillFields(apontamentosResponse);

      }, function errorCallback(response){
        
        $scope.errorMsg = response.data.message;
      });

    };    
    
    function getAllEquipesEstatistica (equipesArray) {

      console.log("Equipes Array: ", equipesArray);

      for (var i=0; i < $scope.employees.length; i++){

        $scope.employees[i].name = $scope.employees[i].nome + ' ' + $scope.employees[i].sobrenome;
        $scope.employees[i].cargo = $scope.employees[i].sexoMasculino ? $scope.employees[i].alocacao.cargo.especificacao : $scope.employees[i].alocacao.cargo.nomeFeminino,
        $scope.employees[i].infoHorario = util.getInfoHorario($scope.employees[i], []);
      }

      // var docDefinition = utilReports.gerarRelatorioFuncionariosHorarios($scope.employees);
      // docDefinition.footer = function(currentPage, pageCount) { 
      //   return { 
      //     text: currentPage.toString() + ' de ' + pageCount, 
      //     alignment: 'right', 
      //     margin: [20, 0] 
      //   }; 
      // };

      // download the PDF
      //pdfMake.createPdf(docDefinition).download('relatorioFuncionarios.pdf');

      // appointmentAPI.getEquipesEstatistica(equipesArray).then(function successCallback(response){

      //   var apontamentosResponse = response.data;
      //   console.log("!@# Apontamentos retornados: ", apontamentosResponse);

      // }, function errorCallback(response){
        
      //   //$errorMsg = response.data.message;
      //   console.log("Erro ao obter apontamentos de equipe estatisticas");
      // });
    };

    function indicateFiredEmployees(){

      var arrayFireds = [];
      var contador = 0;

      for (var i=0; i < $scope.employees.length; i++){

        for (var j=0; j < arrayTestEmployees.length; j++){
          if ($scope.employees[i].matricula == arrayTestEmployees[j]){
            $scope.employees.splice(i, 1);
          }
        }

        arrayFireds = [];
        $scope.employees[i].name = $scope.employees[i].nome + ' ' + $scope.employees[i].sobrenome;
        
        if ($scope.employees[i].historico.datasDemissao.length > 0) {
          arrayFireds =  $scope.employees[i].historico.datasDemissao;
          var dateDem = arrayFireds[arrayFireds.length-1];
          $scope.employees[i].FIRED = $filter('date')(dateDem, 'dd/MM/yyyy');
          contador++;
        }      

        //$scope.employees[i].FIRED = $scope.employees[i].alocacao.gestor ? "GESTOR" : "FUNCIONARIO NORMAL";
        //$scope.employees[i].FIRED = $scope.employees[i].historico.datasDemissao.length > 0 ? true : false; 
      }

      console.log("Contador de demitidos: ", contador);

      for (var i=0; i < $scope.equipes.length; i++){

        for (var j=0; j < $scope.equipes[i].componentes.length; j++){

          for (var k=0; k < $scope.employees.length; k++ ){

            if ($scope.equipes[i].componentes[j].matricula == $scope.employees[k].matricula){
              if (!$scope.employees[k].equipes){
                $scope.employees[k].teams = [$scope.equipes[i].nome];
              } else {
                $scope.employees[k].teams.push($scope.equipes[i].nome);
              }
              break;
            }
          }
        }
      }
    };
    
    function getId (array) {
      return (array.length + 1);
    };

    function init() {

      indicateFiredEmployees();
      getAllEquipesEstatistica($scope.equipes);
    };


    function fillFields (apontamentos) {
      
      console.log("apontamentos: ", apontamentos);
      $scope.quantity = apontamentos.quantity;
      $scope.quantityRepeated = apontamentos.quantityRep;
      // var repeatedAppoints = [];
      // $scope.quantity = apontamentos.length;
      for (var i=0; i<apontamentos.arrayRep.length; i++){
        
        console.log('Date: ', new Date(apontamentos.arrayRep[i].data));
        //console.log('Timezone da data: ', .getTimezoneOffset());  
        
      }
      // $scope.quantityRepeated = repeatedAppoints.length;
      // console.log("repeatedAppoints: ", repeatedAppoints);
    };

    function checkRepeatedElements(marcacoes){

      if (marcacoes.length < 2){
        return false;
      }

      else {
        var keyObj = {};
        for (var j=0; j<marcacoes.length; j++){
          //keyObj[marcacoes[j].totalMin] = 
          if(!keyObj[marcacoes[j].totalMin])
            keyObj[marcacoes[j].totalMin] = 0;
          keyObj[marcacoes[j].totalMin] += 1;
        }
        var hasDupl = false;
        for (var prop in keyObj){
          if (keyObj[prop] >= 2)
            hasDupl = true;
        }

        return hasDupl;
      }

    };

    function removeRepeatedElements(marcacoes){

      var obj = {};

      for ( var i=0, len=things.thing.length; i < len; i++ )
        obj[things.thing[i]['place']] = things.thing[i];

      things.thing = new Array();
      for ( var key in obj )
        things.thing.push(obj[key]);

    };
  }   

})();
