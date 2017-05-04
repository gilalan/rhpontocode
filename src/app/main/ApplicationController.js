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

    console.log("Passa no APPLICATION controller!");
	$scope.logged = false;
	$scope.authorized = false;
	//$scope.auth = true; //TO COLOCANDO ASSIM PARA PODER FUNCIONAR COM O LAYOUT E TALS
	//TENHO QUE CORRIGIR ESSA QUESTÃO DE QUEM É PERMITIDO PARA USAR O QUẼ

	$scope.$on('login', function (_, token, baterPonto) {
	  	
		Auth.setToken(token);
		var currentUser = Auth.getCurrentUser();//so testes
		console.log("Direto do APPCtrl: user logado: ", currentUser);
		$scope.logged = true;
		$scope.authorized = true;
		if (baterPonto)
			$state.go('regponto', {userId: currentUser._id}) 
		else
			init(currentUser);
	});

	$scope.$on('logout', function (_) {
	  	
		Auth.logout();
		//$rootScope.currentUser = null;
		console.log("LOGOUT FROM APPCtrl");
		$scope.logged = false;
		$window.location.href = "/index.html";
	});

	$scope.$on('authorized', function(_, isAuthorized) {

		$scope.authorized = (isAuthorized) ? true : false;

	});

	$scope.$on('logged', function(_, isLogged) {

		$scope.logged = (isLogged) ? true : false;
		
	});

	function redirectState(user){

		if (user.acLvl > 0) {
			$scope.authorized = true;
			console.log('autorizado, nivel de acesso: ', user.acLvl);
		  	if (user.acLvl == 1)
	        	$state.go('regponto'); //alterar o caminho da primeira página de acordo com o nível de acesso
	      	else if (user.acLvl == 2) 
	        	$state.go('regponto'); //se passar com o param userId ele vai bater o ponto diretamente...
	      	else if (user.acLvl >= 3)
	        	$state.go('dashboard');
		}
	};

	function init(user) {
		
		console.log('inicializar o APP controller');
		
		if (user) {

			redirectState(user);

		} else {

			if (Auth.getToken()){
				console.log('APPCtrl - já está logado');
				$scope.logged = true;
				var currentUser = Auth.getCurrentUser();
				redirectState(currentUser);
			}
		}
	};

	init();
  }

})();