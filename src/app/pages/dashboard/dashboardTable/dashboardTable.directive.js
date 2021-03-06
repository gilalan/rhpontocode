/**
 * @author Gilliard Lopes
 * created on 25.04.2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.dashboard')
      .directive('dashboardTable', dashboardTable);

  /** @ngInject */
  function dashboardTable() {
    return {
      restrict: 'E',
      controller: 'DashboardTableCtrl',
      scope: {
        setores: '=',
        usuario: '=',
        currdate: '=',
        feriados: '=',
        equipes: '=',
        equipeSelected: '='
      },
      templateUrl: 'app/pages/dashboard/dashboardTable/dashboardTable.html'
    };
  }
})();