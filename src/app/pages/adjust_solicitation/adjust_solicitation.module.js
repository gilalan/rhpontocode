/**
 * @author Gilliard Lopes
 * created on 09/05/2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.adjustsolicitation', ['ui.bootstrap'])
      .config(routeConfig);

  /** @ngInject */
  function routeConfig($stateProvider) {
    $stateProvider
        .state('adjustsolicitation', {
          url: '/adjustsolicitation/:userId/:year/:month/:day',
          templateUrl: 'app/pages/adjust_solicitation/adjust_solicitation.html',
          controller: 'AdjustSolicitationCtrl',
          title: 'Ajustes de Batidas',
          sidebarMeta: {
             icon: 'ion-clipboard',
             order: 3,
          },
          accessLevel: [1],
          resolve: {
            usuario: function(usersAPI, $stateParams, Auth){
                          
              if ($stateParams.userId)
                return usersAPI.getUsuario($stateParams.userId);
              else {
                var user = Auth.getCurrentUser();
                console.log('## Usuário retornado: ##', user);
                return usersAPI.getUsuario(user._id);
              }
            },
            currentDate: function(appointmentAPI) {
              return appointmentAPI.getCurrentDate();
            },
            dataSolicitada: function($stateParams) {  
            console.log('$stateParameters: ', $stateParams);            
              if ($stateParams.year && $stateParams.month && $stateParams.day)
                return new Date($stateParams.year, $stateParams.month, $stateParams.day);
            },
            feriados: function(feriadoAPI) {
              return feriadoAPI.get();
            }
          }
        })
        .state('adjustsolicitation-gestor', {
          url: '/adjustsolicitation/gestor',
          templateUrl: 'app/pages/adjust_solicitation/gestor/_adjust_solicitation.html',
          controller: 'AdjustSolicitationGestorCtrl',
          title: 'Gerenciar Batidas de Funcionários',
          accessLevel: 3,
          resolve: {
            usuario: function(usersAPI, Auth){
                          
              var user = Auth.getCurrentUser();
              // console.log('## Usuário retornado: ##', user);
              return usersAPI.getUsuario(user._id);
            },
            currentDate: function(appointmentAPI) {
              return appointmentAPI.getCurrentDate();
            },
            feriados: function(feriadoAPI) {
              return feriadoAPI.get();
            },
            allEmployees: function(employeeAPI){
              return employeeAPI.get();
            }    
          }
        });
  }

})();
