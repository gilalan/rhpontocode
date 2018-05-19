/**
 * @author Gilliard Lopes
 * created on 26/04/2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.admadjsol', ['ui.bootstrap'])
      .config(routeConfig);

  /** @ngInject */
  function routeConfig($stateProvider) {
    $stateProvider
      .state('admadjsol', {
        url: '/admadjsol',
        templateUrl: 'app/pages/ajuste_ponto/admadjsol.html',
        controller: 'AdmAdjSolCtrl',
        title: 'Gerenciar Ajustes de Ponto',
        sidebarMeta: {
           icon: 'ion-thumbsup',
           order: 62,
        },
        accessLevel: [5],
        resolve: {
          adjSolicitations: function(myhitpointAPI){
            return myhitpointAPI.get();
          }
        }
      })
      .state('admadjsol.new', {
        url: '/new',
        templateUrl: 'app/pages/ajuste_ponto/edit/edit.html',
        controller: 'NewAdjustAdminCtrl',
        title: 'Novo Ajuste!',
        // resolve: {          
        //   instituicoes: function(institutionAPI){
        //     return institutionAPI.get();
        //   }
        // },
        accessLevel: [5]
      })
      .state('admadjsol.edit', {
        url: '/edit/:id',
        templateUrl: 'app/pages/ajuste_ponto/edit/edit.html',
        controller: 'EditAdjustAdminCtrl',
        title: 'Editar Ajuste de Solicitação',
        // resolve: {
        //   funcionario: function(employeeAPI, $stateParams){
        //     return employeeAPI.getFuncionario($stateParams.id);
        //   }
        // },
        accessLevel: [5]
      });
  }

})();
