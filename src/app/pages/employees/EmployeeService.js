/**
 * @author Gilliard Lopes
 * created on 22/04/2017
 */

angular.module('BlurAdmin.pages.employees').service("employeeAPI", function($http, config){

	var _urlBaseFuncionarios = config.baseUrl + '/api/funcionarios';
	var _urlBaseGestores = config.baseUrl + '/api/gestores';
	var svc = this;	

	svc.get = function () {
		
		return $http.get(_urlBaseFuncionarios);
	};

	svc.create = function (funcionario) {
		
		return $http.post(_urlBaseFuncionarios, funcionario);
	};

	svc.update = function (funcionario) {

		return $http.put(_urlBaseFuncionarios + '/' + funcionario._id, funcionario);
	};
	
	svc.delete = function (id) {

		return $http.delete(_urlBaseFuncionarios + '/' + id);
	};

	svc.getActives = function() {

		return $http.post(_urlBaseFuncionarios+'/actives');
	};

	svc.getFuncionario = function(id) {

		return $http.get(_urlBaseFuncionarios+'/'+id);
	};

	svc.getUsuarioByFuncionario = function(id) {

		return $http.get(_urlBaseFuncionarios+'/'+id+'/usuario');
	};

	svc.getPeriodoApontamentoByFuncionario = function(id, rangeDate) {

		return $http.post(_urlBaseFuncionarios+'/'+id+'/apontamentoRange', rangeDate);
	};

	svc.getGestores = function() {
		
		return $http.get(_urlBaseGestores);
	};

	svc.getEquipe = function(idFuncionario) {

		return $http.post(_urlBaseFuncionarios+'/'+idFuncionario+'/equipe', {});
	};
	
});