/**
 * @author Gilliard Lopes
 * created on 18/05/2017
 */

angular.module('BlurAdmin.pages.myhitpoint').service("myhitpointAPI", function($http, config){

	var _urlBaseHitpoint = config.baseUrl + '/api/solicitacoes-ajuste';	
	var svc = this;	

	svc.get = function() {

		return $http.get(_urlBaseHitpoint);
	};

	svc.create = function (solicitacaoAjuste) {

		return $http.post(_urlBaseHitpoint, solicitacaoAjuste);
	};

	svc.delete = function (id) {

		return $http.delete(_urlBaseHitpoint + '/' + id);
	};

	svc.update = function (solicitacaoAjuste) {

		return $http.put(_urlBaseHitpoint + '/' + solicitacaoAjuste._id, solicitacaoAjuste);
	};

	svc.getSolicitacaoAjuste = function(id) {

		return $http.get(_urlBaseHitpoint+'/'+id);
	};
});