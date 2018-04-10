/*
 *
 * Serviço utilitário para criação de relatórios em PDF usando o pdfMake
 *
*/
angular.module('BlurAdmin').service("utilCorrectApps", function($filter, reportsAPI){

	var svc = this;
	var diff = 0;

	svc.correctArray = function(funcionario, infoHorario, apontamentos, totais, feriados, equipe){

		console.log('funcionario recebido? ', funcionario);
		var arrayApps = [];

		for (var i=0; i<apontamentos.length; i++){

			console.log('apontamento: ', apontamentos[i]);
			var extraInformations = verifyWorkerInfo(apontamentos[i].data, 
				funcionario, feriados, equipe);

			console.log('extraInformations: ', extraInformations);
			arrayApps.push({
				_id: apontamentos[i]._id,
				trabalha: extraInformations.infoTrabalho.trabalha,
				aTrabalhar: extraInformations.infoTrabalho.aTrabalhar
			});

		}

		reportsAPI.setApontamentosCorrecao(arrayApps).then(function successCallback(response){
	        
	        console.log('message returned: ', response.data);

	      }, function errorCallback(response){
	        
	        console.log('message returned: ', response.data);
      	});
	};

	function verifyWorkerInfo(data, funcionario, feriados, equipe) {

		var date = new Date(data);
	    var turno = null;
    	var escala = null;
      	var extraInformations = {};
      	var infoTrabalho = {};

	    if (funcionario)
	        if (funcionario.alocacao)
	          if (funcionario.alocacao.turno){
	            turno = funcionario.alocacao.turno;
	            if (funcionario.alocacao.turno.escala)
	              escala = funcionario.alocacao.turno.escala;
	          }
      
      var flagFeriado = isFeriado(date, equipe, feriados);

      if (escala) {
        
        console.log('entrou no if de criar informações extra de Escala');
        var ignoraFeriados = turno.ignoraFeriados;
        var minutos_trabalhados = undefined;
        if (escala.codigo == 1) {//escala tradicional na semana

          var diaTrabalho = isWorkingDayWeeklyScale(date.getDay(), turno.jornada.array);
          if (diaTrabalho.horarios && !flagFeriado) { //é um dia de trabalho normal

            infoTrabalho.trabalha = true;
            infoTrabalho.aTrabalhar = diaTrabalho.minutosTrabalho;
            minutos_trabalhados = getWorkedMinutes(date);
            if (minutos_trabalhados != undefined)
              infoTrabalho.trabalhados = getWorkedMinutes(date);//só calcula para ciclos pares de batidas

          } else {

            if (flagFeriado && ignoraFeriados) { //é um feriado mas o turno do colaborador ignora isso
              
              infoTrabalho.trabalha = true;
              infoTrabalho.aTrabalhar = diaTrabalho.minutosTrabalho;
              minutos_trabalhados = getWorkedMinutes(date);
              if (minutos_trabalhados != undefined)
                infoTrabalho.trabalhados = getWorkedMinutes(date);//só calcula para ciclos pares de batidas

            } else {

              infoTrabalho.trabalha = false;
              infoTrabalho.aTrabalhar = 0;
              minutos_trabalhados = getWorkedMinutes(date);
              if (minutos_trabalhados != undefined)
                infoTrabalho.trabalhados = getWorkedMinutes(date);//só calcula para ciclos pares de batidas
            }
          }

        } else if (escala.codigo == 2) { //escala 12x36

          //dia de trabalho
          console.log('new date from isWorkingDayRotationScale: ', new Date(funcionario.alocacao.dataInicioEfetivo));
          //if (isWorkingDayRotationScale(date, new Date(funcionario.alocacao.dataInicioEfetivo)) && !flagFeriado){
          //passando as datas como string para testar...
      	  if (isWorkingDayRotationScale(data, funcionario.alocacao.dataInicioEfetivo) && !flagFeriado){
            
            infoTrabalho.trabalha = true; 
            infoTrabalho.aTrabalhar = turno.jornada.minutosTrabalho;
            minutos_trabalhados = getWorkedMinutes(date);
            if (minutos_trabalhados != undefined)
              infoTrabalho.trabalhados = getWorkedMinutes(date);

          } else {

            if (flagFeriado && ignoraFeriados){ //é feriado mas o turno do colaborador ignora
              
              infoTrabalho.trabalha = true; 
              infoTrabalho.aTrabalhar = turno.jornada.minutosTrabalho;
              minutos_trabalhados = getWorkedMinutes(date);
              if (minutos_trabalhados != undefined)
                infoTrabalho.trabalhados = getWorkedMinutes(date);              

            } else {
             
              infoTrabalho.trabalha = false; 
              infoTrabalho.aTrabalhar = 0;
              minutos_trabalhados = getWorkedMinutes(date);
              if (minutos_trabalhados != undefined)
                infoTrabalho.trabalhados = getWorkedMinutes(date);
            }
          }
        }
        
        extraInformations.infoTrabalho = infoTrabalho;

      } else {

        console.log("Funcionário não possui um turno ou uma escala de trabalho cadastrado(a).");
      }

      return extraInformations;
    };

    function isFeriado(dataDesejada, equipe, feriados) {
      
      var data = dataDesejada;

      console.log('Data Desejada para isFeriado: ', data);
      //console.log('Setor.local: ', $scope.equipe);

      var date = data.getDate();//1 a 31
      var month = data.getMonth();//0 a 11
      var year = data.getFullYear();//
      var flagFeriado = false;
      var tempDate;      

      feriados.forEach(function(feriado){
        
        //console.log('feriado atual: ', feriado);        

        for (var i = 0; i < feriado.array.length; i++) {
          
          tempDate = new Date(feriado.array[i]);
          if (feriado.fixo){
          
            if (tempDate.getMonth() === month && tempDate.getDate() === date){
              console.log("É Feriado (fixo)!", tempDate);
              flagFeriado = checkFeriadoSchema(feriado, equipe);
              return feriado;
            }

          } else {//se não é fixo

            if ( (tempDate.getFullYear() === year) && (tempDate.getMonth() === month) && (tempDate.getDate() === date) ){
              console.log("É Feriado (variável)!", tempDate);
              flagFeriado = checkFeriadoSchema(feriado, equipe);
              return feriado;
            }
          }
        }
      });
      console.log('FlagFeriado: ', flagFeriado);
      return flagFeriado;//no futuro retornar o flag de Feriado e a descrição do mesmo!
    };

    function checkFeriadoSchema(feriado, equipe){

      var abrangencias = ["Nacional", "Estadual", "Municipal"];
      var flagFeriado = false;

      if (feriado.abrangencia == abrangencias[0]){

        console.log('Feriado Nacional!');
        flagFeriado = true;

      } else  if (feriado.abrangencia == abrangencias[1]){
        
        console.log('Feriado Estadual!');
        if (equipe.setor.local.estado == feriado.local.estado._id){
          console.log('Feriado Estadual no Estado correto!');
          flagFeriado = true;
        }

      } else if (feriado.abrangencia == abrangencias[2]){
        
        console.log('Feriado Municipal!');
        if (equipe.setor.local.municipio == feriado.local.municipio._id){
          console.log('No municipio correto!');
          flagFeriado = true;
        }
      }

      return flagFeriado;
    };

    /*
    *
    * Não Verifica, mas retorna o dia de trabalho na escala semanal
    *
    */
    function isWorkingDayWeeklyScale(dayToCompare, arrayJornadaSemanal) {
      
      var diaRetorno = {};
      arrayJornadaSemanal.forEach(function(objJornadaSemanal){
        if(dayToCompare == objJornadaSemanal.dia){
          diaRetorno = objJornadaSemanal;
          return diaRetorno;
        }
      });
      ////console.log("DIA RETORNO NO getDayInArrayJornadaSemanal: ", diaRetorno);
      return diaRetorno;
    };

    /*
    *
    * Verifica se é dia de trabalho na escala de revezamento 12x36h 
    *
    */
    function isWorkingDayRotationScale(dateToCompare, dataInicioEfetivo) {

      var oneDay = 24*60*60*1000; // hours*minutes*seconds*milliseconds
      
      // var d1 = angular.copy(dateToCompare); 
      // var d2 = angular.copy(dataInicioEfetivo);
      // d1.setHours(0,0,0,0);
      // d2.setHours(0,0,0,0);

      var str1 = dateToCompare.split('-');
      var str2 = dataInicioEfetivo.split('-');
      var d1;
      var d2;
      if (str1.length == 3){
      	var mesJS = parseInt(str1[1]);
      	d1 = new Date(str1[0], mesJS-1, str1[2].substring(0, 2), 0, 0, 0, 0);
      }

      if (str2.length == 3){
      	var mesJS = parseInt(str2[1]);
      	d2 = new Date(str2[0], mesJS-1, str2[2].substring(0, 2), 0, 0, 0, 0);//str2[2].substring(0, 2), 0, 0, 0, 0);
      }

      console.log('data 1', d1);
      console.log('data 2', d2);

      //Levar em consideração também os timezones tem  que calcular a timezone
      // as vezes a hora do funcionário chega com TZ02:00:00 e a hora da batida ta com 03:00:00
      // aí fica 1h a mais e esse diffDays dá false mas deveria ser True.
      // var tz1 = d1.getTimezoneOffset();
      // var tz2 = d2.getTimezoneOffset();
      // var diffTzs = Math.abs(tz1 - tz2);

      var diffDays = Math.round(Math.abs((d1.getTime() - d2.getTime())/(oneDay)));
      console.log("diffDays: ", diffDays);
      
      return (diffDays % 2 == 0) ? true : false;
    };

    /*
    * De acordo com a atual batida do funcionário, calcula as horas trabalhadas
    */
    function getWorkedMinutes(marcacoes) {
      	
      	console.log('Get Worked Minutes!');
      
        //se for uma marcação par, dá para calcular certinho
        if (marcacoes.length % 2 == 0) {

          if (marcacoes.length == 0)
          	return 0;

          else if (marcacoes.length == 2){
            var parte1 = marcacoes[1].hora*60 + marcacoes[1].minuto;
            console.log('parte1: ', parte1);
            var parte2 = marcacoes[0].hora*60 + marcacoes[0].minuto;
            console.log('parte2: ', parte2);
            console.log('marcacao com 2 batidas, cálculo: ', (parte1 - parte2));
            if (parte1 > parte2){

              return parte1 - parte2;

            } else {

              return parte2 - parte1;
            }
          }
          else {            
            var minutosTrabalhados = 0;
            var lengthMarcacoes = marcacoes.length;
            console.log('lengthMarcacoes: ', lengthMarcacoes);
            //obtém a primeira parcial de trabalho com a última batida (saída) e o registro de entrada anterior a ela. ex.: sai2 - ent2
            var parcial1 = marcacoes[lengthMarcacoes-1].hora*60 + marcacoes[lengthMarcacoes-1].minuto;
            var parcial2 = marcacoes[lengthMarcacoes-2].hora*60 + marcacoes[lengthMarcacoes-2].minuto;
            console.log('parcial 1: ', parcial1);
            console.log('parcial 2: ', parcial2);
            minutosTrabalhados = parcial1 - parcial2;
            console.log('minutosTrabalhados: ', minutosTrabalhados);
            //como ainda não foi atualizado, esse array não tem a nova batida registrada em 'newDate' (parametro da funcao)
            for (var i=0; i < lengthMarcacoes-1; i=i+2){
              console.log('index: ', i);
              console.log('apontamento.marcacoes[i+1]: ', marcacoes[i+1]);
              console.log('apontamento.marcacoes[i]: ', marcacoes[i]);
              var forparcial1 = marcacoes[i+1].hora*60 + marcacoes[i+1].minuto;
              var forparcial2 = marcacoes[i].hora*60 + marcacoes[i].minuto;
              console.log('dentro do for, parcial 1: ', (forparcial1 - forparcial2));
              minutosTrabalhados += forparcial1 - forparcial2;
              console.log('minutosTrabalhados atualizado: ', minutosTrabalhados);
            }
            return minutosTrabalhados;
          } 
        } else return undefined;
    };

});