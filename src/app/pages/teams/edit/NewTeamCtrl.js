/**
 * @author Gilliard Lopes
 * created on 22.04.2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.teams')
      .controller('NewTeamCtrl', NewTeamCtrl);

  /** @ngInject */
  function NewTeamCtrl($scope, $filter, $state, teamAPI, setores, gestores) {

    console.log("dentro do NewTEAMCtrl! Lista de setores: ", setores);
    $scope.title = 'Nova';
    $scope.setores = setores.data;
    $scope.gestores = gestores.data;
    
    if ($scope.setores.length > 0)
      $scope.selected = { item: $scope.setores[0] };

    if ($scope.gestores.length > 0)
      $scope.selectedG = { item: $scope.gestores[0] };
    
    $scope.save = function (equipe) {

      //acopla o setor a equipe
      equipe.setor = $scope.selected.item;
      equipe.gestor = $scope.selectedG.item;
      console.log('Equipe enviada: ', equipe);
      teamAPI.create(equipe).then(function sucessCallback(response){

        console.log("dados recebidos: ", response.data);
        $scope.successMsg = response.data.message;      
        
        //back to list
        $state.go('teams.list');

      }, function errorCallback(response){
        
        $scope.errorMsg = response.data.message;
        console.log("Erro de registro: " + response.data.message);
        
      });   
    }
  }

})();
