/**
 * @author Gilliard Lopes
 * created on 18/05/2017
 */

angular.module('BlurAdmin.pages.hours').service("hoursAPI", function($http, config){

	var _urlBaseHours = config.baseUrl + '/api/hours';
	var svc = this;	

	// svc.get = function () {
		
	// 	return $http.get(_urlBaseHours);
	// };

	svc.getEspelhoPontoFuncionarios = function (objDate) {
		
		return $http.post(_urlBaseHours + '/', objDate);
	};

	svc.setApontamentosCorrecao = function (arrayApps) {
		
		return $http.post(_urlBaseHours + '/updateAppoints', arrayApps);
	};

	svc.setFeriasApontamentos = function(arrayApps) {

		return $http.post(_urlBaseHours + '/setFeriasAppoints', arrayApps);
	};

	svc.getEspelhoPontoEquipe = function (objEquipe) {

		return $http.post(_urlBaseHours + '/getAppointsByTeam', objEquipe);
	};

	svc.getEspelhoPontoAll = function (objEquipe) {

		return $http.post(_urlBaseHours + '/getAll', objEquipe);
	};	
	
});