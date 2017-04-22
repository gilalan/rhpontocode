/**
 * @author Gilliard Lopes
 * created on 22/04/2017
 */

angular.module('BlurAdmin.pages.entities.sectors').service("sectorAPI", function($http, config){

	var _urlBaseSetores = config.baseUrl + '/api/setores';
	var svc = this;	

	svc.get = function () {
		
		return $http.get(_urlBaseSetores);
	};

	svc.create = function (setor) {
		
		return $http.post(_urlBaseSetores, setor);
	};

	svc.delete = function (id) {

		return $http.delete(_urlBaseSetores + '/' + id);
	};

	svc.update = function (setor) {

		return $http.put(_urlBaseSetores + '/' + setor._id, setor);
	};

	svc.getSetor = function(id) {

		return $http.get(_urlBaseSetores+'/'+id);
	};

	svc.getEquipesBySetor = function(id) {

		return $http.get(_urlBaseSetores+'/'+id+'/equipes');
	};
});