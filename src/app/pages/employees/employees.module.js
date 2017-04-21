/**
 * @author Gilliard Lopes
 * created on 20/04/2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.employees', [])
    .config(routeConfig);

  /** @ngInject */
  function routeConfig($stateProvider) {
    $stateProvider
      .state('employees', {
        url: '/funcionarios',
        templateUrl: 'app/pages/employees/employees.html',
          title: 'Funcionários',
          sidebarMeta: {
            icon: 'ion-person',
            order: 20,
          },
      });
  }
})();
