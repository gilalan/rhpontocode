/**
 * @author Gilliard Lopes
 * created on 22/04/2019
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.motivosajuste', [])
    .config(routeConfig);

  /** @ngInject */
  function routeConfig($stateProvider) {
    $stateProvider
      .state('motivosajuste', {
        url: '/motivosajuste',
        redirectTo: 'motivosajuste.list',
        template: '<ui-view></ui-view>',
        title: 'Motivos de Ajuste',
        sidebarMeta: {
          icon: 'ion-star',
          order: 61,
        },
        accessLevel: [2,3,4,5,6]
      })
      .state('motivosajuste.list', {
        url: '/list',
        templateUrl: 'app/pages/motivos_ajuste/list/list.html',
        controller: 'MotivoAjusteListCtrl',
        title: 'Motivos de Ajuste',
        resolve: {
          motivosAjuste: function(motivosAjusteAPI){
            return motivosAjusteAPI.get();
          }
        },
        accessLevel: [2,3,4,5,6]
      })
      .state('motivosajuste.new', {
        url: '/new',
        templateUrl: 'app/pages/motivos_ajuste/edit/edit.html',
        controller: 'NewMotivoAjusteCtrl',
        title: 'Novo Motivo de Ajuste',
        resolve: {           
          motivosAjuste: function(motivosAjusteAPI) {
            return motivosAjusteAPI.get();
          }
        },
        accessLevel: [2,3,4,5,6]
      })
      .state('motivosajuste.edit', {
        url: '/edit/:id',
        templateUrl: 'app/pages/motivos_ajuste/edit/edit.html',
        controller: 'EditMotivoAjusteCtrl',
        title: 'Editar Motivo de Ajuste',
        resolve: {           
          motivoAjuste: function(motivosAjusteAPI, $stateParams) {
            return motivosAjusteAPI.getMotivoAjuste($stateParams.id);
          },
          motivosAjuste: function(motivosAjusteAPI) {
            return motivosAjusteAPI.get();
          }
        },
        accessLevel: [2,3,4,5,6]
      });
  }
})();
