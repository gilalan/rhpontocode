/**
 * @author Gilliard Lopes
 * created on 20/04/2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.entities.sectors', [])
    .config(routeConfig);

  /** @ngInject */
  function routeConfig($stateProvider) {
    $stateProvider
      .state('entities.sectors', {
        url: '/setores',
        templateUrl: 'app/pages/entities/sectors/sectors.html',
          title: 'Setores',
          sidebarMeta: {
            icon: 'ion-ios-briefcase',
            order: 0,
          },
      });
  }
})();