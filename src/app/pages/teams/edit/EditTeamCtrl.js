/**
 * @author Gilliard Lopes
 * created on 22.04.2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.teams')
      .controller('EditTeamCtrl', EditTeamCtrl);

  /** @ngInject */
  function EditTeamCtrl($scope, $filter, $state, equipe, teamAPI, setores, gestores) {

    console.log('dentro do EditTeamCtrl! ', equipe);
    $scope.title = 'Editar';
    $scope.equipe = equipe.data;
    $scope.setores = setores.data;
    $scope.gestores = gestores.data;
    console.log('Setores array: ', setores.data);

    function checkSetor(setor) {

      return $scope.equipe.setor._id == setor._id;
    }

    function checkGestor(gestor) {

      return $scope.equipe.gestor._id == gestor._id;
    }

    if ($scope.setores.length > 0){

      $scope.selected = { item: $scope.setores[$scope.setores.findIndex(checkSetor)] };
    }

    if ($scope.gestores.length > 0){

      $scope.selectedG = { item: $scope.gestores[$scope.gestores.findIndex(checkGestor)] };
    }
    
    $scope.save = function (equipe) {

      //acopla o setor aa equipe
      equipe.setor = $scope.selected.item;
      equipe.gestor = $scope.selectedG.item;
      console.log('equipe enviada: ', equipe);

      teamAPI.update(equipe).then(function sucessCallback(response){

        console.log('dados recebidos da atualização: ', response.data);
        $scope.successMsg = response.data.message;      
        
        //back to list
        $state.go('teams.list');

      }, function errorCallback(response){
        
        $scope.errorMsg = response.data.message;
        console.log('Erro de registro: ' + response.data.message);
        
      });   
    }
  }

})();
