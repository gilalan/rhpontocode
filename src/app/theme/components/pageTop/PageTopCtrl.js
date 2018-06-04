/**
 * @author Gilliard Lopes
 * created on 02/08/2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.theme.components')
      .controller('PageTopCtrl', PageTopCtrl);

  /** @ngInject */
  function PageTopCtrl($scope, $sce, Auth) {
      
    var user = Auth.getCurrentUser();
    $scope.infoUser = {};

    init();

    $scope.logout = function() {
    
      $scope.$emit('logout');
      //$state.go("");
    };

    $scope.mainPage = function() {
      
      $scope.$emit('redirectHome');
    };

    function init() {
      
      if (user.acLvl == 6) { //ADMIN
        $scope.infoUser = {
          text: "Perfil de Administrador (" + user.email + ")"
        };
      } else if (user.acLvl == 5) { //Gestor Univasf
        $scope.infoUser = {
          text: "Perfil de Gestor Univasf (" + user.email + ")"
        };
      } else if (user.acLvl == 4) { //Gestor Geral
        $scope.infoUser = {
          text: "Perfil de Gestor Geral (" + user.email + ")",
          login: user.email
        };
      } else  { //demais
        $scope.infoUser = {
          text: user.role + " (" + user.email + ")",
          login: user.email
        };
      }

    };

  }
})();