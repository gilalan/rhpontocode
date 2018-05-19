/**
 * @author Gilliard Lopes
 * created on 20/04/2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.entities.sectors', [])
    .config(routeConfig);

  /** @ngInject */
  function routeConfig($stateProvider, $urlRouterProvider) {
    $stateProvider
      .state('entities.sectors', {
        url: '/sectors',
        abstract: true,
        templateUrl: 'app/pages/entities/sectors/sectors.html',
        controller: 'SectorCtrl',
        title: 'Setores',
        sidebarMeta: {
          icon: 'ion-ios-briefcase',
          order: 200,
        },
        accessLevel: [4,5]
      })
      .state('entities.sectors.list', {
        url: '/list',
        templateUrl: 'app/pages/entities/sectors/list/list.html',
        controller: 'SectorListCtrl',
        title: 'Setores',
        resolve: {
          setores: function(sectorAPI){
            return sectorAPI.get();
          }
        },
        accessLevel: 3
      })
      .state('entities.sectors.new', {
        url: '/new',
        templateUrl: 'app/pages/entities/sectors/edit/edit.html',
        controller: 'NewSectorCtrl',
        title: 'Setores',
        resolve: {
          campi: function(campusAPI) {
            return campusAPI.get();
          },
          estados: function(estadosAPI){
            return estadosAPI.get();
          }
        },
        accessLevel: 3
      })
      .state('entities.sectors.edit', {
        url: '/edit/:id',
        templateUrl: 'app/pages/entities/sectors/edit/edit.html',
        controller: 'EditSectorCtrl',
        title: 'Setores',
        resolve: {
          setor: function(sectorAPI, $stateParams){
            return sectorAPI.getSetor($stateParams.id);
          }, 
          campi: function(campusAPI) {
            return campusAPI.get();
          },
          estados: function(estadosAPI){
            return estadosAPI.get();
          }
        },
        accessLevel: 3
      });

      $urlRouterProvider.when('/entities/sectors','/entities/sectors/list');
  }

})();