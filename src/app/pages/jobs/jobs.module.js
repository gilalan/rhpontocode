/**
 * @author Gilliard Lopes
 * created on 22/04/2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.jobs', [])
    .config(routeConfig);

  /** @ngInject */
  function routeConfig($stateProvider) {
    $stateProvider
      .state('jobs', {
        url: '/jobs',
        redirectTo: 'jobs.list',
        template: '<ui-view></ui-view>',
        title: 'Cargos',
        sidebarMeta: {
          icon: 'ion-ios-briefcase',
          order: 40,
        },
        accessLevel: [3,4,5,6]
      })
      .state('jobs.list', {
        url: '/list',
        templateUrl: 'app/pages/jobs/list/list.html',
        controller: 'JobListCtrl',
        title: 'Cargos',
        resolve: {
          cargos: function(jobAPI){
            return jobAPI.get();
          }
        },
        accessLevel: [3,4,5,6]
      })
      .state('jobs.new', {
        url: '/new',
        templateUrl: 'app/pages/jobs/edit/edit.html',
        controller: 'NewJobCtrl',
        title: 'Cargos',
        accessLevel: [3,4,5,6]
      })
      .state('jobs.edit', {
        url: '/edit/:id',
        templateUrl: 'app/pages/jobs/edit/edit.html',
        controller: 'EditJobCtrl',
        title: 'Cargos',
        resolve: {           
          cargo: function(jobAPI, $stateParams) {
            return jobAPI.getCargo($stateParams.id);
          }
        },
        accessLevel: [3,4,5,6]
      });
  }
})();
