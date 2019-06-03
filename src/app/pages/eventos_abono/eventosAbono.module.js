/**
 * @author Gilliard Lopes
 * created on 22/04/2019
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.eventosabono', [])
    .config(routeConfig);

  /** @ngInject */
  function routeConfig($stateProvider) {
    $stateProvider
      .state('eventosabono', {
        url: '/eventosabono',
        redirectTo: 'eventosabono.list',
        template: '<ui-view></ui-view>',
        title: 'Eventos de Abono',
        sidebarMeta: {
          icon: 'ion-star',
          order: 61,
        },
        accessLevel: [3,4,5,6]
      })
      .state('eventosabono.list', {
        url: '/list',
        templateUrl: 'app/pages/eventos_abono/list/list.html',
        controller: 'EventoAbonoListCtrl',
        title: 'Eventos de Abono',
        resolve: {
          eventosAbono: function(eventosAbonoAPI){
            return eventosAbonoAPI.get();
          }
        },
        accessLevel: [3,4,5,6]
      })
      .state('eventosabono.new', {
        url: '/new',
        templateUrl: 'app/pages/eventos_abono/edit/edit.html',
        controller: 'NewEventoAbonoCtrl',
        title: 'Novo Evento de Abono',
        resolve: {           
          eventosAbono: function(eventosAbonoAPI) {
            return eventosAbonoAPI.get();
          }
        },
        accessLevel: [3,4,5,6]
      })
      .state('eventosabono.edit', {
        url: '/edit/:id',
        templateUrl: 'app/pages/eventos_abono/edit/edit.html',
        controller: 'EditEventoAbonoCtrl',
        title: 'Editar Evento de Abono',
        resolve: {           
          eventoAbono: function(eventosAbonoAPI, $stateParams) {
            return eventosAbonoAPI.getEventoAbono($stateParams.id);
          },
          eventosAbono: function(eventosAbonoAPI) {
            return eventosAbonoAPI.get();
          }
        },
        accessLevel: [3,4,5,6]
      });
  }
})();
