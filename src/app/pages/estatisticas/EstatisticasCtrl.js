/**
 * @author Gilliard Lopes
 * created on 04/12/2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.estatisticas')
      .controller('EstatisticasCtrl', EstatisticasCtrl);

  /** @ngInject */
  function EstatisticasCtrl($scope, $filter, $location, $state, $interval, appointmentAPI, employeeAPI, Auth, usuario, equipes){//, rawAppoints) {

    console.log("dentro do EstatisticasCtrl, USUARIO: ", usuario);
    $scope.funcionario = usuario.data.funcionario;
    console.log('Funcionário: ', $scope.funcionario);

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
