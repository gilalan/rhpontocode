angular.module('BlurAdmin').config(["$httpProvider", function($httpProvider){
		
	//$httpProvider.interceptors.push("timestampInterceptor");
	//$httpProvider.interceptors.push("errorInterceptor");
	//$httpProvider.interceptors.push("sessionInjectorInterceptor");
	$httpProvider.interceptors.push("loadingInterceptor");
}]);
