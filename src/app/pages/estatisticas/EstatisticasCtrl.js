/**
 * @author Gilliard Lopes
 * created on 04/12/2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.estatisticas')
      .controller('EstatisticasCtrl', EstatisticasCtrl);

  /** @ngInject */
  function EstatisticasCtrl($scope, $filter, $location, $state, $interval, appointmentAPI, employeeAPI, util, utilReports, Auth, usuario, equipes, allEmployees){//, rawAppoints) {

    console.log("dentro do EstatisticasCtrl, USUARIO: ", usuario);
    $scope.funcionario = usuario.data.funcionario;
    console.log('Funcionário: ', $scope.funcionario);

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
    $scope.employees = allEmployees.data;
    $scope.equipes = equipes.data;
    $scope.rawApps = [];
    //$scope.rawApps = rawAppoints.data.rawReps;
    //console.log("rawAppoints: ", $scope.rawApps);

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

    function open() {
        console.log("open function", $scope.something.opened);
        $scope.something.opened = true;
    }

    init();
    
    function getAllEquipesEstatistica (equipesArray) {

      console.log("Equipes Array: ", equipesArray);

      for (var i=0; i < $scope.employees.length; i++){

        $scope.employees[i].name = $scope.employees[i].nome + ' ' + $scope.employees[i].sobrenome;
        $scope.employees[i].cargo = $scope.employees[i].sexoMasculino ? $scope.employees[i].alocacao.cargo.especificacao : $scope.employees[i].alocacao.cargo.nomeFeminino,
        $scope.employees[i].infoHorario = util.getInfoHorario($scope.employees[i], []);
      }

      var docDefinition = utilReports.gerarRelatorioFuncionariosHorarios($scope.employees);
      docDefinition.footer = function(currentPage, pageCount) { 
        return { 
          text: currentPage.toString() + ' de ' + pageCount, 
          alignment: 'right', 
          margin: [20, 0] 
        }; 
      };

      // download the PDF
      //pdfMake.createPdf(docDefinition).download('relatorioFuncionarios.pdf');

      appointmentAPI.getEquipesEstatistica(equipesArray).then(function successCallback(response){

        var apontamentosResponse = response.data;
        console.log("!@# Apontamentos retornados: ", apontamentosResponse);

      }, function errorCallback(response){
        
        //$errorMsg = response.data.message;
        console.log("Erro ao obter apontamentos de equipe estatisticas");
      });
    };
    
    function getId (array) {
      return (array.length + 1);
    };

    function init () {

      getAllEquipesEstatistica($scope.equipes);
    };
  }   

})();
