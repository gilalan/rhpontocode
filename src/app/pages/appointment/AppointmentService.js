/**
 * @author Gilliard Lopes
 * created on 26/04/2017
 */
angular.module('BlurAdmin.pages').service("appointmentAPI", function($http, config){

	var _urlBaseApontamentos = config.baseUrl + '/api/apontamentos';	
	var svc = this;	

	svc.get = function() {

		return $http.get(_urlBaseApontamentos);
	};

	svc.create = function (apontamento) {

		return $http.post(_urlBaseApontamentos, apontamento);
	};

	svc.delete = function (id) {

		return $http.delete(_urlBaseApontamentos + '/' + id);
	};

	svc.update = function (id, apontamento) {

		return $http.put(_urlBaseApontamentos + '/' + id, apontamento);
	};

	svc.getApontamento = function(id) {

		return $http.get(_urlBaseApontamentos+'/'+id);
	};

	svc.getAllByFunc = function(funcionario){

		return $http.post(_urlBaseApontamentos+'/allbyemployee', funcionario);
	};

	svc.getApontamentosByDate = function(date) {

		return $http.post(_urlBaseApontamentos+'/date', date);
	};

	svc.getApontamentosByDateAndEquipe = function(objDateEquipe) {

		return $http.post(_urlBaseApontamentos+'/date/equipe', objDateEquipe);
	};

	svc.getApontamentosByDateRangeAndEquipe = function(objDateEquipe) {

		return $http.post(_urlBaseApontamentos+'/intervaldate/equipe', objDateEquipe);
	};

	svc.getApontamentosByDateRangeAndFuncionario = function(objDateWorker) {

		return $http.post(_urlBaseApontamentos+'/intervaldate/funcionario', objDateWorker);
	};

	svc.getCurrentDate = function(){
		return $http.post(_urlBaseApontamentos+'/currentDate', {});
	};

	svc.getEquipesEstatistica = function(ObjArrayEquipes) {

		return $http.post(_urlBaseApontamentos+'/allequipes/estatisticas', ObjArrayEquipes);
	};

	svc.getAllRawAppoints = function(){

		return $http.post(_urlBaseApontamentos+'/allRepAppoints', {});
	};

	svc.createAndUpdateMany = function(arrayApontamentos){
		return $http.post(_urlBaseApontamentos+'/createupdatemany', arrayApontamentos);
	};
	
});