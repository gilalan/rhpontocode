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

    //Traz um cabeçalho de informações com o horário do funcionário em questão
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

    svc.getInfoSolicitacaoAjuste = function(solicitacaoAjuste){

        var arrayAnterior = solicitacaoAjuste.anterior.marcacoes;
        var arrayProposto = solicitacaoAjuste.proposto.marcacoes;

        arrayAnterior.sort(
            function (a, b) {
                if (a.totalMin < b.totalMin)
                return -1;
                if (a.totalMin > b.totalMin)
                return 1;
                return 0;
            } 
        );

        arrayProposto.sort(
            function (a, b) {
                if (a.totalMin < b.totalMin)
                return -1;
                if (a.totalMin > b.totalMin)
                return 1;
                return 0;
            } 
        );

        var arrayESAnterior = [];
        var arrayESProposto = [];

        for (var i=0; i<arrayAnterior.length; i++){
            arrayESAnterior.push(arrayAnterior[i].strHorario);
        }

        for (var i=0; i<arrayProposto.length; i++){
            arrayESProposto.push(arrayProposto[i].strHorario);
        }

        return {
            arrayESAnterior: arrayESAnterior,
            arrayESProposto: arrayESProposto
        };
    };

    svc.obterStatusMarcacao = function(item){
      
      if(item.desconsiderada){
        
        return "Batida Desconsiderada";

      } else {

        if (item.incluida){
          return "Batida manual incluída agora";
        }
        else {
          if (item.REP)
            return "Batida Normal via REP";
          if (item.RHWeb)
            return "Batida Normal via WEB";
          if (!item.REP && !item.RHWeb)
            return "Batida Manual Justificada";
        }
      }
    };

    /*
    ** Compara apenas a data (dia, mes e ano)
    ** Ex.: 15/02/2018 e 16/02/2018 => -1 (a dt1 é menor que a dt2)
    */
    svc.compareOnlyDates = function(date1, date2) {

      //como a passagem é por referência, devemos criar uma cópia do objeto
      var d1 = angular.copy(date1); 
      var d2 = angular.copy(date2);
      //console.log('date1', d1);
      //console.log('date2', d2);
      d1.setHours(0,0,0,0);
      d2.setHours(0,0,0,0);

      //console.log('date1 time', d1.getTime());
      //console.log('date2 time', d2.getTime());

      if (d1.getTime() < d2.getTime())
        return -1;
      else if (d1.getTime() === d2.getTime())
        return 0;
      else
        return 1; 
    };

    svc.addOrSubtractDays = function(date, value) {
          
      date = angular.copy(date);
      date.setHours(0,0,0,0);

      return new Date(date.getTime() + (value*864e5));
    };

    svc.setStringHorario = function(hoursP, minutesP) {

      var hours = parseInt(hoursP);
      var minutes = parseInt(minutesP);
      var hoursStr = "";
      var minutesStr = "";

      hoursStr = (hours >= 0 && hours <= 9) ? "0"+hours : ""+hours;           
      minutesStr = (minutes >= 0 && minutes <= 9) ? "0"+minutes : ""+minutes;

      return hoursStr + ":" + minutesStr;

    };

    svc.getOnlyDate = function(date) {
      
      var data = angular.copy(date);
      data.setHours(0,0,0,0); //essa data é importante zerar os segundos para que não tenha inconsistência na base
      return data;
    }; 

    svc.getInfoTrabalho = function(funcionario, equipe, date, feriados){
        
        var turno = funcionario.alocacao.turno;
        var escala = turno.escala;
        var infoTrabalho = {};        

        var flagFeriado = this.isFeriado(date, feriados, equipe);
        console.log('flagFeriado: ', flagFeriado);

        if (escala) {
        
            console.log('entrou no if de criar informações extra de Escala');
            var ignoraFeriados = turno.ignoraFeriados;
            var minutos_trabalhados = undefined;
            if (escala.codigo == 1) {//escala tradicional na semana

              var diaTrabalho = this.isWorkingDayWeeklyScale(date.getDay(), turno.jornada.array);
              if (diaTrabalho.horarios && !flagFeriado) { //é um dia de trabalho normal

                infoTrabalho.trabalha = true;
                infoTrabalho.aTrabalhar = diaTrabalho.minutosTrabalho;
                // minutos_trabalhados = getWorkedMinutes(date);
                // if (minutos_trabalhados != undefined)
                //   infoTrabalho.trabalhados = getWorkedMinutes(date);//só calcula para ciclos pares de batidas

              } else {

                if (flagFeriado && ignoraFeriados) { //é um feriado mas o turno do colaborador ignora isso
                  
                  infoTrabalho.trabalha = true;
                  infoTrabalho.aTrabalhar = diaTrabalho.minutosTrabalho;
                  // minutos_trabalhados = getWorkedMinutes(date);
                  // if (minutos_trabalhados != undefined)
                  //   infoTrabalho.trabalhados = getWorkedMinutes(date);//só calcula para ciclos pares de batidas

                } else {

                  infoTrabalho.trabalha = false;
                  infoTrabalho.aTrabalhar = 0;
                  // minutos_trabalhados = getWorkedMinutes(date);
                  // if (minutos_trabalhados != undefined)
                  //   infoTrabalho.trabalhados = getWorkedMinutes(date);//só calcula para ciclos pares de batidas
                }
              }

            } else if (escala.codigo == 2) { //escala 12x36

              //dia de trabalho
              //console.log('new date from isWorkingDayRotationScale: ', new Date($scope.funcionario.alocacao.dataInicioEfetivo));
              if (this.isWorkingDayRotationScale(date, new Date(funcionario.alocacao.dataInicioEfetivo)) && !flagFeriado){
                
                infoTrabalho.trabalha = true; 
                infoTrabalho.aTrabalhar = turno.jornada.minutosTrabalho;
                // minutos_trabalhados = getWorkedMinutes(date);
                // if (minutos_trabalhados != undefined)
                //   infoTrabalho.trabalhados = getWorkedMinutes(date);

              } else {

                if (flagFeriado && ignoraFeriados){ //é feriado mas o turno do colaborador ignora
                  
                  infoTrabalho.trabalha = true; 
                  infoTrabalho.aTrabalhar = turno.jornada.minutosTrabalho;
                  // minutos_trabalhados = getWorkedMinutes(date);
                  // if (minutos_trabalhados != undefined)
                  //   infoTrabalho.trabalhados = getWorkedMinutes(date);              

                } else {
                 
                  infoTrabalho.trabalha = false; 
                  infoTrabalho.aTrabalhar = 0;
                  // minutos_trabalhados = getWorkedMinutes(date);
                  // if (minutos_trabalhados != undefined)
                  //   infoTrabalho.trabalhados = getWorkedMinutes(date);
                }
              }
            }
        } else {

            return undefined;
        }

        return infoTrabalho;
    };

    svc.isFeriado = function(data, feriados, equipe){

        var date = data.getDate();//1 a 31
        var month = data.getMonth();//0 a 11
        var year = data.getFullYear();//
        var flagFeriado = false;
        var tempDate;

        feriados.forEach(function(feriado){
        
            for (var i = 0; i < feriado.array.length; i++) {
              
              tempDate = new Date(feriado.array[i]);
              if (feriado.fixo){
              
                if (tempDate.getMonth() === month && tempDate.getDate() === date){
                  //console.log("É Feriado (fixo)!", tempDate);
                  flagFeriado = checkFeriadoSchema(feriado, equipe);
                  return feriado;
                }

              } else {//se não é fixo

                if ( (tempDate.getFullYear() === year) && (tempDate.getMonth() === month) && (tempDate.getDate() === date) ){
                  //console.log("É Feriado (variável)!", tempDate);
                  flagFeriado = checkFeriadoSchema(feriado, equipe);
                  return feriado;
                }
              }
            }
          });
      // console.log('FlagFeriado: ', flagFeriado);
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
    svc.isWorkingDayWeeklyScale = function(dayToCompare, arrayJornadaSemanal) {
      
      var diaRetorno = {};
      arrayJornadaSemanal.forEach(function(objJornadaSemanal){
        if(dayToCompare == objJornadaSemanal.dia){
          diaRetorno = objJornadaSemanal;
          return diaRetorno;
        }
      });
      return diaRetorno;
    };

    /*
    *
    * Verifica se é dia de trabalho na escala de revezamento 12x36h 
    *
    */
    svc.isWorkingDayRotationScale = function(dateToCompare, dataInicioEfetivo) {

      var oneDay = 24*60*60*1000; // hours*minutes*seconds*milliseconds
      
      var d1 = angular.copy(dateToCompare); 
      var d2 = angular.copy(dataInicioEfetivo);
      d1.setHours(0,0,0,0);
      d2.setHours(0,0,0,0);

      var diffDays = Math.round(Math.abs((d1.getTime() - d2.getTime())/(oneDay)));
      return (diffDays % 2 == 0) ? true : false;
    };
});