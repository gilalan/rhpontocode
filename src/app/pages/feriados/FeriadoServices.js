/**
 * @author Gilliard Lopes
 * created on 22/04/2017
 */

angular.module('BlurAdmin.pages.feriados').service("feriadoAPI", function($http, config){

	var _urlBaseFeriados = config.baseUrl + '/api/feriados';	
	var svc = this;	

	svc.get = function() {

		return $http.get(_urlBaseFeriados);
	};

	svc.create = function (feriado) {

		return $http.post(_urlBaseFeriados, feriado);
	};

	svc.delete = function (id) {

		return $http.delete(_urlBaseFeriados + '/' + id);
	};

	svc.update = function (feriado) {

		return $http.put(_urlBaseFeriados + '/' + feriado._id, feriado);
	};

	svc.getFeriado = function(id) {

		return $http.get(_urlBaseFeriados+'/'+id);
	};
});