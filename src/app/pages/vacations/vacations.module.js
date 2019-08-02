/**
 * @author Gilliard Lopes
 * created on 06/07/2019
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.vacations', ['ui.bootstrap'])
      .config(routeConfig);

  /** @ngInject */
  function routeConfig($stateProvider) {
    $stateProvider
      .state('vacations', {
        url: '/vacations',
        templateUrl: 'app/pages/vacations/vacations.html',
        controller: 'VacationsCtrl',
        title: 'Gerenciamento de Férias',
        sidebarMeta: {
           icon: 'ion-thumbsup',
           order: 81,
        },
        accessLevel: [3,4,5,6],
        resolve: {
          usuario: function(usersAPI, $stateParams, Auth){
            
            return usersAPI.getUsuario(Auth.getCurrentUser()._id);
          },
          feriados: function(feriadoAPI){
            
            return feriadoAPI.get();
          },
          motivosAjuste: function(motivosAjusteAPI){

            return motivosAjusteAPI.get();
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
