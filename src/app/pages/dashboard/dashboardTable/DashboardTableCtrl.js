/**
 * @author Gilliard Lopes
 * created on 25/04/2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.dashboard')
      .controller('DashboardTableCtrl', DashboardTableCtrl);

  /** @ngInject */
  function DashboardTableCtrl($scope) {
    
    console.log('setores pelo resolve: ', $scope.setores);
    console.log('usuario pelo resolve: ', $scope.usuario);
    console.log('feriados pelo resolve: ', $scope.feriados);
    console.log('currentDate pelo resolve: ', $scope.currdate);
    console.log('Equipes pelo resolve: ', $scope.equipes);
    console.log('equipe selected pelo resolve, ', $scope.equipeSelected);

  }
})();