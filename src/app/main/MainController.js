/**
 * @author Gilliard Lopes
 * created on 12.04.2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin')
      .controller('MainController', MainCtrl);

  /** @ngInject */
  function MainCtrl($scope, $filter, $location, Auth) {

    console.log("dentro do MainCtrl");
    $scope.teste = 10;
    console.log("auth ", Auth);
    console.log("auth.getToken: ", Auth.getToken());
  }

})();
