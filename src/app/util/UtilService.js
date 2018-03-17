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

    svc.getInfoHorario = function(funcionario, infoHorario) {

        var weekFullDays = ["Domingo","Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
        var jornada;
        var escala = funcionario.alocacao.turno.escala;
        var dia = null;
        var itemHorario = {};
        var flagRepetido = false;
        var itemRepetido = null;

        if (escala && escala.codigo == 1) { //jornada semanal

        jornada = funcionario.alocacao.turno.jornada;
        if (jornada && jornada.array){
          jornada.array.sort(function (a, b) { //ordena por segurança
            if (a.dia > b.dia) {
              return 1;
            }
            if (a.dia < b.dia) {
              return -1;
            }
            // a must be equal to b
            return 0;
          });
          for (var i=0; i<jornada.array.length; i++){
            itemHorario = {};
            flagRepetido = false;
            dia = jornada.array[i].dia;
            itemHorario.dia = weekFullDays[dia];
            if (!jornada.array[i].horarios){
              itemHorario.horario = "Descanso Semanal Remunerado";
            }
            else {
              itemHorario.horario = jornada.array[i].horarioFtd.replace(/\//g, " às ");
            }
            for (var j=0; j<infoHorario.length; j++){
              if (infoHorario[j].horario == itemHorario.horario){
                flagRepetido = true;
                itemRepetido = infoHorario[j];
              }
            }
            if (!flagRepetido)
              infoHorario.push(itemHorario);
            else
              itemRepetido.dia = itemRepetido.dia.concat(",", itemHorario.dia);
          }
        }

        } else if (escala && escala.codigo == 2){

        jornada = funcionario.alocacao.turno.jornada;
        if (jornada.array.length == 1){
          if (jornada.array[0].horarios){
            itemHorario.dia = "Revezamento 12 x 36h (dia sim, dia não)";
            itemHorario.horario = jornada.array[0].horarioFtd.replace(/\//g, " às ");
            infoHorario.push(itemHorario);
          }
        }
        }

        infoHorario.sort(function (a, b) { //ordena para deixar os DSR por último
        if (a.horario.includes("Descanso")) {
          return 1;
        }
        else {
          return -1;
        }
        // a must be equal to b
        return 0;
        });

        //condensar linhas com mesmo horário
        var arrayStrRep = null;
        for (var i=0; i<infoHorario.length; i++){

        arrayStrRep = infoHorario[i].dia.split(',');
        if (arrayStrRep.length == 2)
          infoHorario[i].dia = arrayStrRep[0].concat(" e ", arrayStrRep[1]);
        else if (arrayStrRep.length > 2)
          infoHorario[i].dia = arrayStrRep[0].concat(" à ", arrayStrRep[arrayStrRep.length-1]);        
        }

        return infoHorario;
    };
});