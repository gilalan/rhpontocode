/**
 * @author Gilliard Lopes
 * created on 18/05/2017
 */

angular.module('BlurAdmin.pages.reports').service("reportsAPI", function($http, config){

	var _urlBaseReports = config.baseUrl + '/api/reports';
	var svc = this;	

	// svc.get = function () {
		
	// 	return $http.get(_urlBaseReports);
	// };

	svc.getEspelhoPontoFuncionarios = function (objDate) {
		
		return $http.post(_urlBaseReports + '/', objDate);
	};

	// svc.update = function (solicitacao) {

	// 	return $http.put(_urlBaseReports + '/' + solicitacao._id, solicitacao);
	// };
	
	// svc.delete = function (id) {

	// 	return $http.delete(_urlBaseReports + '/' + id);
	// };

	// svc.getSolicitacao = function(id) {

	// 	return $http.get(_urlBaseReports+'/'+id);
	// };	
	
});