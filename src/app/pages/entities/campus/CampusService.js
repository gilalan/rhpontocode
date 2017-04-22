/**
 * @author Gilliard Lopes
 * created on 22/04/2017
 */

angular.module('BlurAdmin.pages.entities.campus').service("campusAPI", function($http, config){

	var _urlBaseCampi = config.baseUrl + '/api/campi';
	var svc = this;	

	svc.get = function () {

		return $http.get(_urlBaseCampi);
	};

	svc.create = function (campus) {

		return $http.post(_urlBaseCampi, campus);
	};

	svc.delete = function (id) {

		return $http.delete(_urlBaseCampi+'/'+id);
	};

	svc.update = function (campus) {

		return $http.put(_urlBaseCampi + '/' + campus._id, campus);
	};

	svc.getCampus = function(id) {

		return $http.get(_urlBaseCampi+'/'+id);
	};

	svc.getSetoresByCampus = function(id) {

		return $http.get(_urlBaseCampi + '/' + id + "/setores")
	}
});