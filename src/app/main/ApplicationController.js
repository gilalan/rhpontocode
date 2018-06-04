
/**
 * @author Gilliard Lopes
 * created on 12.04.2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin')
      .controller('ApplicationController', AppCtrl);

  /** @ngInject */
  function AppCtrl($scope, $window, $state, Auth) {

    //console.log("#################Passa no APPLICATION controller!");
	$scope.logged = false;
	$scope.authorized = false;
	$scope.resetForgotPass = false;
	$scope.recoveryPass = false;
	//TENHO QUE CORRIGIR ESSA QUESTÃO DE QUEM É PERMITIDO PARA USAR O QUẼ

	$scope.$on('login', function (_, token, firstAccess, baterPonto) {
		
		Auth.setToken(token);
		var currentUser = Auth.getCurrentUser();
		
		if (firstAccess) {

			//console.log('Entrou no firstAccess! dentro de ApplicationController');
			$scope.recoveryPass = false;
			$scope.resetForgotPass = true;
			//console.log("isLogged: ", $scope.logged);
			//console.log("isAuthorized: ", $scope.authorized);
			//console.log("resetForgotPass: ", $scope.resetForgotPass);
			//console.log("recoveryPass: ", $scope.recoveryPass);
			//$state.go('users', {userId: currentUser._id});
			//$window.location.href = "/resetForgotPass.html";
		}
		else {

			// Auth.setToken(token);
			// var currentUser = Auth.getCurrentUser();//so testes
			//console.log("Direto do APPCtrl: user logado: ", currentUser);
			$scope.resetForgotPass = false;
			$scope.recoveryPass = false;
			$scope.logged = true;
			$scope.authorized = true;
			if (baterPonto)
				$state.go('regponto', {userId: currentUser._id}); 
			else
				init(currentUser);
		}
	});

	$scope.$on('logout', function (_) {
	  	
		Auth.logout();
		//$rootScope.currentUser = null;
		//console.log("LOGOUT FROM APPCtrl");
		$scope.logged = false;
		$window.location.href = "/index.html";
	});

	//Emite evento para atualizar as variáveis

	$scope.$on('pwdExpired', function(_, isExpired) {
		//console.log("pwdExpired: ", isExpired);
		//console.log("recoveryPass: ", $scope.recoveryPass);
		//console.log("isAuthorized: ", $scope.authorized);
		//console.log("isLogged: ", $scope.logged);
		$scope.resetForgotPass = isExpired;
	});

	$scope.$on('authorized', function(_, isAuthorized) {

		$scope.authorized = (isAuthorized) ? true : false;
	});

	$scope.$on('logged', function(_, isLogged) {

		$scope.logged = (isLogged) ? true : false;
	});

	$scope.$on('recovery', function(_, isRecovery) {

		$scope.logged = false;
		$scope.authorized = false;
		$scope.resetForgotPass = false;
		$scope.recoveryPass = isRecovery;
	});

	$scope.$on('redirectHome', function(_, user){

		var userC = user ? user : Auth.getCurrentUser();
		redirectState(userC);
	});

	function redirectState(user){

		if (user.acLvl > 0) {
			$scope.authorized = true;
			//console.log('autorizado, nivel de acesso: ', user.acLvl);
		  	if (user.acLvl == 1)
	        	$state.go('regponto'); //alterar o caminho da primeira página de acordo com o nível de acesso
	      	else if (user.acLvl == 2) 
	        	$state.go('reports'); //se passar com o param userId ele vai bater o ponto diretamente...
	      	else if (user.acLvl == 3)
	        	$state.go('dashboard');
	        else if (user.acLvl == 4) //Gestor da SOLL
	        	$state.go('reports');
	        else if (user.acLvl == 5) //Gestor da Univasf
	        	$state.go('dashboard')
	        else if (user.acLvl == 6) //ADMIN 
	        	$state.go('reports');
		}

		//console.log('#redirectState!');
		//console.log("resetForgotPass: ", $scope.resetForgotPass);
		//console.log("recoveryPass: ", $scope.recoveryPass);
		//console.log("isAuthorized: ", $scope.authorized);
		//console.log("isLogged: ", $scope.logged);
	};

	function init(user) {
		
		//quando já tem o token registrado mas é o firstAccess fica dando pau!
		//console.log('inicializar o APP controller');
		//console.log("resetForgotPass: ", $scope.resetForgotPass);
		//console.log("recoveryPass: ", $scope.recoveryPass);
		//console.log("isAuthorized: ", $scope.authorized);
		//console.log("isLogged: ", $scope.logged);	

		if (user) {

			redirectState(user);

		} else {

			if (Auth.getToken()){
				//console.log('APPCtrl - já está logado');
				$scope.logged = true;
				var currentUser = Auth.getCurrentUser();
				redirectState(currentUser);
			}
		}
	};

	init();
  }

})();