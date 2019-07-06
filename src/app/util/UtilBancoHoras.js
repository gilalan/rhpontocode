/*
* Serviços de Banco de Horas e que servem também para os Reports (tem que refatorar)
*/

angular.module('BlurAdmin').service("utilBancoHoras", function(util){

	var svc = this;

	/*
    *
    * Retorna um objeto com informações de horas trabalhadas presentes no Apontamento
    *      
    */
    svc.getSaldoPresente = function(apontamento){

      var saldoDia = apontamento.infoTrabalho.trabalhados - apontamento.infoTrabalho.aTrabalhar;
      var sinalFlag = '-';
      var saldoFlag = false;

      if (saldoDia >= 0){
        saldoFlag = true;
        sinalFlag = '';
      }

      var saldoDiarioFormatado = util.converteParaHoraMinutoSeparados(Math.abs(saldoDia));

      var objBHDiario = {
        trabalha: apontamento.infoTrabalho.trabalha,
        ferias: apontamento.infoTrabalho.ferias,
        saldoDiario: saldoDia,
        horasFtd: sinalFlag + saldoDiarioFormatado.hora + ':' + saldoDiarioFormatado.minuto,
        horasPosit: saldoFlag,
        horasNegat: !saldoFlag
      };

      return objBHDiario;
    };    

    /*
    *
    * Busca no array de apontamentos o item com a dataAtual passada por parametro
    *      
    */
    svc.getApontamentoFromSpecificDate = function(arrayApontamentos, dataAtual){

      var apontamentoByDate = null;

      for (var i=0; i<arrayApontamentos.length; i++){

        if (util.compareOnlyDates(dataAtual, new Date(arrayApontamentos[i].data)) == 0) {

          apontamentoByDate = arrayApontamentos[i];
        }
      }

      return apontamentoByDate;
    };

    /*
    *
    * Retorna um objeto com informações de horas trabalhadas presentes no Apontamento
    *      
    */

    svc.setInfoAusencia = function(apontamento, currentDate, funcionarioParam, feriados, equipe){

    	var saldoFlag = false;
    	var sinalFlag = '-';
    	var saldoDiarioFormatado = {};

    	//pode não ter expediente iniciado, ser feriado, estar atrasado, de folga ou faltante mesmo
    	var expedienteObj;	
      
   	 	expedienteObj = svc.updateAbsenceStatus(funcionarioParam, currentDate, feriados, equipe);
    	//console.log("setInfoAusencia, expedienteObj: ", expedienteObj);

    	apontamento.ocorrencia.statusCodeString = expedienteObj.code;
    	apontamento.ocorrencia.minutosDevidos = expedienteObj.minutosDia;
    	apontamento.ocorrencia.statusString = expedienteObj.string;
    	apontamento.ocorrencia.statusImgUrl = expedienteObj.imgUrl;

    	if (expedienteObj.code == "FER"){

      	saldoFlag = true;
      	sinalFlag = '';
      	saldoDiarioFormatado = util.converteParaHoraMinutoSeparados(Math.abs(expedienteObj.saldoDia));
      	apontamento.observacao = expedienteObj.string;
      	apontamento.saldo.horasPosit = saldoFlag;
      	apontamento.saldo.horasNegat = !saldoFlag;

    	} else if (expedienteObj.code == "FRD"){
      	saldoFlag = true;
        sinalFlag = '';
        saldoDiarioFormatado = util.converteParaHoraMinutoSeparados(Math.abs(expedienteObj.saldoDia));
        apontamento.observacao = expedienteObj.string;
        apontamento.saldo.horasPosit = saldoFlag;
        apontamento.saldo.horasNegat = !saldoFlag;

      } else if (expedienteObj.code == "ENI") {

        saldoFlag = true;
        sinalFlag = '';
        saldoDiarioFormatado = {hora: '-', minuto: '-'};
        apontamento.observacao = expedienteObj.string;
        apontamento.saldo.horasPosit = saldoFlag;
        apontamento.saldo.horasNegat = saldoFlag;

      } else if (expedienteObj.code == "DSR") {

        saldoFlag = true;
        sinalFlag = '';
        saldoDiarioFormatado = {hora: '-', minuto: '-'};
        apontamento.observacao = expedienteObj.string;
        apontamento.saldo.horasPosit = saldoFlag;
        apontamento.saldo.horasNegat = saldoFlag;

      } else if (expedienteObj.code == "AUS") {
      
        saldoDiarioFormatado = util.converteParaHoraMinutoSeparados(Math.abs(expedienteObj.saldoDia));
        apontamento.observacao = "Falta";
        apontamento.saldo.horasPosit = saldoFlag;
        apontamento.saldo.horasNegat = !saldoFlag;
    	}

    	apontamento.saldo.horasFtd = sinalFlag + saldoDiarioFormatado.hora + ':' + saldoDiarioFormatado.minuto;
    };


     /*
     * São 6 possíveis casos para ausência:
     * 1- Feriado
     * 2- ENI - Expediente Não Iniciado
     * 3- Folga solicitada e aceita / Licença
     * 4- DSR - Descanso Semanal Remunerado 
     * 5- Ausência de fato
     * 6- Férias!
    */
    svc.updateAbsenceStatus = function(funcionario, dataDesejada, feriados, equipe) {
      
      var funcionarioAlocacao = funcionario.alocacao;
      var codigoEscala = funcionarioAlocacao.turno.escala.codigo; 
      var ignoraFeriados =  funcionarioAlocacao.turno.ignoraFeriados;
      var objFeriadoRet = isFeriado(dataDesejada, feriados, equipe);
      var objFerias = util.checkFerias(dataDesejada, funcionario.ferias);

      if (objFerias){
        
        return {code: "FER", string: "Férias!", imgUrl: "assets/img/app/todo/mypoint_correct16.png", saldoDia: 0};

      } else {

        if (objFeriadoRet.flag && !ignoraFeriados){ //Caso 1 - feriado

          return {code: "FRD", string: objFeriadoRet.name, imgUrl: "assets/img/app/todo/mypoint_correct16.png", saldoDia: 0};//getSaldoDiaFrd(funcionarioAlocacao)};

        } else if (hasFolgaSolicitada() || hasLicenca()){ //Caso 3 - Folgas/Licenças


        } else { //Caso 2, 4 ou 5
          
          if (codigoEscala == 1) {
            return checkJornadaSemanal(funcionarioAlocacao, dataDesejada);
          }

          else if (codigoEscala == 2)
            return checkJornadaRevezamento(funcionarioAlocacao, dataDesejada);
        }
      }
    };

    function hasFolgaSolicitada() {

    };

    function hasLicenca() {

    };

    function checkJornadaSemanal(funcionarioAlocacao, dataDesejada) {

      var dataHoje = new Date();
      var dataAtual = dataDesejada;

      var jornadaArray = funcionarioAlocacao.turno.jornada.array; //para ambas as escalas
      var objDay = getDayInArrayJornadaSemanal(dataAtual.getDay(), jornadaArray);
      
      if (!objDay || !objDay.minutosTrabalho || objDay.minutosTrabalho <= 0) { //Caso 4 - DSR
        
        return {code: "DSR", string: "Descanso Semanal Remunerado", imgUrl: "assets/img/app/todo/bullet-grey-16.png"};

      } else { //Chegando aqui, só pode ser ENI ou Ausente de fato

        var codDate = util.compareOnlyDates(dataAtual, dataHoje);

        if (codDate === 0) { //é o próprio dia de hoje
          //HORA ATUAL é menor que ENT1 ? caso sim, sua jornada ainda não começou
          var totalMinutesAtual = converteParaMinutosTotais(dataHoje.getHours(), 
          dataHoje.getMinutes());
          var ENT1 = objDay.horarios.ent1;

          if (totalMinutesAtual < ENT1) {
          
            return {code: "ENI", string: "Expediente Não Iniciado", imgUrl: "assets/img/app/todo/bullet-blue.png"};

          } else {
            return {code: "AUS", minutosDia: objDay.minutosTrabalho, string: "Ausente", imgUrl: "assets/img/app/todo/mypoint_wrong16.png", saldoDia: objDay.minutosTrabalho};
          }

        } else if (codDate === -1) {//Navegando em dia passado 

          return {code: "AUS", minutosDia: objDay.minutosTrabalho, string: "Ausente", imgUrl: "assets/img/app/todo/mypoint_wrong16.png", saldoDia: objDay.minutosTrabalho};

        } else { //Navegando em dias futuros

          return {code: "ENI", string: "Expediente Não Iniciado", imgUrl: "assets/img/app/todo/bullet-blue.png"};
        }
      } 
    };

    /*
     * Na Jornada 12x36h não adianta pegar os minutosTrabalho feito na semanal, pois temos que checar se o dia é de trabalho ou folga
     * ELes trabalham dia sim / dia não na prática, temos que saber se esse é o dia SIM ou NÃO...
    */
    function checkJornadaRevezamento(funcionarioAlocacao, dataDesejada) {

      var jornadaArray = funcionarioAlocacao.turno.jornada.array;
      var minutosTrabalho = funcionarioAlocacao.turno.jornada.minutosTrabalho;
      var dataComparacao = dataDesejada;
      var dataHoje = new Date();

      var trabalha = isWorkingDay(dataComparacao, 
        new Date(funcionarioAlocacao.dataInicioEfetivo));
      
      if (trabalha && jornadaArray.length > 0) { //ele deveria ter trabalhado, ou é ENI ou AUSENCIA

        var ENT1 = jornadaArray[0].horarios.ent1;
        var codDate = util.compareOnlyDates(dataComparacao, dataHoje);

        if (codDate === 0) { //é o próprio dia de hoje
          //HORA ATUAL é menor que ENT1 ? caso sim, sua jornada ainda não começou
          var totalMinutesAtual = converteParaMinutosTotais(dataHoje.getHours(), 
          dataHoje.getMinutes());

          if (totalMinutesAtual < ENT1) {
          
            return {code: "ENI", string: "Expediente Não Iniciado", imgUrl: "assets/img/app/todo/bullet-blue.png"};

          } else {
            return {code: "AUS", minutosDia: minutosTrabalho, string: "Ausente", imgUrl: "assets/img/app/todo/mypoint_wrong16.png", saldoDia: funcionarioAlocacao.turno.jornada.minutosTrabalho};
          }
        } else if (codDate === -1) {//Navegando em dia passado 

          return {code: "AUS", minutosDia: minutosTrabalho, string: "Ausente", imgUrl: "assets/img/app/todo/mypoint_wrong16.png", saldoDia: funcionarioAlocacao.turno.jornada.minutosTrabalho};
        } else { //Navegando em dias futuros

          return {code: "ENI", string: "Expediente Não Iniciado", imgUrl: "assets/img/app/todo/bullet-blue.png"};
        }

      } else {

        return {code: "DSR", string: "Descanso Semanal Remunerado", imgUrl: "assets/img/app/todo/bullet-grey-16.png"}; 
      }
    };

    function getDayInArrayJornadaSemanal(dayToCompare, arrayJornadaSemanal) {
      
      var diaRetorno = {};
      arrayJornadaSemanal.forEach(function(objJornadaSemanal){
        if(dayToCompare == objJornadaSemanal.dia){
          diaRetorno = objJornadaSemanal;
          return diaRetorno;
        }
      });
      
      return diaRetorno;
    };

    function isWorkingDay(dateToCompare, dataInicioEfetivo) {

      var oneDay = 24*60*60*1000; // hours*minutes*seconds*milliseconds
      
      var d1 = angular.copy(dateToCompare); 
      var d2 = angular.copy(dataInicioEfetivo);
      d1.setHours(0,0,0,0);
      d2.setHours(0,0,0,0);

      var diffDays = Math.round(Math.abs((d1.getTime() - d2.getTime())/(oneDay)));      
      
      return (diffDays % 2 == 0) ? true : false;
    };

    function converteParaHorasTotais(totalMinutos) {
      return (totalMinutos/60);
    };

    function converteParaMinutosTotais(hours, mins) {
      return (hours * 60) + mins;
    };

    function isFeriado(dataDesejada, feriados, equipe) {
      
      var data = dataDesejada;

      var date = data.getDate();//1 a 31
      var month = data.getMonth();//0 a 11
      var year = data.getFullYear();//
      var flagFeriado = false;
      var feriadoName = "";
      var tempDate;      

      feriados.forEach(function(feriado){
        
        ////console.log('feriado atual: ', feriado);        

        for (var i = 0; i < feriado.array.length; i++) {
          
          tempDate = new Date(feriado.array[i]);
          if (feriado.fixo){
          
            if (tempDate.getMonth() === month && tempDate.getDate() === date){
              ////////console.log("É Feriado (fixo)!", tempDate);
              flagFeriado = checkFeriadoSchema(feriado, equipe);
              feriadoName = feriado.nome;
              return feriado;
            }

          } else {//se não é fixo

            if ( (tempDate.getFullYear() === year) && (tempDate.getMonth() === month) && (tempDate.getDate() === date) ){
              ////////console.log("É Feriado (variável)!", tempDate);
              flagFeriado = checkFeriadoSchema(feriado, equipe);
              feriadoName = feriado.nome;
              return feriado;
            }
          }
        }
      });
      ////console.log('FlagFeriado: ', flagFeriado);
      return {flag: flagFeriado, name: feriadoName};//no futuro retornar o flag de Feriado e a descrição do mesmo!
    };

    function checkFeriadoSchema(feriado, equipe){

      var abrangencias = ["Nacional", "Estadual", "Municipal"];
      var flagFeriado = false;

      if (feriado.abrangencia == abrangencias[0]){

        ////////console.log('Feriado Nacional!');
        flagFeriado = true;

      } else  if (feriado.abrangencia == abrangencias[1]){
        
        ////////console.log('Feriado Estadual!');
        if (equipe.setor.local.estado == feriado.local.estado._id){
          ////////console.log('Feriado Estadual no Estado correto!');
          flagFeriado = true;
        }

      } else if (feriado.abrangencia == abrangencias[2]){
        
        ////////console.log('Feriado Municipal!');
        if (equipe.setor.local.municipio == feriado.local.municipio._id){
          ////////console.log('No municipio correto!');
          flagFeriado = true;
        }
      }

      return flagFeriado;
    };
});