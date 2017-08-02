/**
 * @author Gilliard Lopes
 * created on 26/04/2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.users')
      .controller('ChangePasswordCtrl', ChangePasswordCtrl);
      //.controller('ModalRegisterCtrl', ModalRegisterCtrl);

  /** @ngInject */
  function ChangePasswordCtrl($scope, $filter, $location, $state, $interval, $uibModal, usersAPI, Auth) {

    console.log('Entrou no ChangePasswordCtrl');
    var currentUser = Auth.getCurrentUser();
    $scope.updateAndGo = function(userForm) {

      console.log('User? ', userForm);
      if (userForm.novaSenha && userForm.novaSenha == userForm.confSenha){
        var userD = 
        {
          _id: currentUser._id,
          email: currentUser.email,
          role: currentUser.role,
          acLvl: currentUser.acLvl,
          senha: userForm.novaSenha,
          returnToken: true
        };
        
        usersAPI.update(userD).then(function successCallback(response){
          
          //$scope.successMsg = response.data.message;  
          console.log("resposta da atualizacao: ", response.data);
          //usersAPI.signIn(user).then(function sucessCallback(response){             
                    
            //baterPonto ? $state.go('regponto', {userId: response.data.idUsuario}) : $state.go('dashboard');
            //console.log('response.data? ', response.data);
          $scope.$emit('login', response.data.token, response.data.firstAccess, false);
            //console.log('depois volta para o success do login... segue o jogo!');

          //}, function errorCallback (response) {
            
            //console.log('error login: ', response.data.message);
            //$scope.errorMsg = response.data.message;
          //});

        }, function errorCallback(response) {

          $scope.errorMsg = response.data.message;
          console.log('Erro na atualização da senha: ' + response.data.message);
        });

      } else {

        $scope.errorMsg = "Senha e Confirmação devem ser iguais!";
      }      
    };    

    function init() {
      
      console.log('currentUser: ', currentUser);
    }

    //INICIALIZA O CONTROLLER COM ALGUMAS VARIÁVEIS
    init();
    
  }

})();
