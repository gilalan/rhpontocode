/**
 * @author Gilliard Lopes
 * created on 20/04/2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.entities.institutions', [])
    .config(routeConfig);

  /** @ngInject */
  function routeConfig($stateProvider, $urlRouterProvider) {
    $stateProvider
        .state('entities.institutions', {
          url: '/institutions',
          abstract: true,
          templateUrl: 'app/pages/entities/institutions/institutions.html',
          controller: 'InstitutionCtrl',
          title: 'Instituições',
          sidebarMeta: {
            order: 0,
          },
          accessLevel: [4,5]
        })
        .state('entities.institutions.list', {
          url: '/list',
          templateUrl: 'app/pages/entities/institutions/list/list.html',
          controller: 'InstitutionListCtrl',
          title: 'Instituições',
          resolve: {
            instituicoes: function(institutionAPI){
              return institutionAPI.get();
            }
          },
          accessLevel: 4
        })
        .state('entities.institutions.new', {
          url: '/new',
          templateUrl: 'app/pages/entities/institutions/edit/edit.html',
          controller: 'NewInstitutionCtrl',
          title: 'Instituições',
          accessLevel: 4
        })
        .state('entities.institutions.edit', {
          url: '/edit/:id',
          templateUrl: 'app/pages/entities/institutions/edit/edit.html',
          controller: 'EditInstitutionCtrl',
          title: 'Instituições',
          resolve: {
            instituicao: function(institutionAPI, $stateParams){
              return institutionAPI.getInstituicao($stateParams.id);
            }
          },
          accessLevel: 4
        });

        $urlRouterProvider.when('/entities/institutions','/entities/institutions/list');
  }
})();