/**
 * @author Gilliard Lopes
 * created on 04/03/2018
 */

angular.module('BlurAdmin.pages.feriados').service("municipiosAPI", function($http, config){

	var _urlBaseMunicipios = config.baseUrl + '/api/municipios';	
	var svc = this;	

	svc.get = function() {

		return $http.get(_urlBaseMunicipios);
	};

	svc.create = function (municipio) {

		return $http.post(_urlBaseMunicipios, municipio);
	};

	svc.delete = function (id) {

		return $http.delete(_urlBaseMunicipios + '/' + id);
	};

	svc.update = function (municipio) {

		return $http.put(_urlBaseMunicipios + '/' + municipio._id, municipio);
	};

	svc.getMunicipio = function(id) {

		return $http.get(_urlBaseMunicipios+'/'+id);
	};
});