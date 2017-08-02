/**
 * @author Gilliard Lopes
 * created on 01/05/2017
 */
angular.module('BlurAdmin.pages').service("roleAPI", function($http, config){

	var _urlBasePerfis = config.baseUrl + '/api/perfis';	
	var svc = this;	

	svc.get = function() {

		return $http.get(_urlBasePerfis);
	};

	svc.create = function (perfil) {

		return $http.post(_urlBasePerfis, perfil);
	};

	svc.delete = function (id) {

		return $http.delete(_urlBasePerfis + '/' + id);
	};

	svc.update = function (perfil) {

		return $http.put(_urlBasePerfis + '/' + perfil._id, perfil);
	};

	svc.getPerfil = function(id) {

		return $http.get(_urlBasePerfis+'/'+id);
	};

	svc.getPerfisByLevel = function(level){

		return $http.get(_urlBasePerfis+'/'+level+'/level');
	};
});