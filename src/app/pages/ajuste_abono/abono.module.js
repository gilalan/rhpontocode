/**
 * @author Gilliard Lopes
 * created on 01/05/2019
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.abono', ['ui.bootstrap'])
      .config(routeConfig);

  /** @ngInject */
  function routeConfig($stateProvider) {
    $stateProvider
        .state('abono', {
          url: '/abono/:userId/:year/:month/:day',
          templateUrl: 'app/pages/ajuste_abono/abono.html',
          controller: 'AbonoSolicitationCtrl',
          title: 'Abonos',
          sidebarMeta: {
             icon: 'ion-asterisk',
             order: 3,
          },
          accessLevel: [1, 2, 3, 4, 6],
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
            eventosAbono: function(eventosAbonoAPI){
              return eventosAbonoAPI.get();
            },
            feriados: function(feriadoAPI) {
              return feriadoAPI.get();
            }
          }
        })
        .state('abono-gestor', {
          url: '/abono/gestor',
          templateUrl: 'app/pages/ajuste_abono/gestor/_abono.html',
          controller: 'AbonoSolicitationGestorCtrl',
          title: 'Gerenciar Abonos de Funcionários',
          accessLevel: [2,3,4,6],
          resolve: {
            usuario: function(usersAPI, Auth){
              var user = Auth.getCurrentUser();
              // console.log('## Usuário retornado: ##', user);
              return usersAPI.getUsuario(user._id);
            },
            currentDate: function(appointmentAPI) {
              return appointmentAPI.getCurrentDate();
            },
            eventosAbono: function(eventosAbonoAPI){
              return eventosAbonoAPI.get();
            },
            feriados: function(feriadoAPI) {
              return feriadoAPI.get();
            },
            // allEmployees: function(employeeAPI, Auth){
            //   var user = Auth.getCurrentUser();              
            //   if (user.acLvl >= 4)
            //     return employeeAPI.get();              
            // },
            allEquipes: function(teamAPI, Auth){

              var user = Auth.getCurrentUser();
              if (user.acLvl >= 4)
                return teamAPI.get();
            }    
          }
        })
        .state('abono-mgmt-gestor', {
          url: '/abono/mgmt/gestor',
          templateUrl: 'app/pages/ajuste_abono/gestor/_abonomgmt.html',
          controller: 'AbonoMgmtCtrl',
          title: 'Gerenciar Abonos de Funcionários',
          accessLevel: [2,3,4,6],
          resolve: {
            usuario: function(usersAPI, Auth){
              var user = Auth.getCurrentUser();
              // console.log('## Usuário retornado: ##', user);
              return usersAPI.getUsuario(user._id);
            },
            currentDate: function(appointmentAPI) {
              return appointmentAPI.getCurrentDate();
            },
            eventosAbono: function(eventosAbonoAPI){
              return eventosAbonoAPI.get();
            },
            feriados: function(feriadoAPI) {
              return feriadoAPI.get();
            },
            // allEmployees: function(employeeAPI, Auth){
            //   var user = Auth.getCurrentUser();              
            //   if (user.acLvl >= 4)
            //     return employeeAPI.get();              
            // },
            allEquipes: function(teamAPI, Auth){

              var user = Auth.getCurrentUser();
              if (user.acLvl >= 4)
                return teamAPI.get();
            }    
          }
        });
  }

})();
