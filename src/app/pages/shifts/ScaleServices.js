/**
 * @author Gilliard Lopes
 * created on 22/04/2017
 */

angular.module('BlurAdmin.pages.shifts').service("scaleAPI", function($http, config){

	var _urlBaseEscalas = config.baseUrl + '/api/escalas';	
	var svc = this;	

	svc.get = function() {

		return $http.get(_urlBaseEscalas);
	};

	svc.create = function (escala) {

		return $http.post(_urlBaseEscalas, escala);
	};

	svc.delete = function (id) {

		return $http.delete(_urlBaseEscalas + '/' + id);
	};

	svc.update = function (escala) {

		return $http.put(_urlBaseEscalas + '/' + escala._id, escala);
	};

	svc.getEscala = function(id) {

		return $http.get(_urlBaseEscalas+'/'+id);
	};
});