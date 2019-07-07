/**
 * @author Gilliard Lopes
 * created on 19/02/2018
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.points', ['ui.bootstrap'])
      .config(routeConfig);

  /** @ngInject */
  function routeConfig($stateProvider) {
    $stateProvider
      .state('points', {
        url: '/points',
        templateUrl: 'app/pages/point_management/points.html',
        controller: 'PointsCtrl',
        vm: '$ctrl',
        title: 'Tratamento do Ponto',
        sidebarMeta: {
           icon: 'ion-clipboard',
           order: 3,
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
