/**
 * @author Gilliard Lopes
 * created on 18/05/2017
 */

angular.module('BlurAdmin.pages.points').service("pointsAPI", function($http, config){

	var _urlBasePoints = config.baseUrl + '/api/points';
	var svc = this;	

	// svc.get = function () {
		
	// 	return $http.get(_urlBasePoints);
	// };

	svc.getEspelhoPontoFuncionarios = function (objDate) {
		
		return $http.post(_urlBasePoints + '/', objDate);
	};

	svc.setApontamentosCorrecao = function (arrayApps) {
		
		return $http.post(_urlBasePoints + '/updateAppoints', arrayApps);
	};

	svc.setFeriasApontamentos = function(arrayApps) {

		return $http.post(_urlBasePoints + '/setFeriasAppoints', arrayApps);
	};

	svc.getEspelhoPontoEquipe = function (objEquipe) {

		return $http.post(_urlBasePoints + '/getAppointsByTeam', objEquipe);
	};

	svc.getEspelhoPontoAll = function (objEquipe) {

		return $http.post(_urlBasePoints + '/getAll', objEquipe);
	};

	// svc.update = function (solicitacao) {

	// 	return $http.put(_urlBasePoints + '/' + solicitacao._id, solicitacao);
	// };
	
	// svc.delete = function (id) {

	// 	return $http.delete(_urlBasePoints + '/' + id);
	// };

	// svc.getSolicitacao = function(id) {

	// 	return $http.get(_urlBasePoints+'/'+id);
	// };	
	
});