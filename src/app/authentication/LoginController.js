/**
 * @author Gilliard Lopes
 * created on 12.04.2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin')
      .controller('LoginController', LoginCtrl);

  /** @ngInject */
  function LoginCtrl($scope, $state, usersAPI) {

    console.log("dentro do LoginCtrl");

    $scope.login = function(user, baterPonto) {
      
      usersAPI.signIn(user).then(function sucessCallback(response){             
                    
        //baterPonto ? $state.go('regponto', {userId: response.data.idUsuario}) : $state.go('dashboard');
        $scope.$emit('login', response.data.token, baterPonto);
        console.log('depois volta para o success do login... segue o jogo!');

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
