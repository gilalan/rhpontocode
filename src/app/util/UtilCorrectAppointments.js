/*
 *
 * Serviço utilitário para criação de relatórios em PDF usando o pdfMake
 *
*/
angular.module('BlurAdmin').service("utilCorrectApps", function($filter, reportsAPI, util){

	var svc = this;
	var diff = 0;

	svc.correctArray = function(funcionario, infoHorario, apontamentos, totais, feriados, equipe){

		// console.log('funcionario recebido? ', funcionario);
    // console.log('infoHorario: ', infoHorario);
    // console.log('apontamentos: ', apontamentos);		
    // console.log('totais: ', totais);
    // console.log('feriados: ', feriados);
    // console.log('equipe: ', equipe);
    var arrayApps = [];

		for (var i=0; i<apontamentos.length; i++){

			console.log('apontamento: ', apontamentos[i]);
			var extraInformations = verifyWorkerInfo(apontamentos[i], apontamentos[i].data, 
				funcionario, feriados, equipe);

			console.log('extraInformations: ', extraInformations);
			arrayApps.push({
				_id: apontamentos[i]._id,
				trabalha: extraInformations.infoTrabalho.trabalha,
				aTrabalhar: extraInformations.infoTrabalho.aTrabalhar,
        trabalhados: extraInformations.infoTrabalho.trabalhados,
        marcacoes: apontamentos[i].marcacoes,
        marcacoesFtd: apontamentos[i].marcacoesFtd
			});

		}
    // console.log()
		reportsAPI.setApontamentosCorrecao(arrayApps).then(function successCallback(response){
	        
      console.log('message returned: ', response.data);

    }, function errorCallback(response){
      
      console.log('message returned: ', response.data);
  	});
	};

  svc.correctRepeatedAppointments = function(apontamentos){

    var arrayApps = [];
    var hasNull = false;
    var marcacoesAntigas = [];
    var marcacoesREP = [];
    var marcacoesMAN = [];
    for (var i=0; i<apontamentos.length; i++){

      hasNull = false;
      marcacoesAntigas = [];
      marcacoesREP = [];
      marcacoesMAN = [];

      if (apontamentos[i].marcacoesFtd){
        for (var j=0; j<apontamentos[i].marcacoesFtd.length; j++){
          //o certo seria null, mas eh uma string e vou ter que botar 00:00, cuidado se o func tiver um batimento de verrdade nessa hora
          //console.log("App "+i+", marc " + j + ", " + typeof(apontamentos[i].marcacoesFtd[j]));
          if (apontamentos[i].marcacoesFtd[j] == "00:00"){
            hasNull = true;
            break;
          }
        }
      }

      if (hasNull){
        console.log('apontamento: ', apontamentos[i]);
        marcacoesAntigas = apontamentos[i].marcacoes;
        for (var k=0; k<apontamentos[i].marcacoes.length; k++){
          if (apontamentos[i].marcacoes[k].REP == true)
            marcacoesREP.push(apontamentos[i].marcacoes[k]);
          else
            marcacoesMAN.push(apontamentos[i].marcacoes[k]);
        }
        
        if (marcacoesREP.length % 2 == 0){

          apontamentos[i].marcacoes = marcacoesREP;

        } else { //caso de número impar de marcacoes (status = incorreto)

          apontamentos[i].marcacoes = [];
          for (var r=0; r<marcacoesREP.length; r++){
            apontamentos[i].marcacoes.push(marcacoesREP[r]);
            for (var m=0; m<marcacoesMAN.length; m++){
              console.log("Result: ");
              if ( Math.abs(marcacoesREP[r].totalMin - marcacoesMAN[m].totalMin) <= 10) {
                marcacoesMAN[m].DELETED = true;
              }
              else {
                apontamentos[i].marcacoes.push(marcacoesMAN[m]);
              }
            }
          }

          apontamentos[i].status = {
            id: 3,
            descricao: "Justificado",
            justificativaStr: "Esquecimento"
          };
        }
        util.reorganizarBatidasPropostas(apontamentos[i].marcacoes);
        apontamentos[i].marcacoesFtd = util.getMarcacoesFtd(apontamentos[i].marcacoes);
        apontamentos[i].infoTrabalho.trabalhados = util.calcularHorasMarcacoesPropostas(apontamentos[i].marcacoes);

        arrayApps.push({
          _id: apontamentos[i]._id,
          trabalhados: apontamentos[i].infoTrabalho.trabalhados,
          marcacoes: apontamentos[i].marcacoes,
          marcacoesFtd: apontamentos[i].marcacoesFtd,
          status: apontamentos[i].status
        });
      }
    }    

    //console.log('apontamentos corrigidos: ', apontamentos);
      
    reportsAPI.setApontamentosRemoveZerados(arrayApps).then(function successCallback(response){
          
      console.log('message returned: ', response.data);

    }, function errorCallback(response){
      
      console.log('message returned: ', response.data);
    });
  };

  svc.correctMarcacoesFtd = function(apontamentos){
    
    var novasMarcacoes = [];
    for(var i=0; i<apontamentos.length; i++){
      novasMarcacoes = angular.copy (apontamentos[i].marcacoes);
      apontamentos[i].marcacoesFtd = [];
      _adjustUniqueMarcacao(novasMarcacoes);
      util.reorganizarBatidasPropostas(novasMarcacoes);
      apontamentos[i].marcacoes = novasMarcacoes;
      for(var k=0; k<novasMarcacoes.length; k++){
        apontamentos[i].marcacoesFtd.push( novasMarcacoes[k].strHorario );
      }
      apontamentos[i].infoTrabalho.trabalhados = util.calcularHorasMarcacoesPropostas(novasMarcacoes);
      
    }
    return apontamentos;

  };

  svc.changeBaseDate = function(newDate, apontamentos){

    reportsAPI.setNewBaseDate({newDate: newDate, apontamentos: apontamentos}).then(function successCallback(response){
          
      console.log('message returned: ', response.data);

    }, function errorCallback(response){
      
      console.log('message returned: ', response.data);
    });

  };

  svc.putFeriasAppoints = function(apontamentos){
    
    var arrayApps = [];

    for (var i=0; i<apontamentos.length; i++){

      console.log('apontamento: ', apontamentos[i]);      
      arrayApps.push({
        _id: apontamentos[i]._id,
        trabalha: false,
        aTrabalhar: 0,
        estaFerias: true
      });
    }

    reportsAPI.setFeriasApontamentos(arrayApps).then(function successCallback(response){
          
      console.log('message returned: ', response.data);

    }, function errorCallback(response){
      
      console.log('message returned: ', response.data);
    });
     
  };

  function _adjustUniqueMarcacao(marcacoes){

    var marcacoesRet = [];
    var marcacao = {};
    var added = false;
    for (var i=0; i < marcacoes.length; i++){
      marcacao = marcacoes[i];
      added = false;
      //encontra a marcacao igual e retorna a que seja via REP ou WEB de preferencia.
      for (var j=i+1; j < marcacoes.length; j++){
        if (marcacao.hora == marcacoes[j].hora && marcacao.minuto == marcacoes[j].minuto){
          if ( (marcacao.REP == true || marcacao.RHWeb == true) && (marcacoes[j].REP == false && marcacoes[j].RHWeb == false) ){
            /*for (var k=0; k < marcacoesRet.length; k++){
              if (marcacao.hora )
            }*/
            console.log("");
            marcacoes.splice(j, 1);
          }
          else {
            marcacoes.splice(i, 1);
          }          
        }  
      }      
    }
  };

	function verifyWorkerInfo(apontamento, data, funcionario, feriados, equipe) {

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
            minutos_trabalhados = getWorkedMinutes(apontamento);
            if (minutos_trabalhados != undefined)
              infoTrabalho.trabalhados = minutos_trabalhados;//só calcula para ciclos pares de batidas

          } else {

            if (flagFeriado && ignoraFeriados) { //é um feriado mas o turno do colaborador ignora isso
              
              infoTrabalho.trabalha = true;
              infoTrabalho.aTrabalhar = diaTrabalho.minutosTrabalho;
              minutos_trabalhados = getWorkedMinutes(apontamento);
              if (minutos_trabalhados != undefined)
                infoTrabalho.trabalhados = minutos_trabalhados;//só calcula para ciclos pares de batidas

            } else {

              infoTrabalho.trabalha = false;
              infoTrabalho.aTrabalhar = 0;
              minutos_trabalhados = getWorkedMinutes(apontamento);
              if (minutos_trabalhados != undefined)
                infoTrabalho.trabalhados = minutos_trabalhados;//só calcula para ciclos pares de batidas
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
            minutos_trabalhados = getWorkedMinutes(apontamento);
            if (minutos_trabalhados != undefined)
              infoTrabalho.trabalhados = minutos_trabalhados;

          } else {

            if (flagFeriado && ignoraFeriados){ //é feriado mas o turno do colaborador ignora
              
              infoTrabalho.trabalha = true; 
              infoTrabalho.aTrabalhar = turno.jornada.minutosTrabalho;
              minutos_trabalhados = getWorkedMinutes(apontamento);
              if (minutos_trabalhados != undefined)
                infoTrabalho.trabalhados = minutos_trabalhados;              

            } else {
             
              infoTrabalho.trabalha = false; 
              infoTrabalho.aTrabalhar = 0;
              minutos_trabalhados = getWorkedMinutes(apontamento);
              if (minutos_trabalhados != undefined)
                infoTrabalho.trabalhados = minutos_trabalhados;
            }
          }
        }
        
        extraInformations.infoTrabalho = infoTrabalho;        

      } else {

        console.log("Funcionário não possui um turno ou uma escala de trabalho cadastrado(a).");
      }

      if (extraInformations.infoTrabalho.trabalhados == undefined)
        extraInformations.infoTrabalho.trabalhados = 0;

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

      console.log('data 1 STRING', dateToCompare);
      console.log('data 2 STRING', dataInicioEfetivo);

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
      var tz1 = d1.getTimezoneOffset();
      var tz2 = d2.getTimezoneOffset();
      console.log('tz1: ', tz1);
      console.log('tz2: ', tz2);
      // var diffTzs = Math.abs(tz1 - tz2);

      var diffDays = Math.round(Math.abs((d1.getTime() - d2.getTime())/(oneDay)));
      console.log("diffDays: ", diffDays);
      
      return (diffDays % 2 == 0) ? true : false;
    };

    /*
    * De acordo com a atual batida do funcionário, calcula as horas trabalhadas
    */
    function getWorkedMinutes(apontamento) {
      	
      var marcacoes = apontamento.marcacoes;
    	// console.log('Get Worked Minutes!');
      console.log('ordenar o array de marcacoes');
      sortArrayMarcacoes(apontamento);
      // console.log('apontamento modificado: ', apontamento);
    
      //se for uma marcação par, dá para calcular certinho
      if (marcacoes.length % 2 == 0) {

        if (marcacoes.length == 0)
        	return 0;

        else if (marcacoes.length == 2){
          var parte1 = marcacoes[1].hora*60 + marcacoes[1].minuto;
          // console.log('parte1: ', parte1);
          var parte2 = marcacoes[0].hora*60 + marcacoes[0].minuto;
          // console.log('parte2: ', parte2);
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
          // console.log('lengthMarcacoes: ', lengthMarcacoes);
          // //obtém a primeira parcial de trabalho com a última batida (saída) e o registro de entrada anterior a ela. ex.: sai2 - ent2
          // var parcial1 = marcacoes[lengthMarcacoes-1].hora*60 + marcacoes[lengthMarcacoes-1].minuto;
          // var parcial2 = marcacoes[lengthMarcacoes-2].hora*60 + marcacoes[lengthMarcacoes-2].minuto;
          // // console.log('parcial 1: ', parcial1);
          // // console.log('parcial 2: ', parcial2);
          // minutosTrabalhados = parcial1 - parcial2;
          //  console.log('minutosTrabalhados: ', minutosTrabalhados);
          //como ainda não foi atualizado, esse array não tem a nova batida registrada em 'newDate' (parametro da funcao)
          for (var i=0; i < lengthMarcacoes-1; i=i+2){
            // console.log('index: ', i);
            // console.log('apontamento.marcacoes[i+1]: ', marcacoes[i+1]);
            // console.log('apontamento.marcacoes[i]: ', marcacoes[i]);
            var forparcial1 = marcacoes[i+1].hora*60 + marcacoes[i+1].minuto;
            var forparcial2 = marcacoes[i].hora*60 + marcacoes[i].minuto;
             console.log('dentro do for, parcial 1: ', (forparcial1 - forparcial2));
            minutosTrabalhados += forparcial1 - forparcial2;
            // console.log('minutosTrabalhados atualizado: ', minutosTrabalhados);
          }
          return minutosTrabalhados;
        } 
      } else { //batidas em numero impar (incorretas)
        
        if (marcacoes.length > 1 && marcacoes.length < 5){
          var parte1 = marcacoes[1].hora*60 + marcacoes[1].minuto;
          // console.log('parte1: ', parte1);
          var parte2 = marcacoes[0].hora*60 + marcacoes[0].minuto;
          // console.log('parte2: ', parte2);
           console.log('marcacao com 2 batidas, cálculo: ', (parte1 - parte2));
          if (parte1 > parte2){

            return parte1 - parte2;

          } else {

            return parte2 - parte1;
          }
        } 

        if(marcacoes.length >= 5){

          var minutosTrabalhados = 0;
          var lengthMarcacoes = marcacoes.length;
        
          for (var i=0; i < lengthMarcacoes-2; i=i+2){
            var forparcial1 = marcacoes[i+1].hora*60 + marcacoes[i+1].minuto;
            var forparcial2 = marcacoes[i].hora*60 + marcacoes[i].minuto;
             console.log('dentro do for, parcial 1: ', (forparcial1 - forparcial2));
            minutosTrabalhados += forparcial1 - forparcial2;
          }
          return minutosTrabalhados;
        }
        return undefined;
      }
    };

    function sortArrayMarcacoes(apontamento){

      apontamento.marcacoes.sort(
        function (a, b) {
          if (a.totalMin < b.totalMin)
            return -1;
          if (a.totalMin > b.totalMin)
            return 1;
          return 0;
        } 
      );

      apontamento.marcacoesFtd = [];

      for (var i=0; i<apontamento.marcacoes.length; i++){
        
        apontamento.marcacoes[i].id = i+1;
        apontamento.marcacoesFtd.push(apontamento.marcacoes[i].strHorario);

        if (i === 0)
          apontamento.marcacoes[i].descricao = "ent1";
        
        else if (i === 1)
          apontamento.marcacoes[i].descricao = "sai1";
        
        else if (i === 2)
          apontamento.marcacoes[i].descricao = "ent2";

        else if (i === 3)
          apontamento.marcacoes[i].descricao = "sai2";

        else { //verificar quantos pares de entrada/saida já foram adicionados para gerar a descricao
          if (i % 2 === 0) {//se é par
            apontamento.marcacoes[i].descricao = "ent" + ( (i/2) + 1);
          } else {
            apontamento.marcacoes[i].descricao = "sai" + (Math.floor(i/2) + 1);
          }
        }
      }

    };

});