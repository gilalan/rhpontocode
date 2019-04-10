/**
 * @author Gilliard Lopes
 * created on 26/04/2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.abono', ['ui.bootstrap'])
      .config(routeConfig);

  /** @ngInject */
  function routeConfig($stateProvider) {
    $stateProvider
        .state('abono', {
          url: '/ajusteabono/:userId',
          templateUrl: 'app/pages/ajuste_abono/abono.html',
          controller: 'AbonoCtrl',
          title: 'Ajustes de Abonos',
          sidebarMeta: {
             icon: 'ion-paper',
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
            // dataSolicitada: function($stateParams) {  
            // console.log('$stateParameters: ', $stateParams);            
            //   if ($stateParams.year && $stateParams.month && $stateParams.day)
            //     return new Date($stateParams.year, $stateParams.month, $stateParams.day);
            // },
            feriados: function(feriadoAPI) {
              return feriadoAPI.get();
            }
          }
        })
        .state('abono-gestor', {
          url: '/abono/gestor',
          templateUrl: 'app/pages/ajuste_abono/gestor/_abono.html',
          controller: 'AbonoGestorCtrl',
          title: 'Gerenciar Abonos de Funcionários',
          accessLevel: [2, 3, 4, 6],
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
            allEmployees: function(employeeAPI, Auth){
              var user = Auth.getCurrentUser();              
              if (user.acLvl >= 4)
                return employeeAPI.get();              
            },
            allEquipes: function(teamAPI, Auth){

              var user = Auth.getCurrentUser();
              if (user.acLvl >= 4)
                return teamAPI.get();
            }    
          }
        });
  }

})();
