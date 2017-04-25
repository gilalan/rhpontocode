/**
 * @author v.lugovksy
 * created on 25/04/2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.dashboard')
      .directive('dashboardBarChart', dashboardBarChart);

  /** @ngInject */
  function dashboardBarChart() {
    return {
      restrict: 'E',
      controller: 'DashboardBarChartCtrl',
      templateUrl: 'app/pages/dashboard/dashboardBarChart/dashboardBarChart.html'
    };
  }
})();