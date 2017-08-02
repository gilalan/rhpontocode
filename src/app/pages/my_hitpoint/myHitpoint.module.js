/**
 * @author Gilliard Lopes
 * created on 09/05/2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.myhitpoint', ['ui.bootstrap'])
      .config(routeConfig);

  /** @ngInject */
  function routeConfig($stateProvider) {
    $stateProvider
        .state('myhitpoint', {
          url: '/myhitpoint/:userId',
          templateUrl: 'app/pages/my_hitpoint/myhitpoint.html',
          controller: 'HitpointCtrl',
          title: 'Meu Ponto',
          sidebarMeta: {
             icon: 'ion-clock',
             order: 1,
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
            feriados: function(feriadoAPI) {
              return feriadoAPI.get();
            }
          }
        })
        .state('point_adjust', {
          url: '/point_adjust',
          templateUrl: 'app/pages/my_hitpoint/adjust/pointAdjust.html',
          controller: 'PointAdjustCtrl',
          title: 'Meu Ponto',
          params: {
            obj: null
          },
          // params: {
          //   obj: {
          //     arrayES: [{descricao: "Entrada 1", horario: "08:00"}, 
          //       {descricao: "Saída 1", horario: "12:00"}, 
          //       {descricao: "Entrada 2", horario: "14:00"}, 
          //       {descricao: "Saída 2", horario: "18:00"}
          //     ],
          //     dateWorker: {
          //       date: {
          //         raw: new Date("Wed May 03 2017 00:00:00 GMT-0300 (BRT)"),
          //         day: 3,
          //         month: 4,
          //         year: 2017,
          //         hour: 0,
          //         minute: 0,
          //         final: {
          //           raw: new Date("Thu May 04 2017 00:00:00 GMT-0300 (BRT)"),
          //           day: 4,
          //           month: 4,
          //           year: 2017,
          //           hour: 0,
          //           minute: 0
          //         }
          //       },
          //       funcionario: {
          //         PIS: "555111",
          //         nome: "Kleiton",
          //         sobrenome: "Macedo Silveira",
          //         _id: "58a4d39976532732e4bb7330"
          //       }
          //     }
          //   }
          // },
          resolve: {
            apontamento: function(appointmentAPI, $stateParams) {
 
              console.log('obj state params', $stateParams.obj);//só tem data inicial
              return appointmentAPI.getApontamentosByDateRangeAndFuncionario($stateParams.obj.dateWorker);
            },
            dataSolicitada: function($stateParams){
              return $stateParams.obj.dateWorker.date.raw;
            },
            funcionario: function($stateParams){
              return $stateParams.obj.dateWorker.funcionario;
            },
            arrayES: function($stateParams){
              return $stateParams.obj.arrayES;
            }
          },
          accessLevel: 1
        });
  }

})();
