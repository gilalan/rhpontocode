/**
 * @author Gilliard Lopes
 * created on 22/04/2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.feriados', [])
    .config(routeConfig);

  /** @ngInject */
  function routeConfig($stateProvider) {
    $stateProvider
      .state('feriados', {
        url: '/feriados',
        redirectTo: 'feriados.list',
        template: '<ui-view></ui-view>',
        title: 'Feriados',
        sidebarMeta: {
          icon: 'ion-ios-calendar',
          order: 60,
        },
        accessLevel: [3,4,5]
      })
      .state('feriados.list', {
        url: '/list',
        templateUrl: 'app/pages/feriados/list/list.html',
        controller: 'FeriadoListCtrl',
        title: 'Feriados',
        resolve: {
          feriados: function(feriadoAPI){
            return feriadoAPI.get();
          }
        },
        accessLevel: 3
      })
      .state('feriados.new', {
        url: '/new',
        templateUrl: 'app/pages/feriados/edit/edit.html',
        controller: 'NewFeriadoCtrl',
        title: 'Feriados',
        resolve: {           
          estados: function(estadosAPI) {
            return estadosAPI.get();
          }
        },
        accessLevel: 3
      })
      .state('feriados.edit', {
        url: '/edit/:id',
        templateUrl: 'app/pages/feriados/edit/edit.html',
        controller: 'EditFeriadoCtrl',
        title: 'Feriados',
        resolve: {           
          feriado: function(feriadoAPI, $stateParams) {
            return feriadoAPI.getFeriado($stateParams.id);
          },
          estados: function(estadosAPI) {
            return estadosAPI.get();
          }
        },
        accessLevel: 3
      });
  }
})();
