/**
 * @author Gilliard Lopes
 * created on 18/05/2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.solicitations', [])
    .config(routeConfig);

  /** @ngInject */
  function routeConfig($stateProvider) {
    $stateProvider
      .state('solicitations', {
        url: '/solicitations',
        redirectTo: 'solicitations.list',
        template: '<ui-view></ui-view>',
        title: 'Solicitações',
        sidebarMeta: {
          icon: 'ion-ios-list',
          order: 2,
        },
        accessLevel: 3
      })
      .state('solicitations.list', {
        url: '/list',
        templateUrl: 'app/pages/solicitations/list/list.html',
        controller: 'SolicitationListCtrl',
        title: 'Solicitações',
        resolve: {
          // solicitacoes: function(solicitationAPI){
          //   return solicitationAPI.get();
          // }
          solicitacoes: function(myhitpointAPI){
            return myhitpointAPI.get();
          }
        },
        accessLevel: 3
      })
      .state('solicitations.new', {
        url: '/new',
        templateUrl: 'app/pages/solicitations/edit/edit.html',
        controller: 'NewSolicitationCtrl',
        title: 'Solicitações',
        // resolve: {
        //   cargos: function(jobAPI) {
        //     return jobAPI.get();
        //   },
        //   turnos: function(shiftAPI){
        //     return shiftAPI.get();
        //   },
        //   instituicoes: function(institutionAPI){
        //     return institutionAPI.get();
        //   }
        // },
        accessLevel: 3
      })
      .state('solicitations.edit', {
        url: '/edit/:id',
        templateUrl: 'app/pages/solicitations/edit/edit.html',
        controller: 'EditSolicitationCtrl',
        title: 'Solicitações',
        // resolve: {
        //   funcionario: function(employeeAPI, $stateParams){
        //     return employeeAPI.getFuncionario($stateParams.id);
        //   }, 
        //   cargos: function(jobAPI) {
        //     return jobAPI.get();
        //   },
        //   turnos: function(shiftAPI){
        //     return shiftAPI.get();
        //   },
        //   instituicoes: function(institutionAPI){
        //     return institutionAPI.get();
        //   }
        // },
        accessLevel: 3
      });
  }
})();
