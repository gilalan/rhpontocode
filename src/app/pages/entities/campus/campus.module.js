/**
 * @author Gilliard Lopes
 * created on 20/04/2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.entities.campus', [])
    .config(routeConfig);

  /** @ngInject */
  function routeConfig($stateProvider) {
    $stateProvider
      .state('entities.campus', {
        url: '/campi',
        templateUrl: 'app/pages/entities/campus/campus.html',
          title: 'Campi',
          sidebarMeta: {
            icon: 'ion-android-bicycle',
            order: 100,
          },
      });
  }
})();