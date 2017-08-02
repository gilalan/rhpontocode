/**
 * @author v.lugovsky
 * created on 16.12.2015
 * modified on 24/07/2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.profile', ['ngMessages'])
      .config(routeConfig);

  /** @ngInject */
  function routeConfig($stateProvider) {
    $stateProvider
        .state('profile', {
          url: '/profile',
          title: 'Perfil',
          templateUrl: 'app/pages/profile/profile.html',
          controller: 'ProfilePageCtrl',
          accessLevel: 1,
          resolve: {
            user: function(usersAPI, Auth){
              var user = Auth.getCurrentUser();
              console.log('## Usuário retornado: ##', user)
              return usersAPI.getUsuario(user._id);
            },
            instituicoes: function(institutionAPI){
              return institutionAPI.get();
            }
          }
        });
  }

})();
