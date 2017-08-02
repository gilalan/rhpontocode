/**
 * @author Gilliard Lopes
 * created on 20/04/2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.shifts', ['ui.mask'])
    .config(routeConfig);

  /** @ngInject */
  function routeConfig($stateProvider) {
    $stateProvider
      .state('shifts', {
        url: '/shifts',
        redirectTo: 'shifts.list',
        template: '<ui-view></ui-view>',
        title: 'Turnos',
        sidebarMeta: {
          icon: 'ion-flag',
          order: 50,
        },
        accessLevel: 3
      })
      .state('shifts.list', {
        url: '/list',
        templateUrl: 'app/pages/shifts/list/list.html',
        controller: 'ShiftListCtrl',
        title: 'Turnos',
        resolve: {
          turnos: function(shiftAPI){
            return shiftAPI.get();
          }
        },
        accessLevel: 3
      })
      .state('shifts.new', {
        url: '/new',
        templateUrl: 'app/pages/shifts/edit/edit.html',
        controller: 'NewShiftCtrl',
        controllerAs: 'vm',
        title: 'Turnos',
        resolve: {
          escalas: function(scaleAPI) {
            return scaleAPI.get();
          }
        },
        accessLevel: 3
      })
      .state('shifts.edit', {
        url: '/edit/:id',
        templateUrl: 'app/pages/shifts/edit/edit.html',
        controller: 'EditShiftCtrl',
        title: 'Turnos',
        resolve: {
          turno: function(shiftAPI, $stateParams){
            return shiftAPI.getTurno($stateParams.id);
          }, 
          escalas: function(scaleAPI) {
            return scaleAPI.get();
          }
        },
        accessLevel: 3
      });
  }
})();
