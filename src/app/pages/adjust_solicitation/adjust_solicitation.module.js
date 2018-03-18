/**
 * @author Gilliard Lopes
 * created on 09/05/2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.adjustsolicitation', ['ui.bootstrap'])
      .config(routeConfig);

  /** @ngInject */
  function routeConfig($stateProvider) {
    $stateProvider
        .state('adjustsolicitation', {
          url: '/adjustsolicitation/:userId/:year/:month/:day',
          templateUrl: 'app/pages/adjust_solicitation/adjust_solicitation.html',
          controller: 'AdjustSolicitationCtrl',
          title: 'Solicitação de Ajuste',
          sidebarMeta: {
             icon: 'ion-clipboard',
             order: 3,
          },
          accessLevel: 1,
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
            feriados: function(feriadoAPI) {
              return feriadoAPI.get();
            }
          }
        });
        // .state('point_adjust', {
        //   url: '/point_adjust',
        //   templateUrl: 'app/pages/my_hitpoint/adjust/pointAdjust.html',
        //   controller: 'PointAdjustCtrl',
        //   title: 'Meu Ponto',
        //   params: {
        //     obj: null
        //   },
        //   resolve: {
        //     apontamento: function(appointmentAPI, $stateParams) {
 
        //       console.log('obj state params', $stateParams.obj);//só tem data inicial
        //       return appointmentAPI.getApontamentosByDateRangeAndFuncionario($stateParams.obj.dateWorker);
        //     },
        //     dataSolicitada: function($stateParams){
        //       return $stateParams.obj.dateWorker.date.raw;
        //     },
        //     funcionario: function($stateParams){
        //       return $stateParams.obj.dateWorker.funcionario;
        //     },
        //     arrayES: function($stateParams){
        //       return $stateParams.obj.arrayES;
        //     }
        //   },
        //   accessLevel: 1
        // });
  }

})();
