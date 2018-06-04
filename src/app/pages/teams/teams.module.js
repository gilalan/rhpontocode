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
        accessLevel: [3,4,5,6]
      })
      .state('teams.list', {
        url: '/list',
        templateUrl: 'app/pages/teams/list/list.html',
        controller: 'TeamListCtrl',
        title: 'Equipes',
        resolve: {
          usuario: function(usersAPI, Auth){
            return usersAPI.getUsuario(Auth.getCurrentUser()._id);
          },
          equipes: function(teamAPI){
            return teamAPI.get();
          }
        },
        accessLevel: [3,4,5,6]
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
          },
          fiscais: function(employeeAPI){
            return employeeAPI.getFiscais();
          }
        },
        accessLevel: [3,4,5,6]
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
          },
          fiscais: function(employeeAPI){
            return employeeAPI.getFiscais();
          }
        },
        accessLevel: [3,4,5,6]
      })
      .state('teams.associate', {
        url: '/associate/:id',
        templateUrl: 'app/pages/teams/associate/associate.html',
        controller: 'AssociateTeamCtrl',
        title: 'Equipes',
        resolve: {
          equipe: function(teamAPI, $stateParams){
            return teamAPI.getEquipe($stateParams.id);
          },
          funcionarios: function(employeeAPI){
            return employeeAPI.getActives();
          }
        },
        accessLevel: [3,4,5,6]
      });

      $urlRouterProvider.when('/teams','/teams/list');
  }
})();
