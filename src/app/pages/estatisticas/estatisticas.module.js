/**
 * @author Gilliard Lopes
 * created on 26/04/2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.estatisticas', ['ui.bootstrap'])
      .config(routeConfig);

  /** @ngInject */
  function routeConfig($stateProvider) {
    $stateProvider
        .state('estatisticas', {
          url: '/estatisticas',
          templateUrl: 'app/pages/estatisticas/estatisticas.html',
          controller: 'EstatisticasCtrl',
          title: 'Estatísticas do Sistema',
          sidebarMeta: {
             icon: 'ion-thumbsup',
             order: 61,
          },
          accessLevel: [6],
          resolve: {
            usuario: function(usersAPI, $stateParams, Auth){
                          
              if ($stateParams.userId)  
                return usersAPI.getUsuario($stateParams.userId); 
              else {
                var user = Auth.getCurrentUser();
                console.log('## Usuário retornado: ##', user)
                return usersAPI.getUsuario(user._id);
              }              
            },
            allEmployees: function(employeeAPI, Auth){
                          
              return employeeAPI.getOnlyFuncionarios();
              //return [];
            },
            equipes: function(teamAPI) {
              return teamAPI.get(); //ARRAY VAZIO PARA AGILIZAR OS OUTROS TESTES
              //return [];
            }
            // ,

            // rawAppoints: function(appointmentAPI) {
            //   return appointmentAPI.getAllRawAppoints();
            // }
            
          //   currentDate: function(appointmentAPI) {
          //     return appointmentAPI.getCurrentDate();
          //   },
          //   feriados: function(feriadoAPI) {
          //     return feriadoAPI.get();
          //   },
          //   batidaDireta: function($stateParams) {
          //     return ($stateParams.userId) ? true : false;
          //   }
          }
        });
  }

})();
