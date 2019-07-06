/**
 * @author Gilliard Lopes
 * created on 22/04/2019
 */

angular.module('BlurAdmin.pages.motivosajuste').service("motivosAjusteAPI", function($http, config){

	var _urlBaseMotivosAjuste = config.baseUrl + '/api/motivosajuste';	
	var svc = this;	

	svc.get = function() {

		return $http.get(_urlBaseMotivosAjuste);
	};

	svc.create = function (motivoAjuste) {

		return $http.post(_urlBaseMotivosAjuste, motivoAjuste);
	};

	svc.delete = function (id) {

		return $http.delete(_urlBaseMotivosAjuste + '/' + id);
	};

	svc.update = function (motivoAjuste) {

		return $http.put(_urlBaseMotivosAjuste + '/' + motivoAjuste._id, motivoAjuste);
	};

	svc.getMotivoAjuste = function(id) {

		return $http.get(_urlBaseMotivosAjuste+'/'+id);
	};
});