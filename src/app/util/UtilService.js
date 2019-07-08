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

  svc.formatNumber = function(num) {
    
    return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
  }

  //Como eu estou trabalhando o timezone manualmente por conta da limitação do objeto Date de Javascript
  //tem que fazer esse workaround
  svc.createNewDate = function (date) {

      var newDate = new Date(date);
      // ////console.log('newDate from Util: ', newDate);
      // newDate.setTime( newDate.getTime() + newDate.getTimezoneOffset()*60*1000 );
      // ////console.log('Após inc: newDate from Util: ', newDate);
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
        //////console.log("jornadada: ", jornada);
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
              itemHorario.minTrabalho = 0;
              infoHorario.folgas == null ? infoHorario.folgas = [dia] : infoHorario.folgas.push(dia);
            }
            else {
              itemHorario.horario = jornada.array[i].horarioFtd.replace(/\//g, " às ");
              itemHorario.minTrabalho = jornada.array[i].minutosTrabalho;
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
            itemHorario.minTrabalho = jornada.minutosTrabalho;
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
        if (arrayAnterior[i].strHorario && !arrayAnterior[i].horario)
          arrayESAnterior.push(arrayAnterior[i].strHorario);
        else if (!arrayAnterior[i].strHorario && arrayAnterior[i].horario)
          arrayESAnterior.push(arrayAnterior[i].horario);
        else if (!arrayAnterior[i].strHorario && !arrayAnterior[i].horario)
          arrayESAnterior.push(svc.setStringHorario(arrayAnterior[i].hora, 
                                    arrayAnterior[i].minuto));
      }

      for (var i=0; i<arrayProposto.length; i++){
        if (arrayProposto[i].strHorario && !arrayProposto[i].horario)
          arrayESProposto.push(arrayProposto[i].strHorario);
        else if (!arrayProposto[i].strHorario && arrayProposto[i].horario)
          arrayESProposto.push(arrayProposto[i].horario);
        else if (!arrayProposto[i].strHorario && !arrayProposto[i].horario)
          arrayESProposto.push(svc.setStringHorario(arrayProposto[i].hora, 
                                    arrayProposto[i].minuto));
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
  ** Retorna quantidade de dias entre duas datas.
  */
  svc.daysCountBtwDates = function (date1, date2){

    var oneDay = 24*60*60*1000; // hours*minutes*seconds*milliseconds
    
    var d1 = angular.copy(date1); 
    var d2 = angular.copy(date2);
    d1.setHours(0,0,0,0);
    d2.setHours(0,0,0,0);

    var objRetorno = {
      daysCount: -1,
      arrayDias: []
    };

    //objRetorno.daysCount = Math.round(Math.abs((d1.getTime() - d2.getTime())/(oneDay)));

    var current = angular.copy(d1);
    var arrayDias = [];
    var count = 0;
    while(current <= d2){
      arrayDias.push({
        id: count,
        day: current.getDay(),
        date: current.getDate(), 
        month: current.getMonth()+1,
        year: current.getFullYear()
      });
      count++;
      current = svc.addOrSubtractDays(current, 1);
    }

    objRetorno.arrayDias = arrayDias;
    objRetorno.daysCount = arrayDias.length;
    return objRetorno;
  };

  /*
  ** Compara apenas a data (dia, mes e ano)
  ** Ex.: 15/02/2018 e 16/02/2018 => -1 (a dt1 é menor que a dt2)
  */
  svc.compareOnlyDates = function(date1, date2) {

    //como a passagem é por referência, devemos criar uma cópia do objeto
    var d1 = angular.copy(date1); 
    var d2 = angular.copy(date2);
    // ////console.log('date1', d1);
    // ////console.log('date2', d2);
    d1.setHours(0,0,0,0);
    d2.setHours(0,0,0,0);

    // ////console.log('date1 time', d1.getTime());
    // ////console.log('date2 time', d2.getTime());

    if (d1.getTime() < d2.getTime())
      return -1;
    else if (d1.getTime() === d2.getTime())
      return 0;
    else
      return 1; 
  };

  svc.addOrSubtractDays = function(date, value) {
        
    var dt1 = new Date(date);
    //nDate.setHours(0,0,0,0);

    return new Date(dt1.getFullYear(), dt1.getMonth(), dt1.getDate()+value, 0, 0, 0, 0);

    //return new Date(nDate.getTime() + (value*864e5)); - falhava com timezone
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

  svc.getJustificativaStr = function(marcacoes){
    var justStr = "";
    for (var i=0; i<marcacoes.length; i++){
      if (!justStr.includes(marcacoes[i].motivo)){
        if (i == 0)
          justStr += marcacoes[i].motivo;        
        else if (i == marcacoes.length - 1)
          justStr += " e " + marcacoes[i].motivo;
        else
          justStr += ", " + marcacoes[i].motivo;
      }
    }
    // console.log("justificativaStr: ", justStr);
    return justStr;
  };

  /*
   * Pega o total de minutos e retorna um objeto com o formato de hh:mm
   *      
   */
  svc.converteParaHoraMinutoSeparados = function(totalMinutes) {
      
    var hours = Math.floor(totalMinutes/60);
    var minutes = totalMinutes % 60;

    var hoursStr = "";
    var minutesStr = "";

    hoursStr = (hours >= 0 && hours <= 9) ? "0"+hours : ""+hours;           
    minutesStr = (minutes >= 0 && minutes <= 9) ? "0"+minutes : ""+minutes;

    return {hora: hoursStr, minuto: minutesStr};
  };

  svc.getOnlyDate = function(date) {
    
    var data = angular.copy(date);
    data.setHours(0,0,0,0); //essa data é importante zerar os segundos para que não tenha inconsistência na base
    return data;
  }; 

  svc.getNextWorkingDay = function(currentDate, funcionario, equipe, feriados, maxDate){

    var finded = false;
    var nextDate = null;
    var infoWork = {};
    var dayCount = 1;
    while(!finded){
      
      nextDate = svc.addOrSubtractDays(currentDate, dayCount);
      ////console.log('nextDate: ', nextDate);
      if (svc.compareOnlyDates(nextDate, maxDate) == 0)
        finded = true;

      infoWork = svc.getInfoTrabalho(funcionario, equipe, nextDate, feriados);
      if (infoWork.trabalha == true)
        finded = true;

      dayCount++;
    }
    
    return {
      date: nextDate,
      infoWork: infoWork
    };
  };


  //Tem que levar em consideração se está de Férias, Licença, Abono, etc. E aí sim olhar se ele trabalhou.
  svc.getInfoTrabalho = function(funcionario, equipe, date, feriados){
      
      var turno = funcionario.alocacao.turno;
      var escala = turno.escala;
      var infoTrabalho = {};        

      var flagFeriado = this.isFeriado(date, feriados, equipe);
      ////console.log('flagFeriado: ', flagFeriado);

      if (escala) {
      
          ////console.log('entrou no if de criar informações extra de Escala');
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
            //////console.log('new date from isWorkingDayRotationScale: ', new Date($scope.funcionario.alocacao.dataInicioEfetivo));
            if (this.isWorkingDayRotationScale(date, new Date(funcionario.alocacao.dataInicioEfetivo))){
              
              infoTrabalho.trabalha = true; 
              infoTrabalho.aTrabalhar = turno.jornada.minutosTrabalho;
              
              if (flagFeriado && !ignoraFeriados){ //é feriado mas o turno do colaborador não ignora
                
                infoTrabalho.trabalha = false; 
                infoTrabalho.aTrabalhar = 0;
              } 

            } else {

                infoTrabalho.trabalha = false; 
                infoTrabalho.aTrabalhar = 0;
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
            // //console.log("É Feriado (fixo)!", tempDate);
            flagFeriado = checkFeriadoSchema(feriado, equipe);
            return feriado;
          }

        } else {//se não é fixo

          if ( (tempDate.getFullYear() === year) && (tempDate.getMonth() === month) && (tempDate.getDate() === date) ){
            //////console.log("É Feriado (variável)!", tempDate);
            flagFeriado = checkFeriadoSchema(feriado, equipe);
            return feriado;
          }
        }
      }
    });
    // //console.log('FlagFeriado: ', flagFeriado);
    return flagFeriado;//no futuro retornar o flag de Feriado e a descrição do mesmo!

  };

  function checkFeriadoSchema(feriado, equipe){

    var abrangencias = ["Nacional", "Estadual", "Municipal"];
    var flagFeriado = false;

    if (feriado.abrangencia == abrangencias[0]){

      ////console.log('Feriado Nacional!');
      flagFeriado = true;

    } else  if (feriado.abrangencia == abrangencias[1]){
      
      ////console.log('Feriado Estadual!');
      if (equipe.setor.local.estado == feriado.local.estado._id){
        ////console.log('Feriado Estadual no Estado correto!');
        flagFeriado = true;
      }

    } else if (feriado.abrangencia == abrangencias[2]){
      
      ////console.log('Feriado Municipal!');
      if (equipe.setor.local.municipio == feriado.local.municipio._id){
        ////console.log('No municipio correto!');
        flagFeriado = true;
      }
    }

    return flagFeriado;
  };

  svc.checkFerias = function(data, objFerias){

    var date = data.getDate();//1 a 31
    var month = data.getMonth()+1;//0 a 11 //add 1 para ficar no padrão humano
    var year = data.getFullYear();//      
    var estaFerias = false;

    ////console.log("Data Desejada: " + date +"-" +month +"-"+ year);
    ////console.log("Objeto Ferias: ", objFerias);

    if(objFerias){

      objFerias.forEach(function(ferias){
    
        for (var i = 0; i < ferias.arrayDias.length; i++) {
          ////console.log("Data Comparada: ", ferias.arrayDias[i].date +"-" + ferias.arrayDias[i].month +"-" + ferias.arrayDias[i].year);                                    
          if ( (ferias.arrayDias[i].year === year) && (ferias.arrayDias[i].month === month) && (ferias.arrayDias[i].date === date) ){
            ////console.log("Está de ferias!", ferias.arrayDias[i]);
            estaFerias = true;
            return estaFerias;
          }
          
        }
      }); 
    }
    return estaFerias;      
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

  svc.searchEmployee = function(nameKey, myArray){
    for (var i=0; i < myArray.length; i++) {
        if (myArray[i]._id === nameKey) {
            return myArray[i];
        }
    }
  };

  /*
  * retorna todas as entradas/saidas em formato de string
  */
  svc.getEntradasSaidasOnly = function(arrayMarcacoes){

    var esFinal = "";
    var esTodas = "";
    
    // arrayMarcacoes.sort(function(a, b){//ordena o array de marcaçõesFtd
    //   return a.totalMin > b.totalMin; //Comportamento ATIPICO, NAO USAR
    // });
    arrayMarcacoes.sort(
      function (a, b) {
        if (a.totalMin < b.totalMin)
          return -1;
        if (a.totalMin > b.totalMin)
          return 1;
        return 0;
      } 
    );


    var length = arrayMarcacoes.length;

    if (length == 1) {
      esFinal = arrayMarcacoes[0].horario;
      esTodas = esFinal;
    }

    else if (length > 1){ //pego a primeira e a última        
      
      esFinal = arrayMarcacoes[0].horario + " - " + arrayMarcacoes[length - 1].horario;
      
      for (var i=0; i<length; i++){
        esTodas += arrayMarcacoes[i].horario;
        if(i != length-1)
          esTodas += ", ";
      }
    }

    return {esFinal: esFinal, esTodas: esTodas};
  };

  /*
  ** Vai retornar um objeto com duas variáveis
  ** A variável esFinal possui apenas a 1a entrada e a última saída
  ** A variável arrayEntSai possui 1 objeto para cada batida, esse objeto informa por extenso 
  ** qual a entrada/saída junto com o valor da hora:minuto referente à batida. Ex.: descricao: 1a Entrada, horario: 08:05
  */
  svc.getEntradasSaidas = function(apontamentoF){

    var esFinal = "";
    var esTodas = "";
    
    // apontamentoF.marcacoesFtd.sort(function(a, b){//ordena o array de marcaçõesFtd
    //   return a > b;
    // });
    apontamentoF.marcacoesFtd.sort((a,b) => a.localeCompare(b));

    var length = apontamentoF.marcacoesFtd.length;

    if (length == 1) {
      esFinal = apontamentoF.marcacoesFtd[0];
      esTodas = esFinal;
    }

    else if (length > 1){ //pego a primeira e a última        
      
      esFinal = apontamentoF.marcacoesFtd[0] + " - " + apontamentoF.marcacoesFtd[length - 1];
      
      for (var i=0; i<length; i++){
        esTodas += apontamentoF.marcacoesFtd[i];
        if(i != length-1)
          esTodas += ", ";
      }
    }

    var itemDescricaoHorario = {};
    var strDescricao = "";
    var mapObj = {
      ent: "Entrada ",
      sai: "Saída "
    };
    var arrayEntSai = [];
    var totalMinutes = 0;
    var objHoraMinuto = {};
    for (var i=0; i<apontamentoF.marcacoes.length; i++){

      itemDescricaoHorario = {};
      strDescricao = "";
      strDescricao = apontamentoF.marcacoes[i].descricao;
      itemDescricaoHorario.id = apontamentoF.marcacoes[i].id;
      itemDescricaoHorario.tzOffset = apontamentoF.marcacoes[i].tzOffset;
      itemDescricaoHorario.RHWeb = apontamentoF.marcacoes[i].RHWeb;
      itemDescricaoHorario.REP = apontamentoF.marcacoes[i].REP;
      itemDescricaoHorario.NSR = apontamentoF.marcacoes[i].NSR;
      itemDescricaoHorario.hora = apontamentoF.marcacoes[i].hora;
      itemDescricaoHorario.minuto = apontamentoF.marcacoes[i].minuto;
      itemDescricaoHorario.segundo = apontamentoF.marcacoes[i].segundo;
      itemDescricaoHorario.descricao = strDescricao;
      itemDescricaoHorario.motivo = apontamentoF.marcacoes[i].motivo;
      itemDescricaoHorario.gerada = apontamentoF.marcacoes[i].gerada;
      itemDescricaoHorario.desconsiderada = apontamentoF.marcacoes[i].desconsiderada;
      itemDescricaoHorario.rDescricao = strDescricao.replace(/ent|sai/gi, function(matched){return mapObj[matched]});
      totalMinutes = (apontamentoF.marcacoes[i].hora * 60) + apontamentoF.marcacoes[i].minuto;
      objHoraMinuto = svc.converteParaHoraMinutoSeparados(totalMinutes);
      itemDescricaoHorario.horario = objHoraMinuto.hora + ":" + objHoraMinuto.minuto;
      arrayEntSai.push(itemDescricaoHorario);
    }

    var objetoEntradasSaidas = {
      arrayEntSai: arrayEntSai,
      esFinal: esFinal,
      esTodas: esTodas
    };
    return objetoEntradasSaidas;
  };

  /*
  *
  * Calcula a qtde de minutos trabalhados dentro de um array de batimentos.
  * Ex.: [08:00, 12:00, 14:00, 18:00] -> return 8h * 60 = 480 min
  *
  */
  svc.calcularHorasMarcacoesPropostas = function(marcacoesArray){

    var minutosTrabalhados = 0;
    var lengthMarcacoes = marcacoesArray.length;
    var parcial1 = 0;
    var parcial2 = 0;

    if (lengthMarcacoes >= 2){
      for (var i=0; i < lengthMarcacoes-1; i=i+2){
        parcial1 = marcacoesArray[i+1].hora*60 + marcacoesArray[i+1].minuto;
        parcial2 = marcacoesArray[i].hora*60 + marcacoesArray[i].minuto;
        minutosTrabalhados += parcial1 - parcial2;
      }  
    }
    
    return minutosTrabalhados;
  };

  svc.isValidHorarioField = function(strHorario) {      

    if (strHorario.length < 4)
      return null;
    
    var hoursStr = strHorario.substring(0, 2);
    var minutesStr = strHorario.substring(2);
    var hoursO = parseInt(hoursStr);
    var minutes = parseInt(minutesStr);
    
    if (hours < 0 || hours > 23)
      return null;

    if (minutes < 0 || minutes > 59)
      return null;

    var hours = hoursO * 60;

    return {
      totalMinutes: (hours + minutes),
      hora: hoursO,
      minutes: minutes,
      horarioFtd: hoursStr + ":" + minutesStr
    };
  };

  /*
  *
  * Verifica se a quantidade de batidas é válida (inclusive verificando as batidas desconsideradas)
  * Uma quantidade válida de batidas deve estar em número PAR
  * Para cada ENTRADA uma SAÍDA
  *
  */
  svc.isValidBatidasSchema = function(arrayES){

    var validCount = 0;
    for (var i=0; i<arrayES.length; i++){
      if (!arrayES[i].desconsiderada){
        validCount++;
      }
    }
    if (validCount % 2 == 0){
      return true;
    } else {
      return false;
    }
  };

  /**
  * 1. Remove os pontos que foram descartados
  * 2. Dá um sort pelo totalMin para organizar na sequencia as batidas
  * 3. Cria o orderId e as Descrições e acopla aos batimentos que ja estão na ordem correta
  */
  svc.reorganizarBatidasPropostas = function(arrayES){
    
    //1.
    var newArrayES = arrayES.filter(function( obj ) {
      return obj.desconsiderada === false;
    });
    var removedArray = arrayES.filter(function( obj ) {
      return obj.desconsiderada === true;
    });
    //2.
    //newArrayES.sort(function(a,b){return a.totalMin > b.totalMin});
    newArrayES.sort(
      function (a, b) {
        if (a.totalMin < b.totalMin)
          return -1;
        if (a.totalMin > b.totalMin)
          return 1;
        return 0;
      } 
    );

    //começando o index com 1.
    for (var i=1; i<=newArrayES.length; i++){
      newArrayES[i-1].id = i;
      if (i == 1){
        newArrayES[i-1].descricao = "ent1";
        newArrayES[i-1].rDescricao = "Entrada 1";
      } 
      else {
        if (i % 2 === 0){ //se for par é uma saída
          newArrayES[i-1].descricao = "sai"+( (i/2) );
          newArrayES[i-1].rDescricao = "Saída "+( (i/2) );
        } else { //ímpar é uma entrada
          newArrayES[i-1].descricao = "ent"+(Math.floor(i/2) + 1);
          newArrayES[i-1].rDescricao = "Entrada "+(Math.floor(i/2) + 1);
        }
      }
    }

    return {actives: newArrayES, removed: removedArray};
  };

  svc.reorganizarBatidasPropostasTemp = function(arrayES){
    
    var newArrayES = arrayES.filter(function( obj ) {
      return obj.desconsiderada === false;
    });

    var removedArray = arrayES.filter(function( obj ) {
      return obj.desconsiderada === true;
    });

    // for (var z=0; z<newArrayES.length; z++){

    // }
    //newArrayES.sort(function(a,b){return a.horario > b.horario}); //COMPORTAMENTO ATIPICO EM ALGUNS NAVEGADORES
    newArrayES.sort((a,b) => a.horario.localeCompare(b.horario));

    //começando o index com 1.
    for (var i=1; i<=newArrayES.length; i++){
      newArrayES[i-1].id = i;
      if (i == 1){
        newArrayES[i-1].descricao = "ent1";
        newArrayES[i-1].rDescricao = "Entrada 1";
      } 
      else {
        if (i % 2 === 0){ //se for par é uma saída
          newArrayES[i-1].descricao = "sai"+( (i/2) );
          newArrayES[i-1].rDescricao = "Saída "+( (i/2) );
        } else { //ímpar é uma entrada
          newArrayES[i-1].descricao = "ent"+(Math.floor(i/2) + 1);
          newArrayES[i-1].rDescricao = "Entrada "+(Math.floor(i/2) + 1);
        }
      }
    }

    for (var j=0; j<removedArray.length; j++){
      removedArray[j].descricao = "-"
      removedArray[j].rDescricao = "-"
    }

    return newArrayES.concat(removedArray);
  };


});