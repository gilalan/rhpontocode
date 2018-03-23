angular.module('BlurAdmin').service("usersAPI", function($http, config){

	//console.log('users service');
	var _urlBaseUsuarios = config.baseUrl + '/api/usuarios';
	var svc = this;	

	svc.getUsuario = function(idUsuario) {

		return $http.get(_urlBaseUsuarios + '/' + idUsuario);//, {
	      //headers: { 'X-Auth': token }
	    //});
	};

	svc.signIn = function (usuario) {
		
		//console.log(usuario);
		return $http.post(config.baseUrl + '/api/authenticate', usuario).then(function sucessCallback(response){
	      
			svc.token = response.data.token;
			//$http.defaults.headers.common['X-Auth'] = response.data;

			return response;
		});
	};

	svc.register = function (usuario) {
	
		return $http.post(_urlBaseUsuarios, usuario);
	};

	svc.unregister = function(funcionario) {

		return $http.post(_urlBaseUsuarios + '/unregister', funcionario);
	};

	svc.update = function (user) {
	
		return $http.put(_urlBaseUsuarios + '/' + user._id, user);
	};

	svc.recoveryPwd = function(funcionario) {

		return $http.post(config.baseUrl + '/api/recovery', funcionario);
	};
});