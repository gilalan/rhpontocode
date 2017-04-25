/**
 * @author Gilliard Lopes
 * created on 20/04/2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.entities.campus', [])
    .config(routeConfig);

  /** @ngInject */
  function routeConfig($stateProvider, $urlRouterProvider) {
    $stateProvider
      .state('entities.campus', {
        url: '/campus',
        abstract: true,
        templateUrl: 'app/pages/entities/campus/campus.html',
        controller: 'CampusCtrl',
        title: 'Campi',
        sidebarMeta: {
          icon: 'ion-android-bicycle',
          order: 100,
        },
        accessLevel: 3
      })
      .state('entities.campus.list', {
        url: '/list',
        templateUrl: 'app/pages/entities/campus/list/list.html',
        controller: 'CampusListCtrl',
        title: 'Campi',
        resolve: {
          campi: function(campusAPI){
            return campusAPI.get();
          }
        },
        accessLevel: 3
      })
      .state('entities.campus.new', {
        url: '/new',
        templateUrl: 'app/pages/entities/campus/edit/edit.html',
        controller: 'NewCampusCtrl',
        title: 'Campi',
        resolve: {
          instituicoes: function(institutionAPI) {
            return institutionAPI.get();
          }
        },
        accessLevel: 3
      })
      .state('entities.campus.edit', {
        url: '/edit/:id',
        templateUrl: 'app/pages/entities/campus/edit/edit.html',
        controller: 'EditCampusCtrl',
        title: 'Campi',
        resolve: {
          campus: function(campusAPI, $stateParams){
            return campusAPI.getCampus($stateParams.id);
          }, 
          instituicoes: function(institutionAPI) {
            return institutionAPI.get();
          }
        },
        accessLevel: 3
      });

      $urlRouterProvider.when('/entities/campus','/entities/campus/list');
  }
})();