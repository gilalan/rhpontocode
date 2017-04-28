angular.module('BlurAdmin').filter('zpad', function(){

	return function(input){
		
		console.log('input dentro do filter', input);
		if (input >= 0 && input <= 9)
			return '0'+input;

		return input;
	};

});