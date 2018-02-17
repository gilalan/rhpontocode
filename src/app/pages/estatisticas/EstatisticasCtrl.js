/**
 * @author Gilliard Lopes
 * created on 04/12/2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.estatisticas')
      .controller('EstatisticasCtrl', EstatisticasCtrl);

  /** @ngInject */
  function EstatisticasCtrl($scope, $filter, $location, $state, $interval, appointmentAPI, employeeAPI, Auth, usuario, equipes) {

    console.log("dentro do EstatisticasCtrl, USUARIO: ", usuario);
    $scope.funcionario = usuario.data.funcionario;
    console.log('Funcionário: ', $scope.funcionario);

    $scope.equipes = equipes.data;

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
