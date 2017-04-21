/**
 * @author Gilliard Lopes
 * created on 12.04.2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin')
      .controller('ApplicationController', AppCtrl);

  /** @ngInject */
  function AppCtrl($scope, $rootScope, Auth) {

    console.log("Passa no APPLICATION controller!");
	$scope.logged = false;
	$scope.authorized = false;
	//$scope.auth = true; //TO COLOCANDO ASSIM PARA PODER FUNCIONAR COM O LAYOUT E TALS
	//TENHO QUE CORRIGIR ESSA QUESTÃO DE QUEM É PERMITIDO PARA USAR O QUẼ

	$scope.$on('login', function (_, token) {
	  	
		Auth.setToken(token);
		$rootScope.currentUser = Auth.getCurrentUser();//so testes
		console.log("Direto do APPCtrl: user logado: ", $rootScope.currentUser);
		$scope.logged = true;
		$scope.authorized = true;
		console.log("logou e autorizou, será q muda o include?");
	});

	$scope.$on('logout', function (_) {
	  	
		Auth.logout();
		$rootScope.currentUser = null;
		console.log("LOGOUT FROM APPCtrl");
		$scope.logged = false;
	});

	$scope.$on('authorized', function(_, isAuthorized) {

		$scope.authorized = (isAuthorized) ? true : false;

	});

	$scope.$on('logged', function(_, isLogged) {

		$scope.logged = (isLogged) ? true : false;
		
	});

  }

})();