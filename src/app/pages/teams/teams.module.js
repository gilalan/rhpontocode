/**
 * @author Gilliard Lopes
 * created on 20/04/2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.teams', [])    
    .config(routeConfig);

  /** @ngInject */
  function routeConfig($stateProvider, $urlRouterProvider) {
    $stateProvider
      .state('teams', {
        url: '/teams',
        redirectTo: 'teams.list',
        //abstract: true,
        template: '<ui-view></ui-view>',
        title: 'Equipes',
        sidebarMeta: {
          icon: 'ion-ios-people',
          order: 20,
        },
      })
      .state('teams.list', {
        url: '/list',
        templateUrl: 'app/pages/teams/list/list.html',
        controller: 'TeamListCtrl',
        title: 'Equipes',
        resolve: {
          equipes: function(teamAPI){
            return teamAPI.get();
          }
        },
        accessLevel: 3
      })
      .state('teams.new', {
        url: '/new',
        templateUrl: 'app/pages/teams/edit/edit.html',
        controller: 'NewTeamCtrl',
        title: 'Equipes',
        resolve: {
          setores: function(sectorAPI) {
            return sectorAPI.get();
          },
          gestores: function(employeeAPI){
            return employeeAPI.getGestores();
          }
        },
        accessLevel: 3
      })
      .state('teams.edit', {
        url: '/edit/:id',
        templateUrl: 'app/pages/teams/edit/edit.html',
        controller: 'EditTeamCtrl',
        title: 'Equipes',
        resolve: {
          equipe: function(teamAPI, $stateParams){
            return teamAPI.getEquipe($stateParams.id);
          }, 
          setores: function(sectorAPI) {
            return sectorAPI.get();
          },
          gestores: function(employeeAPI){
            return employeeAPI.getGestores();
          }
        },
        accessLevel: 3
      });

      $urlRouterProvider.when('/teams','/teams/list');
  }
})();
