/**
 * @author Gilliard Lopes
 * created on 18/05/2017
 */

angular.module('BlurAdmin.pages.solicitations').service("solicitationAPI", function($http, config){

	var _urlBaseSolicitacoes = config.baseUrl + '/api/solicitacoes';
	var svc = this;	

	svc.get = function () {
		
		return $http.get(_urlBaseSolicitacoes);
	};

	svc.create = function (solicitacao) {
		
		return $http.post(_urlBaseSolicitacoes, solicitacao);
	};

	svc.update = function (solicitacao) {

		return $http.put(_urlBaseSolicitacoes + '/' + solicitacao._id, solicitacao);
	};
	
	svc.delete = function (id) {

		return $http.delete(_urlBaseSolicitacoes + '/' + id);
	};

	svc.getSolicitacao = function(id) {

		return $http.get(_urlBaseSolicitacoes+'/'+id);
	};	
	
});