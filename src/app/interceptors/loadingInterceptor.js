angular.module("BlurAdmin").factory("loadingInterceptor", ["$q", "$rootScope", function($q, $rootScope){

	var numLoadings = 0;

    return {
        request: function (config) {

        	if (numLoadings === 0){
        		// Show loader
            	$rootScope.$broadcast("loader_show");
            }
            numLoadings++;
            
            return config || $q.when(config);

        },
        response: function (response) {

            if ((--numLoadings) === 0) {
                // Hide loader
                $rootScope.$broadcast("loader_hide");
            }

            return response || $q.when(response);

        },
        responseError: function (response) {

            if (!(--numLoadings)) {
                // Hide loader
                $rootScope.$broadcast("loader_hide");
            }

            return $q.reject(response);
        }
    };

}]);