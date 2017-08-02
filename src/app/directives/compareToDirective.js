angular.module('BlurAdmin').directive('compareTo', [function(){

    return {
        require: "ngModel",
        scope: {
            otherModelValue: "=compareTo"
        },
        link: function(scope, element, attributes, ngModel) {
             
            ngModel.$validators.compareTo = function(modelValue) {
                console.log('modelValue: ', modelValue);
                console.log('otherModelValue: ', scope.otherModelValue);
                return (modelValue == scope.otherModelValue) || (modelValue == null && scope.otherModelValue == '');
            };
 
            scope.$watch("otherModelValue", function() {
                ngModel.$validate();
                console.log('passou pelo validate!');   
            });
        }
    };
}]);