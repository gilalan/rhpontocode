/**
 * @author Gilliard Lopes
 * created on 22/04/2019
 */

angular.module('BlurAdmin.pages.eventosabono').service("eventosAbonoAPI", function($http, config){

	var _urlBaseEventosAbono = config.baseUrl + '/api/eventosabono';	
	var svc = this;	

	svc.get = function() {

		return $http.get(_urlBaseEventosAbono);
	};

	svc.create = function (eventoAbono) {

		return $http.post(_urlBaseEventosAbono, eventoAbono);
	};

	svc.delete = function (id) {

		return $http.delete(_urlBaseEventosAbono + '/' + id);
	};

	svc.update = function (eventoAbono) {

		return $http.put(_urlBaseEventosAbono + '/' + eventoAbono._id, eventoAbono);
	};

	svc.getEventoAbono = function(id) {

		return $http.get(_urlBaseEventosAbono+'/'+id);
	};
});