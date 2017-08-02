/**
 * @author Gilliard Lopes
 * created on 11/07/2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.users', ['ui.bootstrap'])
      .config(routeConfig);

  /** @ngInject */
  function routeConfig($stateProvider) {
    $stateProvider
        .state('users', {
          url: '/users/:userId',
          controller: 'ChangePasswordCtrl',
          template: '',
          //templateUrl: 'app/pages/users/changePassword.html',
          //title: 'Alteração de Senha',
          accessLevel: 1,
          resolve: {
            usuario: function(usersAPI, $stateParams, Auth){
                          
              if ($stateParams.userId)
                return usersAPI.getUsuario($stateParams.userId); 
              else                
                return "Erro ao obter usuário";

            }
          }
        });
  }

})();
