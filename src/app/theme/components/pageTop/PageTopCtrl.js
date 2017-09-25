/**
 * @author Gilliard Lopes
 * created on 02/08/2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.theme.components')
      .controller('PageTopCtrl', PageTopCtrl);

  /** @ngInject */
  function PageTopCtrl($scope, $sce) {
      
    $scope.logout = function() {
    
      $scope.$emit('logout');
      //$state.go("");
    };

    $scope.mainPage = function() {
      
      $scope.$emit('redirectHome');
    };
  }
})();