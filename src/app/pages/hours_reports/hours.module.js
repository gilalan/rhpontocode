/**
 * @author Gilliard Lopes
 * created on 19/02/2018
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.hours', ['ui.bootstrap'])
      .config(routeConfig);

  /** @ngInject */
  function routeConfig($stateProvider) {
    $stateProvider
        .state('hours', {
          url: '/hours',
          templateUrl: 'app/pages/hours_reports/hours.html',
          controller: 'HoursCtrl',
          vm: '$ctrl',
          title: 'Banco de Horas',
          sidebarMeta: {
             icon: 'ion-clock',
             order: 4,
          },
          access: 'fiscal',
          accessLevel: [2,3,4,5,6],
          resolve: {
            usuario: function(usersAPI, $stateParams, Auth){
              
              return usersAPI.getUsuario(Auth.getCurrentUser()._id);
            },
            feriados: function(feriadoAPI){
              
              return feriadoAPI.get();
            },
            currentDate: function(appointmentAPI) {
              return appointmentAPI.getCurrentDate();
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
