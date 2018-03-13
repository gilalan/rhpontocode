/**
 * @author Gilliard Lopes
 * created on 04/03/2018
 */

angular.module('BlurAdmin.pages.feriados').service("estadosAPI", function($http, config){

	var _urlBaseEstados = config.baseUrl + '/api/estados';	
	var svc = this;	

	svc.get = function() {

		return $http.get(_urlBaseEstados);
	};

	svc.create = function (estado) {

		return $http.post(_urlBaseEstados, estado);
	};

	svc.delete = function (id) {

		return $http.delete(_urlBaseEstados + '/' + id);
	};

	svc.update = function (estado) {

		return $http.put(_urlBaseEstados + '/' + estado._id, estado);
	};

	svc.getEstado = function(id) {

		return $http.get(_urlBaseEstados+'/'+id);
	};
});