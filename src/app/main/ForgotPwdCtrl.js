/**
 * @author Gilliard Lopes
 * created on 12.04.2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin')
      .controller('ForgotPwdCtrl', ForgotPwdCtrl);

  /** @ngInject */
  function ForgotPwdCtrl($scope, $filter, $location, usersAPI, Auth) {

    // console.log("dentro do ForgotPwdCtrl");
    $scope.teste = 10;
    // console.log("auth ", Auth);
    // console.log("auth.getToken: ", Auth.getToken());

    $scope.recovery = function(userForm) {

      // console.log("user passado: ", userForm);
      var userD = {
        email: userForm.email,
        cpf: userForm.cpf,
        pis: userForm.pis,
        dataNascimento: userForm.dataNascimento
      };

      usersAPI.recoveryPwd(userD).then(function successCallback(response){

        // console.log('Funcionário recuperado com sucesso: ', response.data);
        $scope.$emit('login', response.data.token, response.data.firstAccess, false);
        //Auth.setToken(response.data.token);
        //$scope.$emit('recovery', false);
        //$scope.$emit('pwdExpired', true);

      }, function errorCallback(response){

        // console.log('erro de recuperação de senha: ', response.data.message);
        $scope.errorMsg = response.data.message;
      });

    };
  }

})();
