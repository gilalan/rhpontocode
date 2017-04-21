angular.module('BlurAdmin.pages.entities.institutions').service("institutionAPI", function($http, config){

	var _urlBaseInstituicoes = config.baseUrl + '/api/instituicoes';
	var svc = this;	

	svc.get = function () {
		return $http.get(_urlBaseInstituicoes);
	};

	svc.getInstituicao = function(idInstituicao) {

		return $http.get(_urlBaseInstituicoes+'/'+idInstituicao);//, {
	      //headers: { 'X-Auth': token }
	    //});
	};

	svc.create = function (instituicao) {

		console.log("instituicao capturada do form: ", instituicao);
		return $http.post(_urlBaseInstituicoes, instituicao);
	};

	svc.delete = function (id) {

		return $http.delete(_urlBaseInstituicoes+'/'+id);
	};

	svc.update = function (instituicao) {

		return $http.put(_urlBaseInstituicoes + '/' + instituicao._id, instituicao);
	};

	svc.getCampiByInstituicao = function(id) {

		return $http.get(_urlBaseInstituicoes+'/'+id+'/campi')
	}

});