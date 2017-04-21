/**
 * @author Gilliard Lopes
 * created on 20/04/2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.teams', [])
    .config(routeConfig);

  /** @ngInject */
  function routeConfig($stateProvider) {
    $stateProvider
      .state('teams', {
        url: '/equipes',
        templateUrl: 'app/pages/teams/teams.html',
          title: 'Equipes',
          sidebarMeta: {
            icon: 'ion-person-stalker',
            order: 10,
          },
      });
  }
})();
