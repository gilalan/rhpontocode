/**
 * @author Gilliard Lopes
 * created on 19/02/2018
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.reports', ['ui.bootstrap'])
      .config(routeConfig);

  /** @ngInject */
  function routeConfig($stateProvider) {
    $stateProvider
        .state('reports', {
          url: '/reports',
          templateUrl: 'app/pages/reports/reports.html',
          controller: 'ReportsCtrl',
          vm: '$ctrl',
          title: 'Relatórios',
          sidebarMeta: {
             icon: 'ion-clock',
             order: 4,
          },
          access: 'fiscal',
          accessLevel: [2,3,4,5],
          resolve: {
            usuario: function(usersAPI, $stateParams, Auth){
              
              return usersAPI.getUsuario(Auth.getCurrentUser()._id);
            },
            feriados: function(feriadoAPI){
              
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
            
            // ,
            // currentDate: function(appointmentAPI) {
            //   return appointmentAPI.getCurrentDate();
            // },
            // feriados: function(feriadoAPI) {
            //   return feriadoAPI.get();
            // }
          }
        }); //alterar se for ter mais

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
