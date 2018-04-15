/**
 * @author Gilliard Lopes
 * created on 22/04/2017
 */

angular.module('BlurAdmin.pages.teams').service("teamAPI", function($http, config){

	var _urlBaseEquipes = config.baseUrl + '/api/equipes';
	var svc = this;	

	svc.get = function () {
		
		return $http.get(_urlBaseEquipes);
	};

	svc.create = function (equipe) {

		return $http.post(_urlBaseEquipes, equipe);
	};

	svc.delete = function (id) {

		return $http.delete(_urlBaseEquipes+'/'+id);
	};

	svc.update = function (equipe) {

		return $http.put(_urlBaseEquipes + '/' + equipe._id, equipe);
	};

	svc.getEquipe = function(id) {

		return $http.get(_urlBaseEquipes+'/'+id);
	};

	svc.getFuncionariosByEquipe = function(id) {

		return $http.get(_urlBaseEquipes + '/' + id + '/funcionarios');
	};

	svc.getEquipesByGestor = function(gestor) {

		return $http.post(_urlBaseEquipes + '/gestorFilter', gestor);
	};

	svc.atualizarComponentes = function (id, componentes) {
		
		return $http.post(_urlBaseEquipes + '/' + id + '/updateWorkers', componentes);
	};

	svc.searchAndUpdateApps = function(id, componentes){

		return $http.post(_urlBaseEquipes + '/' + id + '/searchAndUpdateAppointments', componentes);
	};
});