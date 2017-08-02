/*
 *	Se precisar usar serviços de fora...
 */

angular.module('BlurAdmin').service("util", function(){

	//baseUrl: "http://52.89.212.253:8080"
	var svc = this;	

	svc.fixDateFormat = function(data) {

		var regex = /[0-9]{2}\/[0-9]{2}\/[0-9]{4}/;

        if (regex.test(data)){
            if(data.length === 10) {
                var dateArray = data.split("/");
                return new Date(dateArray[2], dateArray[1]-1, dateArray[0]).getTime();
            }
        } 

        return data;
	};

    //Como eu estou trabalhando o timezone manualmente por conta da limitação do objeto Date de Javascript
    //tem que fazer esse workaround
    svc.createNewDate = function (date) {

        var newDate = new Date(date);
        // console.log('newDate from Util: ', newDate);
        // newDate.setTime( newDate.getTime() + newDate.getTimezoneOffset()*60*1000 );
        // console.log('Após inc: newDate from Util: ', newDate);
        return newDate;
    };
});