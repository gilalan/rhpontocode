/**
 * @author Gilliard Lopes
 * created on 01/05/2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.teams')
      .controller('AssociateTeamCtrl', AssociateTeamCtrl);

  /** @ngInject */
  function AssociateTeamCtrl($scope, $filter, $state, $window, teamAPI, equipe, funcionarios) {

    console.log("dentro do AssociateTeamCtrl!");
    $scope.equipe = equipe.data;
    $scope.funcionarios = funcionarios.data;
    $scope.smartTablePageSize = 10;

    $scope.associar = function (usuario) {

      // Obtendo funcionários selecionados
      var selectedWorkers = $scope.funcionarios.filter(function(funcionario){
        return funcionario.selected;
      });

      console.log("selectedWorkers", selectedWorkers);
      var _componentes = selectedWorkers.map(function(componente){
        return componente._id;
      });

      console.log("Componentes para envio: ", _componentes);
      teamAPI.atualizarComponentes($scope.equipe._id, _componentes).then(function sucessCallback(response){

        $scope.successMsg = response.data.message;
        $state.go('teams.list');
      
      }, function errorCallback(response){
          
        $scope.errorMsg = response.data.message;
        $window.scrollTo(0,0);
        console.log("Erro de registro: " + response.data.message);
          
      });     
    }

    $scope.setSelected = function (funcionario) {
        console.log("setSelected ", funcionario.nome);
        funcionario.selected = !funcionario.selected;
    }

    function checkAssociation () {

      console.log("verificando os componentes da equipe...");
      $scope.equipe.componentes.forEach(function(componente){
         
        $scope.funcionarios.some(function(funcionario){

          if (funcionario._id === componente._id)
            funcionario.selected = true;

          return funcionario._id === componente._id;
        });
      });
    }
        
    checkAssociation();
  }

})();
