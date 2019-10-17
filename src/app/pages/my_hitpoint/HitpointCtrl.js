/**
 * @author Gilliard Lopes
 * created on 26/04/2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.myhitpoint')
      .controller('HitpointCtrl', HitpointCtrl)
      .controller('ModalBatidasDiaCtrl', ModalBatidasDiaCtrl)
      .controller('ModalSolicitacoesCtrl', ModalSolicitacoesCtrl)
      .controller('ModalHistEmployeeCtrl', ModalHistEmployeeCtrl);

  /** @ngInject */
  function HitpointCtrl($scope, $filter, $state, $uibModal, appointmentAPI, myhitpointAPI, employeeAPI, Auth, usuario, currentDate, feriados, util, utilBancoHoras) {

    $scope.smartTablePageSize = 15;
    var Usuario = usuario.data;
    $scope.funcionario = usuario.data.funcionario;
    $scope.currentDate = currentDate.data.date;
    $scope.currentDateFtd = $filter('date')($scope.currentDate, 'dd/MM/yyyy');
    $scope.funcionario.alocacao.dataAdmissaoFtd = $filter('date')($scope.funcionario.alocacao.dataAdmissao, 'fullDate');
    $scope.periodo = {};
    var ferias = $scope.funcionario.ferias;
    var feriados = feriados.data;
    var pagePath = 'app/pages/my_hitpoint/modals/batidasDiaModal.html'; //representa o local que vai estar o html de conteúdo da modal
    var pageSolicitarPath = 'app/pages/my_hitpoint/modals/solicitacoesModal.html';
    var pageHistoricoPath = 'app/pages/my_hitpoint/modals/historicoAppoint.html';
    var defaultSize = 'md'; //representa o tamanho da Modal


    $scope.periodoApontamento = [];

    //setHorarioInfo no INIT
    $scope.infoHorario = [];
    var equipe = {};

    $scope.search = function(periodo) {
      
      $scope.errorMsg = null;
      var dataAdmissao = new Date($scope.funcionario.alocacao.dataAdmissao);
      var dataIni = new Date(checkFormatDatesUiDateDirective(periodo.dataInicial));
      var dataFim = new Date(checkFormatDatesUiDateDirective(periodo.dataFinal));

      //se a data inicial da pesquisa for antes da data de admissão: não pode!
      if (util.compareOnlyDates(dataIni, dataAdmissao) == -1 || util.compareOnlyDates(dataFim, dataAdmissao) == -1) {
        $scope.errorMsg = "data inicial ou final devem vir após a data de admissão do colaborador";
        return $scope.errorMsg;
      }
      if (util.compareOnlyDates(new Date(), dataIni) == -1 || util.compareOnlyDates(new Date(), dataFim) == -1){
        $scope.errorMsg = "data inicial ou final não podem ser maiores que a data corrente";
        return $scope.errorMsg;
      }
      if (util.compareOnlyDates(dataIni, dataFim) == 1){
        $scope.errorMsg = "data final deve ser maior que a data inicial.";
        return $scope.errorMsg;
      }
      getApontamentosByDateRangeAndEquipe(dataIni, dataFim, $scope.funcionario);
    };

    function checkFormatDatesUiDateDirective(date){

      //console.log(typeof date);
      if (typeof date == "string"){
        //console.log('É uma String!', date);
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

    $scope.historico = function (itemApontamento){

      openHistorico(pageHistoricoPath, 'lg', itemApontamento);
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
        //console.log('modal is dismissed or close.');
      });
    };

    function openSolicitacoes (page, size, data, arrayEntSai) {

      var dateAux = new Date(data);
      var endDateAux = util.addOrSubtractDays(dateAux, 1);

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
        //console.log('modal is dismissed or close.');
      });
    };

    function openHistorico (page, size, itemApontamento) {

      var modalInstance = $uibModal.open({
        animation: true,
        templateUrl: page,
        size: size,
        controller: 'ModalHistEmployeeCtrl',
        resolve: {
          itemApontamento: function () {
            return itemApontamento;
          }
        }
      });

      modalInstance.result.then(function (){
        
      }, function () {
        //console.log('modal is dismissed or close.');
      });
    };

    /*
     *
     * Solicita ao servidor um objeto com os apontamentos dos componentes da equipe (apenas 1 componente nesse caso)
     *
    **/
    function getApontamentosByDateRangeAndEquipe(beginDate, endDate, funcionario) {

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
      //console.log("objDateWorker Enviado: ", objDateWorker);

      //busca apenas as solicitações pendentes junto com os apontamentos
      myhitpointAPI.getAllByEmployee(objDateWorker).then(function successCallback(response){

        var apontamentosResponse = response.data.apontamentos;
        var solicitacoesResponse = response.data.solicitacoes;
        console.log("!@# Recebidos do servidor: ", response.data);
        $scope.periodoApontamento = createArrayRangeDate(dateAux, endDateAux, 1, apontamentosResponse, solicitacoesResponse);

      }, function errorCallback(response){
        
        $scope.errorMsg = response.data.message;
      });     
    };

    function createArrayRangeDate (startDate, endDate, interval, apontamentosSemanais, solicitacoes) {
      
      var interval = interval || 1;
      var retVal = [];
      var current = new Date(startDate);
      var endDate = new Date(endDate);
      var itemApontamento = {};
      var i = 0;
      var apontamentoF = null;
      var solicitationF = null;
      var objEntradasSaidas = {};
      
      while (current <= endDate) {

        itemApontamento = {};
        objEntradasSaidas = {};
        apontamentoF = utilBancoHoras.getApontamentoFromSpecificDate(apontamentosSemanais, current);
        solicitationF = getSolicitationFromSpecificDate(solicitacoes, current);
        //console.log('currentDate: ', current);
        //console.log('apontamento? ', apontamentoF);
        //console.log('solicitation? ', solicitationF);
        itemApontamento.order = i;
        itemApontamento.rawDate = new Date(current);
        itemApontamento.data = $filter('date')(new Date(current), 'abvFullDate2');

        if (apontamentoF){
          
          objEntradasSaidas = util.getEntradasSaidas(apontamentoF);
          itemApontamento.entradaSaidaFinal = objEntradasSaidas.esFinal;
          itemApontamento.arrayEntSai = objEntradasSaidas.arrayEntSai;
          itemApontamento.ocorrencia = getOcorrenciaStatus(apontamentoF, current);
          itemApontamento.saldo = utilBancoHoras.getSaldoPresente(apontamentoF);
          itemApontamento.historico = apontamentoF.historico;

          if(itemApontamento.ocorrencia.observacao) 
            itemApontamento.observacao = itemApontamento.ocorrencia.observacao;

        } else {

          itemApontamento.entradaSaidaFinal = "-";
          itemApontamento.arrayEntSai = [];
          itemApontamento.ocorrencia = {};
          itemApontamento.saldo = {};
          //setInfoAusencia(itemApontamento, current); //injeta as informações de ausencia no apontamento
          utilBancoHoras.setInfoAusencia(itemApontamento, current, $scope.funcionario, feriados, equipe);
        }

        if (solicitationF) {

          itemApontamento.ocorrencia = updateOcorrenciaStatus(solicitationF, itemApontamento);
        }

        //console.log('itemApontamento depois: ', itemApontamento);
        retVal.push(itemApontamento);
        current = util.addOrSubtractDays(current, interval);
        i++;
      }

      ////console.log('rangeDate calculado:', retVal);
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
      ////console.log('rangeDate calculado e ordenado decresc:', retVal);
      return retVal;  
    };

    function getSolicitationFromSpecificDate(solicitacoes, dataAtual){

      var solicitationByDate = null;

      for (var i=0; i<solicitacoes.length; i++){

        if (util.compareOnlyDates(dataAtual, new Date(solicitacoes[i].data)) == 0) {

          solicitationByDate = solicitacoes[i];
        }
      }

      return solicitationByDate;
    };
    
    function getOcorrenciaStatus(apontamento, dataDesejada){

      var ocorrencia = {};

      var codDate = util.compareOnlyDates(dataDesejada, new Date()); ///CUIDADO COM TIMEZONE!!!!

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
          ocorrencia.observacao = "Ponto Justificado Manualmente";

        } else if (apontamento.status.id == 4) {

          ocorrencia.statusCodeString = "ABO";
          ocorrencia.statusString = "Abonado";
          ocorrencia.statusImgUrl = "assets/img/app/todo/watch-16px.png";
          ocorrencia.observacao = "Ponto Abonado";

        } else if (apontamento.status.id == 5) {

          ocorrencia.statusCodeString = "FOL";
          ocorrencia.statusString = "Folga Compensatoria";
          ocorrencia.statusImgUrl = "assets/img/app/todo/mypoint_justified16.png";
          ocorrencia.observacao = "Falta Justificada";
        }
      }

      return ocorrencia;
    };

    function updateOcorrenciaStatus(solicitacao, apontamento){
      
      var ocorrencia = {};

      //Ajuste é TIPO = 0
      if (solicitacao.tipo === 0){

        //ocorrencia.statusCodeString = "COR";
        ocorrencia.statusString = "AJU PEN";
        ocorrencia.statusImgUrl = "assets/img/app/todo/asterisk_16.png";
        apontamento.observacao += " (possui AJUSTE pendente)*";

      } else if (solicitacao.tipo === 1) {

        ocorrencia.statusString = "ABO PEN";
        ocorrencia.statusImgUrl = "assets/img/app/todo/asterisk_16.png";
        apontamento.observacao += " (possui ABONO pendente)*";
      }
      return ocorrencia;
    };

    function createTableApontamentos(arrayDatas, apontamentos){

      //console.log('criar a tabble de apontamentos');

      $scope.periodoApontamento = arrayDatas;
    };

    function initGetEquipe(){

      employeeAPI.getEquipe($scope.funcionario._id).then(function successCallback(response){

        $scope.noTeamMsg = null;
        equipe = response.data;
        //console.log("!@#EQUIPE OBTIDA DO FUNCIONARIO: ", equipe);
        if (!equipe){
          $scope.noTeamMsg = "Você não está associado(a) a nenhuma EQUIPE no sistema e consequentemente não é possível calcular seus batimentos. Verifique junto ao seu fiscal/gestor a sua associação a uma EQUIPE.";
          return $scope.noTeamMsg;
        } else {

          initSearch();
        }

      }, function errorCallback(response){
        
        $scope.errorMsg = response.data.message;
      });
    };

    function initHeader() {

      // var jornada;
      // var escala = $scope.funcionario.alocacao.turno.escala;
      // var dia = null;
      // var itemHorario = {};
      // var flagRepetido = false;
      // var itemRepetido = null;

      // if (escala && escala.codigo == 1) { //jornada semanal

      //   jornada = $scope.funcionario.alocacao.turno.jornada;
      //   if (jornada && jornada.array){
      //     jornada.array.sort(function (a, b) { //ordena por segurança
      //       if (a.dia > b.dia) {
      //         return 1;
      //       }
      //       if (a.dia < b.dia) {
      //         return -1;
      //       }
      //       // a must be equal to b
      //       return 0;
      //     });
      //     for (var i=0; i<jornada.array.length; i++){
      //       itemHorario = {};
      //       flagRepetido = false;
      //       dia = jornada.array[i].dia;
      //       itemHorario.dia = weekFullDays[dia];
      //       if (!jornada.array[i].horarios){
      //         itemHorario.horario = "Descanso Semanal Remunerado";
      //       }
      //       else {
      //         itemHorario.horario = jornada.array[i].horarioFtd.replace(/\//g, " às ");
      //       }
      //       for (var j=0; j<$scope.infoHorario.length; j++){
      //         if ($scope.infoHorario[j].horario == itemHorario.horario){
      //           flagRepetido = true;
      //           itemRepetido = $scope.infoHorario[j];
      //         }
      //       }
      //       if (!flagRepetido)
      //         $scope.infoHorario.push(itemHorario);
      //       else
      //         itemRepetido.dia = itemRepetido.dia.concat(",", itemHorario.dia);
      //     }
      //   }

      // } else if (escala && escala.codigo == 2){

      //   jornada = $scope.funcionario.alocacao.turno.jornada;
      //   if (jornada.array.length == 1){
      //     if (jornada.array[0].horarios){
      //       itemHorario.dia = "Revezamento 12 x 36h (dia sim, dia não)";
      //       itemHorario.horario = jornada.array[0].horarioFtd.replace(/\//g, " às ");
      //       $scope.infoHorario.push(itemHorario);
      //     }
      //   }
      // }
      
      // $scope.infoHorario.sort(function (a, b) { //ordena para deixar os DSR por último
      // if (a.horario.includes("Descanso")) {
      //     return 1;
      //   }
      //   else {
      //     return -1;
      //   }
      //   // a must be equal to b
      //   return 0;
      // });

      // //condensar linhas com mesmo horário
      // var arrayStrRep = null;
      // for (var i=0; i<$scope.infoHorario.length; i++){
        
      //   arrayStrRep = $scope.infoHorario[i].dia.split(',');
      //   if (arrayStrRep.length == 2)
      //     $scope.infoHorario[i].dia = arrayStrRep[0].concat(" e ", arrayStrRep[1]);
      //   else if (arrayStrRep.length > 2)
      //     $scope.infoHorario[i].dia = arrayStrRep[0].concat(" à ", arrayStrRep[arrayStrRep.length-1]);        
      // }
      $scope.infoHorario = util.getInfoHorario($scope.funcionario, []);
    };

    function initSearch(){
      
      var qtdeDiasAtras = -14;
      var dataCorrente = new Date();//CUIDADO COM TIMEZONE !!!
      var dataInicial = util.addOrSubtractDays(dataCorrente, qtdeDiasAtras);
      var dataAdmissao = new Date($scope.funcionario.alocacao.dataAdmissao);  
      $scope.periodo = {
        dataInicial: dataInicial,
        dataFinal: dataCorrente
      };

      //Data inicial não pode ser antes da data de admissão, nesse caso pega a data de admissão como período.dataInicial.
      if (util.compareOnlyDates(dataInicial, dataAdmissao) == -1)
        $scope.periodo.dataInicial = dataAdmissao;
      

      $scope.search($scope.periodo);      
    };

    function init() {
      
      initHeader();
      initGetEquipe(); //dentro de get equipe -> initSearch();

      //console.log("infoHorario: " , $scope.infoHorario);
    };

    init();
  };

  function ModalBatidasDiaCtrl($uibModalInstance, $scope, objBatidasDiaria){
    
    //console.log('objBatidasDiaria: ', objBatidasDiaria);
    $scope.objBatidasDiaria = objBatidasDiaria;

  };

  function ModalSolicitacoesCtrl($uibModalInstance, $scope, $state, objBatidasDiaria){
    
    //console.log('objBatidasDiaria: ', objBatidasDiaria);
    $scope.objBatidasDiaria = objBatidasDiaria;

    var objAjusteParams = {
      date: objBatidasDiaria.dateWorker.date,
      usuario: objBatidasDiaria.dateWorker.usuario
      // arrayES: objBatidasDiaria.array
    };

    $scope.ajuste = function() {

      //console.log('solicitou ajuste de ponto, obj enviado: ', objAjusteParams);
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

      //console.log('soliciou abono');
      $state.go('abono', 
        {
          userId: objAjusteParams.usuario._id, 
          year: objAjusteParams.date.year,
          month: objAjusteParams.date.month,
          day: objAjusteParams.date.day
        });
      $uibModalInstance.dismiss();
    };

  };

  function ModalHistEmployeeCtrl($uibModalInstance, $scope, itemApontamento){
    
    $scope.apontamento = itemApontamento;    

  };

})();
