/**
 * @author Gilliard Lopes
 * created on 20/04/2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.employees', [])
    .config(routeConfig);

  /** @ngInject */
  function routeConfig($stateProvider) {
    $stateProvider
      .state('employees', {
        url: '/employees',
        redirectTo: 'employees.list',
        template: '<ui-view></ui-view>',
        title: 'Funcionários',
        sidebarMeta: {
          icon: 'ion-person',
          order: 30,
        },
      })
      .state('employees.list', {
        url: '/list',
        templateUrl: 'app/pages/employees/list/list.html',
        controller: 'EmployeeListCtrl',
        title: 'Funcionários',
        resolve: {
          funcionarios: function(employeeAPI){
            return employeeAPI.get();
          }
        },
        accessLevel: 3
      })
      .state('employees.new', {
        url: '/new',
        templateUrl: 'app/pages/employees/edit/edit.html',
        controller: 'NewEmployeeCtrl',
        title: 'Funcionários',
        resolve: {
          cargos: function(jobAPI) {
            return jobAPI.get();
          },
          turnos: function(shiftAPI){
            return shiftAPI.get();
          },
          instituicoes: function(institutionAPI){
            return institutionAPI.get();
          }
        },
        accessLevel: 3
      })
      .state('employees.edit', {
        url: '/edit/:id',
        templateUrl: 'app/pages/employees/edit/edit.html',
        controller: 'EditEmployeeCtrl',
        title: 'Funcionários',
        resolve: {
          funcionario: function(employeeAPI, $stateParams){
            return employeeAPI.getFuncionario($stateParams.id);
          }, 
          cargos: function(jobAPI) {
            return jobAPI.get();
          },
          turnos: function(shiftAPI){
            return shiftAPI.get();
          },
          instituicoes: function(institutionAPI){
            return institutionAPI.get();
          }
        },
        accessLevel: 3
      });
  }
})();
