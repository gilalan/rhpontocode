/**
 * @author Gilliard Lopes
 * created on 06/07/2019
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.testes', ['ui.bootstrap'])
      .config(routeConfig);

  /** @ngInject */
  function routeConfig($stateProvider) {
    $stateProvider
        .state('testes', {
          url: '/testes',
          templateUrl: 'app/pages/testes/testes.html',
          controller: 'TestesCtrl',
          title: 'Testes do Sistema',
          sidebarMeta: {
             icon: 'ion-thumbsup',
             order: 81,
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
            solicitacaoAjustes: function(myhitpointAPI){
              return myhitpointAPI.get();
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
