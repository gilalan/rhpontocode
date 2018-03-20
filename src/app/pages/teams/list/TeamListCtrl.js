/**
 * @author Gilliard Lopes
 * created on 22.04.2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.teams')
    .controller('TeamListCtrl', TeamListCtrl)
    .controller('ModalDeleteTeamCtrl', ModalDeleteTeamCtrl);

  /** @ngInject */
  function TeamListCtrl($scope, $state, $stateParams, $uibModal, teamAPI, usuario, equipes) {

    console.log('equipes - List controller');
    $scope.smartTablePageSize = 10;
    console.log('Equipes pelo Resolve: ', equipes);
    var pageDeletePath = 'app/pages/teams/list/deleteModal.html';
    var defaultSize = 'md';
    $scope.liberado = false;
    $scope.gestor = usuario.data.funcionario;
    $scope.equipes = [];
    init();
    // if(!equipes)
    //   alert('Houve um problema de captura das informações no banco de dados');
    // else
    //   $scope.equipes = equipes.data;

    $scope.delete = function (id, index) {

      var modalInstance = $uibModal.open({
        animation: true,
        templateUrl: pageDeletePath,
        size: defaultSize,
        controller: 'ModalDeleteTeamCtrl',
        resolve: {
          equipe: function (teamAPI) {
            return teamAPI.getEquipe(id);
          }
        }
      });

      modalInstance.result.then(function (confirmation) {
        console.log('confirmação: ', confirmation);
        if (confirmation){
          $state.reload();
        }
      }, function () {
        console.log('modal-component dismissed at: ' + new Date());
      });
    }

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
            for (var i=0; i < $scope.equipes.length; i++) {
              $scope.equipes[i].componentes = $scope.equipes[i].componentes.filter(function( obj ) {
                return obj.active === true;
              });
            }
          } 
        } 

        console.log('Equipes do gestor: ', $scope.equipes);
        $scope.liberado = true;

      }, function errorCallback(response){
        
        $errorMsg = response.data.message;
      });
    };

    function init(){

      if ($scope.gestor) {
        if ($scope.gestor.alocacao.gestor) {//se realmente for um gestor
          //carregar equipes do gestor
          getEquipesByGestor();

        } else {
          $scope.errorMsg = "Este funcionário não é Gestor e portanto não pode visualizar estas informações";
        }
      } else {
          if (usuario.data.perfil.accessLevel >= 4) {
            //é um admin vendo a página, pode liberar
            $scope.equipes = equipes.data;
            $scope.isAdmin = true;
            $scope.liberado =true;
          }
      }
    };
  };

  function ModalDeleteTeamCtrl ($uibModalInstance, $scope, equipe, teamAPI) {
    
    $scope.equipe = equipe.data;
    var $ctrl = this;
    $ctrl.confirmation = true;

    $scope.delete = function(){
      
      teamAPI.delete($scope.equipe._id).then(function sucessCallback(response){

        console.log('deletou?', response.data);
        $scope.successMsg = response.data.message;
        console.log('msg: ', $scope.successMsg);
        $uibModalInstance.close($ctrl.confirmation);

      }, function errorCallback(response){

        console.log('erro ao deletar ', response.data.message);
        $scope.errorMsg = response.data.message;
      });
    }
  };

})();
