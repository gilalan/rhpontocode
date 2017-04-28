/**
 * @author Gilliard Lopes
 * created on 12.04.2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin')
      .controller('LoginController', LoginCtrl);

  /** @ngInject */
  function LoginCtrl($scope, $filter, $location, $state, usersAPI) {

    console.log("dentro do LoginCtrl");
    $scope.teste = 10;

    $scope.login = function(user, baterPonto) {
      
      usersAPI.signIn(user).then(function sucessCallback(response){             
            
        console.log('Auth.setToken', response.data.token);
        //window.location.href = "/main.html";
        //return getUsuario(response.data.idUsuario);
        //return redirectHome();
        $scope.$emit('login', response.data.token);
        //var pathTo = "/dashboard";        
        //$location.path(pathTo);

        baterPonto ? $state.go('regponto', {userId: response.data.idUsuario}) : $state.go('dashboard');

      }, function errorCallback (response) {
        
        console.log('error login: ', response.data.message);
        $scope.errorMsg = response.data.message;
      });
    };

    $scope.logout = function() {
    
      $scope.$emit('logout');
      //$state.go("");
    }

  }

})();
