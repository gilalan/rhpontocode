/**
 * @author Gilliard Lopes
 * created on 26/04/2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.myhitpoint')
      .controller('HitpointCtrl', HitpointCtrl)
      .controller('ModalBatidasDiaCtrl', ModalBatidasDiaCtrl)
      .controller('ModalSolicitacoesCtrl', ModalSolicitacoesCtrl);

  /** @ngInject */
  function HitpointCtrl($scope, $filter, $state, $uibModal, appointmentAPI, employeeAPI, Auth, usuario, currentDate, feriados, util) {

    $scope.smartTablePageSize = 15;
    console.log("dentro do HitpointCtrl, USUARIO: ", usuario);
    var Usuario = usuario.data;
    $scope.funcionario = usuario.data.funcionario;
    console.log('Funcionário: ', $scope.funcionario);
    $scope.currentDate = currentDate.data.date;
    $scope.currentDateFtd = $filter('date')($scope.currentDate, 'dd/MM/yyyy');
    $scope.funcionario.alocacao.dataAdmissaoFtd = $filter('date')($scope.funcionario.alocacao.dataAdmissao, 'fullDate');
    $scope.periodo = {};
    console.log('Current Date: ', $scope.currentDate);
    var feriados = feriados.data;
    var weekFullDays = ["Domingo","Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
    var pagePath = 'app/pages/my_hitpoint/modals/batidasDiaModal.html'; //representa o local que vai estar o html de conteúdo da modal
    var pageSolicitarPath = 'app/pages/my_hitpoint/modals/solicitacoesModal.html';
    var defaultSize = 'md'; //representa o tamanho da Modal

    $scope.periodoApontamento = [];

    //setHorarioInfo no INIT
    $scope.infoHorario = [];
    var equipe = {};

    $scope.search = function(periodo) {
      
      console.log('periodo: data inicial: ', periodo.dataInicial);
      console.log('periodo: data final: ', periodo.dataFinal);
      $scope.errorMsg = null;
      var dataAdmissao = new Date($scope.funcionario.alocacao.dataAdmissao);
      var dataIni = new Date(checkFormatDatesUiDateDirective(periodo.dataInicial));
      var dataFim = new Date(checkFormatDatesUiDateDirective(periodo.dataFinal));

      //se a data inicial da pesquisa for antes da data de admissão: não pode!
      if (compareOnlyDates(dataIni, dataAdmissao) == -1 || compareOnlyDates(dataFim, dataAdmissao) == -1) {
        $scope.errorMsg = "data inicial ou final devem vir após a data de admissão do colaborador";
        return $scope.errorMsg;
      }
      if (compareOnlyDates(new Date(), dataIni) == -1 || compareOnlyDates(new Date(), dataFim) == -1){
        $scope.errorMsg = "data inicial ou final não podem ser maiores que a data corrente";
        return $scope.errorMsg;
      }
      if (compareOnlyDates(dataIni, dataFim) == 1){
        $scope.errorMsg = "data final deve ser maior que a data inicial.";
        return $scope.errorMsg;
      }
      getApontamentosByDateRangeAndEquipe(dataIni, dataFim, $scope.funcionario);
    };

    function checkFormatDatesUiDateDirective(date){

      console.log(typeof date);
      if (typeof date == "string"){
        console.log('É uma String!', date);
        var dateArray = date.split("/");
        return new Date(dateArray[2], dateArray[1]-1, dateArray[0]).getTime();
      } 

      return date;
    };

    /*
    ** Mostra todas as batidas deste dia em sequência
    */
    $scope.verBatidas = function(itemApontamento) {

      openBatidasDia(pagePath, defaultSize, itemApontamento.data, itemApontamento.arrayEntSai);
    };

    /*
    ** Abre a tela de solicitações 
    */
    $scope.solicitar = function(itemApontamento){

      openSolicitacoes(pageSolicitarPath, defaultSize, itemApontamento.rawDate, itemApontamento.arrayEntSai);
    };

    function openBatidasDia (page, size, data, arrayEntSai) {

      var objBatidasDiaria = {
        data: data,
        array: arrayEntSai
      }

      var modalInstance = $uibModal.open({
        animation: true,
        templateUrl: page,
        size: size,
        controller: 'ModalBatidasDiaCtrl',
        resolve: {
          objBatidasDiaria: function () {
            return objBatidasDiaria;
          }
        }
      });

      modalInstance.result.then(function (){
        
      }, function () {
        console.log('modal is dismissed or close.');
      });
    };

    function openSolicitacoes (page, size, data, arrayEntSai) {

      var dateAux = new Date(data);
      var endDateAux = addOrSubtractDays(dateAux, 1);

      var objDateWorker = {
        date: {
          raw: data,
          year: dateAux.getFullYear(),
          month: dateAux.getMonth(),
          day: dateAux.getDate(),
          hour: dateAux.getHours(),
          minute: dateAux.getMinutes(),
          finalInclude: false,
          final: {
            raw: endDateAux,
            year: endDateAux.getFullYear(),
            month: endDateAux.getMonth(),
            day: endDateAux.getDate(),
            hour: endDateAux.getHours(),
            minute: endDateAux.getMinutes()
          }
        },
        usuario: Usuario,
        funcionario: $scope.funcionario
      };

      var objBatidasDiaria = {
        dateWorker: objDateWorker,
        array: arrayEntSai
      }

      var modalInstance = $uibModal.open({
        animation: true,
        templateUrl: page,
        size: size,
        controller: 'ModalSolicitacoesCtrl',
        resolve: {
          objBatidasDiaria: function () {
            return objBatidasDiaria;
          }
        }
      });

      modalInstance.result.then(function (){
        
      }, function () {
        console.log('modal is dismissed or close.');
      });
    };

    /*
     *
     * Solicita ao servidor um objeto com os apontamentos dos componentes da equipe (apenas 1 componente nesse caso)
     *
    **/
    function getApontamentosByDateRangeAndEquipe(beginDate, endDate, funcionario) {

      console.log('beginDate? ', beginDate);
      console.log('endDate? ', endDate);
      console.log('funcionario ', funcionario);
      var dateAux = new Date(beginDate);
      var endDateAux = new Date(endDate);

      var objDateWorker = {
        date: {
          raw: beginDate,
          year: dateAux.getFullYear(),
          month: dateAux.getMonth(),
          day: dateAux.getDate(),
          hour: dateAux.getHours(),
          minute: dateAux.getMinutes(),
          finalInclude: true,
          final: {
            raw: endDate,
            year: endDateAux.getFullYear(),
            month: endDateAux.getMonth(),
            day: endDateAux.getDate(),
            hour: endDateAux.getHours(),
            minute: endDateAux.getMinutes()
          }
        },
        funcionario: funcionario
      };

      //Ajeita a formatação da data para não ter problema com a visualização
      $scope.periodo.dataInicial = $filter('date')($scope.periodo.dataInicial, 'dd/MM/yyyy');
      $scope.periodo.dataFinal = $filter('date')($scope.periodo.dataFinal, 'dd/MM/yyyy');
      $scope.periodoApontamento = [];
      console.log("objDateWorker Enviado: ", objDateWorker);

      appointmentAPI.getApontamentosByDateRangeAndFuncionario(objDateWorker).then(function successCallback(response){

        var apontamentosResponse = response.data;
        console.log("!@# Apontamentos do funcionário: ", apontamentosResponse);
        $scope.periodoApontamento = createArrayRangeDate(dateAux, endDateAux, 1, apontamentosResponse);
        //createTableApontamentos(arrayDatas, apontamentosResponse);

      }, function errorCallback(response){
        
        $scope.errorMsg = response.data.message;
        //////console.log("Erro ao obter apontamentos por um range de data e equipe");
      });
    };

    function createArrayRangeDate (startDate, endDate, interval, apontamentosSemanais) {
      
      var interval = interval || 1;
      var retVal = [];
      var current = new Date(startDate);
      var endDate = new Date(endDate);
      var itemApontamento = {};
      //console.log('current ', current);
      //console.log('endDate ', endDate);
      var i = 0;
      var apontamentoF = null;
      var objEntradasSaidas = {};
      
      while (current <= endDate) {

        itemApontamento = {};
        objEntradasSaidas = {};
        console.log('itemApontamento antes: ', itemApontamento);
        apontamentoF = getApontamentoFromSpecificDate(apontamentosSemanais, current);
        console.log('currentDate: ', current);
        console.log('apontamento? ', apontamentoF);
        itemApontamento.order = i;
        itemApontamento.rawDate = new Date(current);
        itemApontamento.data = $filter('date')(new Date(current), 'abvFullDate2');

        if (apontamentoF){
          
          objEntradasSaidas = getEntradasSaidas(apontamentoF);
          itemApontamento.entradaSaidaFinal = objEntradasSaidas.esFinal;
          itemApontamento.arrayEntSai = objEntradasSaidas.arrayEntSai;
          itemApontamento.ocorrencia = getOcorrenciaStatus(apontamentoF, current);
          itemApontamento.saldo = getSaldoPresente(apontamentoF);

        } else {

          itemApontamento.entradaSaidaFinal = "-";
          itemApontamento.arrayEntSai = [];
          itemApontamento.ocorrencia = {};
          itemApontamento.saldo = {};
          setInfoAusencia(itemApontamento, current); //injeta as informações de ausencia no apontamento
        }

        console.log('itemApontamento depois: ', itemApontamento);
        retVal.push(itemApontamento);
        current = addOrSubtractDays(current, interval);
        i++;
      }

      //console.log('rangeDate calculado:', retVal);
      // retVal.sort(function(a, b){//ordena o array de datas criadas
      //   return a.order < b.order;
      // });
      retVal.sort(function (a, b) {
        if (a.order > b.order) {
          return 1;
        }
        if (a.order < b.order) {
          return -1;
        }
        // a must be equal to b
        return 0;
      });
      //console.log('rangeDate calculado e ordenado decresc:', retVal);
      return retVal;  
    };

    function compareOnlyDates(date1, date2) {

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

    function addOrSubtractDays(date, value) {
          
      date = angular.copy(date);
      date.setHours(0,0,0,0);

      return new Date(date.getTime() + (value*864e5));
    };

    function getApontamentoFromSpecificDate(apontamentosSemanais, dataAtual){

      var apontamentoByDate = null;

      for (var i=0; i<apontamentosSemanais.length; i++){

        if (compareOnlyDates(dataAtual, new Date(apontamentosSemanais[i].data)) == 0) {

          apontamentoByDate = apontamentosSemanais[i];
        }
      }

      return apontamentoByDate;
    };

    /*
    ** Vai retornar um objeto com duas variáveis
    ** A variável esFinal possui apenas a 1a entrada e a última saída
    ** A variável arrayEntSai possui 1 objeto para cada batida, esse objeto informa por extenso 
    ** qual a entrada/saída junto com o valor da hora:minuto referente à batida. Ex.: descricao: 1a Entrada, horario: 08:05
    */
    function getEntradasSaidas(apontamentoF){

      var esFinal = "";
      
      apontamentoF.marcacoesFtd.sort(function(a, b){//ordena o array de marcaçõesFtd
        return a > b;
      });

      var length = apontamentoF.marcacoesFtd.length;

      if (length == 1)
        esFinal = apontamentoF.marcacoesFtd[0];

      else if (length > 1) //pego a primeira e a última        
        esFinal = apontamentoF.marcacoesFtd[0] + " - " + apontamentoF.marcacoesFtd[length - 1];

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
        itemDescricaoHorario.hora = apontamentoF.marcacoes[i].hora;
        itemDescricaoHorario.minuto = apontamentoF.marcacoes[i].minuto;
        itemDescricaoHorario.rDescricao = strDescricao;
        itemDescricaoHorario.descricao = strDescricao.replace(/ent|sai/gi, function(matched){return mapObj[matched]});
        totalMinutes = (apontamentoF.marcacoes[i].hora * 60) + apontamentoF.marcacoes[i].minuto;
        objHoraMinuto = converteParaHoraMinutoSeparados(totalMinutes);
        itemDescricaoHorario.horario = objHoraMinuto.hora + ":" + objHoraMinuto.minuto;
        arrayEntSai.push(itemDescricaoHorario);
      }

      var objetoEntradasSaidas = {
        arrayEntSai: arrayEntSai,
        esFinal: esFinal
      };
      return objetoEntradasSaidas;
    }

    function getOcorrenciaStatus(apontamento, dataDesejada){

      var ocorrencia = {};

      var codDate = compareOnlyDates(dataDesejada, new Date()); ///CUIDADO COM TIMEZONE!!!!

      if (codDate === 0) { //é o próprio dia de hoje - coloca uma imagem em andamento

        ocorrencia.statusCodeString = "AND";
        ocorrencia.statusString = "Jornada em Andamento";
        ocorrencia.statusImgUrl = "assets/img/app/todo/loader-progress-36.png";

      } else {

        if (apontamento.status.id == 0){ //Correto
          
          ocorrencia.statusCodeString = "COR";
          ocorrencia.statusString = "Apontamento Correto";
          ocorrencia.statusImgUrl = "assets/img/app/todo/mypoint_correct16.png";

        } else if (apontamento.status.id == 1) {//Incompleto

          ocorrencia.statusCodeString = "INC";
          ocorrencia.statusString = "Apontamento Incompleto - solicitar ajuste";
          ocorrencia.statusImgUrl = "assets/img/app/todo/mypoint_incorrect16.png";

        } else if (apontamento.status.id == 2) { //Errado - não implementado


        } else if (apontamento.status.id == 3) { //Justificado - já foi corrigido

          ocorrencia.statusCodeString = "JUS";
          ocorrencia.statusString = "Apontamento Justificado - ajustado manualmente";
          ocorrencia.statusImgUrl = "assets/img/app/todo/mypoint_justified16.png";
        }
      }

      return ocorrencia;
    };

    function getSaldoPresente(apontamento) {

      var saldoDia = apontamento.infoTrabalho.trabalhados - apontamento.infoTrabalho.aTrabalhar;
      var sinalFlag = '-';
      var saldoFlag = false;

      if (saldoDia >= 0){
        saldoFlag = true;
        sinalFlag = '';
      }

      var saldoDiarioFormatado = converteParaHoraMinutoSeparados(Math.abs(saldoDia));

      var objBHDiario = {
        horasFtd: sinalFlag + saldoDiarioFormatado.hora + ':' + saldoDiarioFormatado.minuto,
        horasPosit: saldoFlag,
        horasNegat: !saldoFlag
      };

      return objBHDiario;
    };

    function converteParaHoraMinutoSeparados(totalMinutes) {
      
      var hours = Math.floor(totalMinutes/60);
      var minutes = totalMinutes % 60;

      var hoursStr = "";
      var minutesStr = "";

      hoursStr = (hours >= 0 && hours <= 9) ? "0"+hours : ""+hours;           
      minutesStr = (minutes >= 0 && minutes <= 9) ? "0"+minutes : ""+minutes;

      return {hora: hoursStr, minuto: minutesStr};
    };

    function setInfoAusencia(apontamento, currentDate){

      var saldoFlag = false;
      var sinalFlag = '-';
      var saldoDiarioFormatado = {};

      //pode não ter expediente iniciado, ser feriado, estar atrasado, de folga ou faltante mesmo
      var expedienteObj = updateAbsenceStatus($scope.funcionario.alocacao, currentDate);
      apontamento.ocorrencia.statusCodeString = expedienteObj.code;
      apontamento.ocorrencia.statusString = expedienteObj.string;
      apontamento.ocorrencia.statusImgUrl = expedienteObj.imgUrl;
      //console.log('expedienteObj returned: ', expedienteObj);

      if (expedienteObj.code == "FRD"){
        saldoFlag = true;
        sinalFlag = '';
        saldoDiarioFormatado = converteParaHoraMinutoSeparados(Math.abs(expedienteObj.saldoDia));
        apontamento.observacao = "Feriado";

      } else if (expedienteObj.code == "ENI") {

        saldoFlag = true;
        sinalFlag = '';
        saldoDiarioFormatado = {hora: '-', minuto: '-'};

      } else if (expedienteObj.code == "DSR") {

        saldoFlag = true;
        sinalFlag = '';
        saldoDiarioFormatado = {hora: '-', minuto: '-'};

      } else if (expedienteObj.code == "AUS") {
        
        saldoDiarioFormatado = converteParaHoraMinutoSeparados(Math.abs(expedienteObj.saldoDia));
        apontamento.observacao = "Falta";
      }

      apontamento.saldo = {
        horasFtd: sinalFlag + saldoDiarioFormatado.hora + ':' + saldoDiarioFormatado.minuto,
        horasPosit: saldoFlag,
        horasNegat: !saldoFlag
      };
    };

     /*
     * São 5 possíveis casos para ausência:
     * 1- Feriado
     * 2- ENI - Expediente Não Iniciado
     * 3- Folga solicitada e aceita / Licença
     * 4- DSR - Descanso Semanal Remunerado 
     * 5- Ausência de fato
    */
    function updateAbsenceStatus(funcionarioAlocacao, dataDesejada) {
      
      var codigoEscala = funcionarioAlocacao.turno.escala.codigo; 
      var ignoraFeriados =  funcionarioAlocacao.turno.ignoraFeriados;

      if (isFeriado(dataDesejada) && !ignoraFeriados){//Caso 1 - feriado
        
        return {code: "FRD", string: "Feriado!", imgUrl: "assets/img/app/todo/mypoint_correct16.png", saldoDia: 0};//getSaldoDiaFrd(funcionarioAlocacao)};

      } else if (hasFolgaSolicitada() || hasLicenca()){ //Caso 3 - Folgas/Licenças

        //console.log('Caso 3 - checar');

      } else { //Caso 2, 4 ou 5
        
        if (codigoEscala == 1) {
          return checkJornadaSemanal(funcionarioAlocacao, dataDesejada);
        }

        else if (codigoEscala == 2)
          return checkJornadaRevezamento(funcionarioAlocacao, dataDesejada);
      }
    };

    function isFeriado(dataDesejada) {
      
      var data = dataDesejada;

      console.log('Data Desejada: ', data);
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
              flagFeriado = checkFeriadoSchema(feriado);
              return feriado;
            }

          } else {//se não é fixo

            if ( (tempDate.getFullYear() === year) && (tempDate.getMonth() === month) && (tempDate.getDate() === date) ){
              console.log("É Feriado (variável)!", tempDate);
              flagFeriado = checkFeriadoSchema(feriado);
              return feriado;
            }
          }
        }
      });
      console.log('FlagFeriado: ', flagFeriado);
      return flagFeriado;//no futuro retornar o flag de Feriado e a descrição do mesmo!
    };

    function checkFeriadoSchema(feriado){

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

    function hasFolgaSolicitada() {

    };

    function hasLicenca() {

    };

    function checkJornadaSemanal(funcionarioAlocacao, dataDesejada) {

      var dataHoje = new Date();
      var dataAtual = dataDesejada;

      var jornadaArray = funcionarioAlocacao.turno.jornada.array; //para ambas as escalas
      console.log('Dentro de Jornada Semanal: funcionarioAlocacao', funcionarioAlocacao);
      var objDay = getDayInArrayJornadaSemanal(dataAtual.getDay(), jornadaArray);
      console.log('objDay', objDay);
      
      if (!objDay || !objDay.minutosTrabalho || objDay.minutosTrabalho <= 0) { //Caso 4 - DSR
        
        return {code: "DSR", string: "Descanso Semanal Remunerado", imgUrl: "assets/img/app/todo/bullet-grey-16.png"};

      } else { //Chegando aqui, só pode ser ENI ou Ausente de fato

        var codDate = compareOnlyDates(dataAtual, dataHoje);

        if (codDate === 0) { //é o próprio dia de hoje
          //////console.log("Olhando para o dia de hoje! Pode estar Ausente ou ENI");
          //HORA ATUAL é menor que ENT1 ? caso sim, sua jornada ainda não começou
          var totalMinutesAtual = converteParaMinutosTotais(dataHoje.getHours(), 
          dataHoje.getMinutes());
          var ENT1 = objDay.horarios.ent1;
          //console.log("Total de minutos da hora atual: ", totalMinutesAtual);
          //console.log("Entrada 1: ", ENT1);

          if (totalMinutesAtual < ENT1) {
          
            //////console.log("Ainda não iniciou o expediente");
            return {code: "ENI", string: "Expediente Não Iniciado", imgUrl: "assets/img/app/todo/bullet-blue.png"};

          } else {
            //////console.log("Já passou o tempo da batida dele , então está ausente, ainda não bateu!");
            return {code: "AUS", string: "Ausente", imgUrl: "assets/img/app/todo/mypoint_wrong16.png", saldoDia: objDay.minutosTrabalho};
          }

        } else if (codDate === -1) {//Navegando em dia passado 

          //////console.log("Navegando em dias anteriores e sem valor de apontamento, ou seja, faltante");
          return {code: "AUS", string: "Ausente", imgUrl: "assets/img/app/todo/mypoint_wrong16.png", saldoDia: objDay.minutosTrabalho};

        } else { //Navegando em dias futuros

          //////console.log("Navegando em dias futuros, expediente não iniciado!");
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
      var dataComparacao = dataDesejada;
      var dataHoje = new Date();

      console.log('dataComparacao: ', dataComparacao);
      var trabalha = isWorkingDay(dataComparacao, 
        new Date(funcionarioAlocacao.dataInicioEfetivo));
      
      if (trabalha && jornadaArray.length > 0) { //ele deveria ter trabalhado, ou é ENI ou AUSENCIA

        var ENT1 = jornadaArray[0].horarios.ent1;
        var codDate = compareOnlyDates(dataComparacao, dataHoje);

        if (codDate === 0) { //é o próprio dia de hoje
          //////console.log("Olhando para o dia de hoje! Pode estar Ausente ou ENI");
          //HORA ATUAL é menor que ENT1 ? caso sim, sua jornada ainda não começou
          var totalMinutesAtual = converteParaMinutosTotais(dataHoje.getHours(), 
          dataHoje.getMinutes());
          //////console.log("Total de minutos da hora atual: ", totalMinutesAtual);

          if (totalMinutesAtual < ENT1) {
          
            //////console.log("Ainda não iniciou o expediente");
            return {code: "ENI", string: "Expediente Não Iniciado", imgUrl: "assets/img/app/todo/bullet-blue.png"};

          } else {
            //////console.log("Já passou o tempo da batida dele , então está ausente, ainda não bateu!");
            return {code: "AUS", string: "Ausente", imgUrl: "assets/img/app/todo/mypoint_wrong16.png", saldoDia: funcionarioAlocacao.turno.jornada.minutosTrabalho};
          }
        } else if (codDate === -1) {//Navegando em dia passado 

          //////console.log("Navegando em dias anteriores e sem valor de apontamento, ou seja, faltante");
          return {code: "AUS", string: "Ausente", imgUrl: "assets/img/app/todo/mypoint_wrong16.png", saldoDia: funcionarioAlocacao.turno.jornada.minutosTrabalho};
        } else { //Navegando em dias futuros

          //////console.log("Navegando em dias futuros, expediente não iniciado!");
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
      ////console.log("DIA RETORNO NO getDayInArrayJornadaSemanal: ", diaRetorno);
      return diaRetorno;
    };

    function isWorkingDay(dateToCompare, dataInicioEfetivo) {

      var oneDay = 24*60*60*1000; // hours*minutes*seconds*milliseconds
      
      var d1 = angular.copy(dateToCompare); 
      var d2 = angular.copy(dataInicioEfetivo);
      d1.setHours(0,0,0,0);
      d2.setHours(0,0,0,0);

      var diffDays = Math.round(Math.abs((d1.getTime() - d2.getTime())/(oneDay)));
      //////console.log("diffDays: ", diffDays);
      
      return (diffDays % 2 == 0) ? true : false;
    };

    function converteParaHorasTotais(totalMinutos) {
      return (totalMinutos/60);
    };

    function converteParaMinutosTotais(hours, mins) {
      return (hours * 60) + mins;
    };

    function createTableApontamentos(arrayDatas, apontamentos){

      console.log('criar a tabble de apontamentos');

      $scope.periodoApontamento = arrayDatas;
    };

    function initGetEquipe(){

      employeeAPI.getEquipe($scope.funcionario._id).then(function successCallback(response){

        equipe = response.data;
        console.log("!@#EQUIPE OBTIDA DO FUNCIONARIO: ", equipe);

      }, function errorCallback(response){
        
        $scope.errorMsg = response.data.message;
      });
    };

    function initHeader() {

      var jornada;
      var escala = $scope.funcionario.alocacao.turno.escala;
      var dia = null;
      var itemHorario = {};
      var flagRepetido = false;
      var itemRepetido = null;

      if (escala && escala.codigo == 1) { //jornada semanal

        jornada = $scope.funcionario.alocacao.turno.jornada;
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
            for (var j=0; j<$scope.infoHorario.length; j++){
              if ($scope.infoHorario[j].horario == itemHorario.horario){
                flagRepetido = true;
                itemRepetido = $scope.infoHorario[j];
              }
            }
            if (!flagRepetido)
              $scope.infoHorario.push(itemHorario);
            else
              itemRepetido.dia = itemRepetido.dia.concat(",", itemHorario.dia);
          }
        }

      } else if (escala && escala.codigo == 2){

        jornada = $scope.funcionario.alocacao.turno.jornada;
        if (jornada.array.length == 1){
          if (jornada.array[0].horarios){
            itemHorario.dia = "Revezamento 12 x 36h (dia sim, dia não)";
            itemHorario.horario = jornada.array[0].horarioFtd.replace(/\//g, " às ");
            $scope.infoHorario.push(itemHorario);
          }
        }
      }
      
      $scope.infoHorario.sort(function (a, b) { //ordena para deixar os DSR por último
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
      for (var i=0; i<$scope.infoHorario.length; i++){
        
        arrayStrRep = $scope.infoHorario[i].dia.split(',');
        if (arrayStrRep.length == 2)
          $scope.infoHorario[i].dia = arrayStrRep[0].concat(" e ", arrayStrRep[1]);
        else if (arrayStrRep.length > 2)
          $scope.infoHorario[i].dia = arrayStrRep[0].concat(" à ", arrayStrRep[arrayStrRep.length-1]);        
      }
    };

    function initSearch(){
      
      var qtdeDiasAtras = -15;
      var dataCorrente = new Date();//CUIDADO COM TIMEZONE !!!
      var dataInicial = addOrSubtractDays(dataCorrente, qtdeDiasAtras);
      var dataAdmissao = new Date($scope.funcionario.alocacao.dataAdmissao);  
      $scope.periodo = {
        dataInicial: dataInicial,
        dataFinal: dataCorrente
      };

      //Data inicial não pode ser antes da data de admissão, nesse caso pega a data de admissão como período.dataInicial.
      if (compareOnlyDates(dataInicial, dataAdmissao) == -1)
        $scope.periodo.dataInicial = dataAdmissao;
      

      $scope.search($scope.periodo);      
    };

    function init() {
      
      initGetEquipe();
      initHeader();
      initSearch();

      console.log("infoHorario: " , $scope.infoHorario);
    };

    init();
  };

  function ModalBatidasDiaCtrl($uibModalInstance, $scope, objBatidasDiaria){
    
    console.log('objBatidasDiaria: ', objBatidasDiaria);
    $scope.objBatidasDiaria = objBatidasDiaria;

  };

  function ModalSolicitacoesCtrl($uibModalInstance, $scope, $state, objBatidasDiaria){
    
    console.log('objBatidasDiaria: ', objBatidasDiaria);
    $scope.objBatidasDiaria = objBatidasDiaria;

    var objAjusteParams = {
      date: objBatidasDiaria.dateWorker.date,
      usuario: objBatidasDiaria.dateWorker.usuario
      // arrayES: objBatidasDiaria.array
    };

    $scope.ajuste = function() {

      console.log('solicitou ajuste de ponto, obj enviado: ', objAjusteParams);
      $state.go('adjustsolicitation', 
        {
          userId: objAjusteParams.usuario._id, 
          year: objAjusteParams.date.year,
          month: objAjusteParams.date.month,
          day: objAjusteParams.date.day
        });
      $uibModalInstance.dismiss();
    };

    $scope.abono = function(){

      console.log('soliciou abono');
    };

  };

})();
