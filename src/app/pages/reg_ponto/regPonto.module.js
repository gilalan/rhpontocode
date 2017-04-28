/**
 * @author Gilliard Lopes
 * created on 26/04/2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.regponto', ['ui.bootstrap'])
      .config(routeConfig);

  /** @ngInject */
  function routeConfig($stateProvider) {
    $stateProvider
        .state('regponto', {
          url: '/regponto/:userId',
          templateUrl: 'app/pages/reg_ponto/regPonto.html',
          controller: 'RegPontoCtrl',
          title: 'Registro de Ponto',
          sidebarMeta: {
             icon: 'ion-thumbsup',
             order: 70,
          },
          accessLevel: 1,
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
            currentDate: function(appointmentAPI) {
              return appointmentAPI.getCurrentDate();
            },
            batidaDireta: function($stateParams) {
              return ($stateParams.userId) ? true : false;
            }
          }
        });
  }

})();
