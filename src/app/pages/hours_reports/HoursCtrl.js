/**
 * @author Gilliard Lopes
 * created on 04/12/2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.hours')
      .controller('HoursCtrl', HoursCtrl);

  /** @ngInject */
  function HoursCtrl($scope, $filter, $location, $state, $interval, $timeout, appointmentAPI, teamAPI, employeeAPI, Auth, util, utilBancoHoras, utilReports, usuario, feriados, currentDate, allEmployees, allEquipes) {

    var Usuario = usuario.data;
    var feriados = feriados.data;
    var _selected;
    var equipe = {};
    var funcSel = {};
    var dataMaxBusca = util.addOrSubtractDays(new Date(currentDate.data.date), -1); //dia anterior
    var lastAllSearch = {};

    $scope.gestor = null;
    $scope.isGestorGeral = false;
    $scope.isAdmin = false;
    $scope.espelhoPonto = true;
    $scope.bancoHoras = false;
    $scope.filtroPonto = false;    

    $scope.obsActive = false;
    $scope.obsMessage = "";
    $scope.funcionario = {};
    $scope.funcionarioOficial = {};
    $scope.employees = [];
    $scope.employeesNames = []; //Auxiliar para o AutoComplete do Input do nome do funcionario
    $scope.meses = [];
    $scope.anos = [];
    $scope.periodoApontamento = [];
    $scope.periodoSelecionadoFtd = "Data inicial (selecionar) até data final (selecionar)";//$filter('date')($scope.currentDate, 'abvFullDate');
    $scope.checkboxModel = {
      equipe: false,
      funcionario: true
    };
    $scope.checkboxFirstDate = {
      dataIniEfetivo: false,
      dataBatidaSistema: true
    };
    $scope.textoBotao = "Visualizar";

    //INÍCIO DO DATEPICKER
    $scope.datepic = {
      dt: $scope.currentDate
    };

    //parte do datePicker
    $scope.datepic2 = {
      dt: $scope.currentDate2
    };

    $scope.options = {
      //minDate: $scope.datepic.dt,
      showWeeks: true
    };
    $scope.open = open;
    $scope.open2 = open2;
    $scope.something = {
      opened: false
    };    
    $scope.something2 = {
      opened: false
    };    
    $scope.formats = ['dd-MMMM-yyyy', 'dd/MM/yyyy', 'dd.MM.yyyy', 'fullDate'];
    $scope.format = $scope.formats[1];
    function open() {
      ////console.log("open function", $scope.something.opened);
      $scope.something.opened = true;
    }
    function open2() {
      ////console.log("open function", $scope.something.opened);
      $scope.something2.opened = true;
    }
    $scope.changeDate = function(date) {
      //console.log('#changeDate');
      $scope.dataErrorMsg = null;
      if (util.compareOnlyDates(date, dataMaxBusca) == 1){
        $scope.datepic.dt = new Date($scope.currentDate);
        $scope.dataErrorMsg = "Você só pode solicitar ajustes de: "+$filter('date')(dataMaxBusca, 'abvFullDate')+" para trás.";
        $timeout(hideDataError, 8000);
        return $scope.dataErrorMsg;
      }
      $scope.currentDate = new Date(date);      
      $scope.currentDateFtd = $filter('date')($scope.currentDate, 'abvFullDate');
      $scope.periodoSelecionadoFtd = $scope.currentDateFtd + " até ";
      if ($scope.currentDate2){
        $scope.periodoSelecionadoFtd += $scope.currentDateFtd2;
      } else {
        $scope.periodoSelecionadoFtd += "data final (selecionar)";
      }
      checkDates();
      //visualizar(date);            
    };

    function checkDates(){
      
      var dataAdmissao = new Date($scope.funcionarioOficial.alocacao.dataAdmissao);  
      
      if ($scope.currentDate){
        //se a data inicial da pesquisa for antes da data de admissão: não pode!
        if (util.compareOnlyDates($scope.currentDate, dataAdmissao) == -1) {        
          $scope.datepic.dt = new Date(dataAdmissao);
          $scope.dataErrorMsg = "Data Inicial deve ser igual ou maior que a data de admissão do colaborador: "+$filter('date')(dataAdmissao, 'dd/MM/yyyy');
          $scope.currentDate = new Date(dataAdmissao);
          $scope.currentDateFtd = $filter('date')($scope.currentDate, 'abvFullDate');
          $scope.periodoSelecionadoFtd = $scope.currentDateFtd + " até ";
          if ($scope.currentDate2){
            $scope.periodoSelecionadoFtd += $scope.currentDateFtd2;
          } else {
            $scope.periodoSelecionadoFtd += "data final (selecionar)";
          }
          $timeout(hideDataError, 8000);
          //return $scope.dataErrorMsg;
        }
      }
      if ($scope.currentDate2){

        if (!$scope.funcionarioOficial.active){
          console.log("Caso de funcionario demitido...", $scope.funcionarioOficial);
          if ($scope.funcionarioOficial.historico)
            if ($scope.funcionarioOficial.historico.datasDemissao)
              if($scope.funcionarioOficial.historico.datasDemissao.length > 0){
                var dataDemissao = new Date($scope.funcionarioOficial.historico.datasDemissao[0]);
                if (util.compareOnlyDates(dataDemissao, $scope.currentDate2) == -1) {
                  $scope.datepic2.dt = new Date(dataDemissao);
                  $scope.dataErrorMsg = "A data final deve ser igual ou menor que a data de demissão do colaborador: "+$filter('date')(dataDemissao, 'dd/MM/yyyy');
                  $scope.currentDate2 = new Date(dataDemissao);
                  $scope.currentDateFtd2 = $filter('date')($scope.currentDate2, 'abvFullDate');
                  if ($scope.currentDate){
                    $scope.periodoSelecionadoFtd = $scope.currentDateFtd + " até " + $scope.currentDateFtd2;
                  } else {
                    $scope.periodoSelecionadoFtd = "Data inicial (selecionar) até " + $scope.currentDateFtd2;
                  }
                  $timeout(hideDataError, 8000);
                  //return $scope.dataErrorMsg;
                }   
              }
        }
      }
      
    };

    $scope.changeDate2 = function(date) {
      //console.log('#changeDate2');
      $scope.dataErrorMsg = null;
      if (util.compareOnlyDates(date, dataMaxBusca) == 1){
        $scope.datepic2.dt = new Date($scope.currentDate);
        $scope.dataErrorMsg = "Você só pode solicitar ajustes de: "+$filter('date')(dataMaxBusca, 'abvFullDate')+" para trás.";
        $timeout(hideDataError, 8000);
        return $scope.dataErrorMsg;
      }

      if (!$scope.currentDate){
        //$scope.datepic2.dt = new Date();
        $scope.dataErrorMsg = "A data inicial deve ser preenchida primeiro.";
        $timeout(hideDataError, 8000);
        return $scope.dataErrorMsg;
      }

      if (util.compareOnlyDates(date, $scope.currentDate) == -1){
        $scope.datepic2.dt = new Date();
        $scope.dataErrorMsg = "A data final deve ser maior que a data inicial.";
        $timeout(hideDataError, 8000);
        return $scope.dataErrorMsg;
      }
      $scope.currentDate2 = new Date(date);
      $scope.currentDateFtd2 = $filter('date')($scope.currentDate2, 'abvFullDate');
      if ($scope.currentDate){
        $scope.periodoSelecionadoFtd = $scope.currentDateFtd + " até " + $scope.currentDateFtd2;
      } else {
        $scope.periodoSelecionadoFtd = "Data inicial (selecionar) até " + $scope.currentDateFtd2;
      }
      checkDates();
      //visualizar($scope.currentDate, date);
    };

    function hideDataError(seconds){
      $scope.dataErrorMsg = null;
    };    
    //Fim do datePicker

    function hideDataError2(seconds){
      $scope.dataErrorMsg2 = null;
    };
    //Fim do DatePicker    
    
    $scope.showEspelhoPonto = function () {
      $scope.bancoHoras = false;
      $scope.espelhoPonto = true;
      //////////console.log("mostrar espelho de ponto");
    }

    $scope.showBancoHoras = function () {
      $scope.espelhoPonto = false;
      $scope.bancoHoras = true;
      //////////console.log("mostrar banco de horas");
    }  

    $scope.clickEmployeeCB = function(){
      ////console.log('clicou employee', $scope.checkboxModel.funcionario);
      if ($scope.checkboxModel.funcionario){
          $scope.checkboxModel.equipe = false;
          $scope.textoBotao = "Visualizar";
      } else {
        $scope.checkboxModel.equipe = true;
        $scope.textoBotao = "Salvar Relatório de Equipe em PDF";
      }
    };

    $scope.clickTeamCB = function(){
      ////console.log('clicou equipe', $scope.checkboxModel.equipe);
      if($scope.checkboxModel.equipe){
        $scope.checkboxModel.funcionario = false;
        $scope.textoBotao = "Salvar Relatório de Equipe em PDF";
      } else {
        $scope.checkboxModel.funcionario = true;
        $scope.textoBotao = "Visualizar";
      }
    };

    $scope.clickDataIniEfetivoCB = function(){
      ////console.log('clicou employee', $scope.checkboxModel.funcionario);
      if ($scope.checkboxFirstDate.dataIniEfetivo){
          $scope.checkboxFirstDate.dataBatidaSistema = false;
          //firstDateToUse = funcSel.alocacao.dataInicioEfetivo;          
      } else {
        $scope.checkboxFirstDate.dataBatidaSistema = true;
      }
    };

    $scope.clickDataPrimBatidaCB = function(){
      ////console.log('clicou equipe', $scope.checkboxModel.equipe);
      if ($scope.checkboxFirstDate.dataBatidaSistema){
          $scope.checkboxFirstDate.dataIniEfetivo = false;
          //firstDateToUse = funcSel.alocacao.dataInicioEfetivo;          
      } else {
        $scope.checkboxFirstDate.dataIniEfetivo = true;
      }
    };

    $scope.changeFunc = function(funcSel){
      
      console.log("funcSel: ", funcSel);
      $scope.funcionarioOficial = $scope.equipes[funcSel.indiceEq].componentes[funcSel.indiceComp];
      $scope.funcionarioOficial.equipe = angular.copy(funcSel.equipe);
      //console.log("funcionario ferias do INIT: ", $scope.funcionarioOficial);
      if ($scope.funcionarioOficial.ferias){

        for (var i=0; i<$scope.funcionarioOficial.ferias.length; i++){
          $scope.funcionarioOficial.ferias[i].dataIniFtd = new Date($scope.funcionarioOficial.ferias[i].periodo.anoInicial, 
            $scope.funcionarioOficial.ferias[i].periodo.mesInicial-1, $scope.funcionarioOficial.ferias[i].periodo.dataInicial, 0, 0, 0, 0);
          $scope.funcionarioOficial.ferias[i].dataFinFtd = new Date($scope.funcionarioOficial.ferias[i].periodo.anoFinal, 
            $scope.funcionarioOficial.ferias[i].periodo.mesFinal-1, $scope.funcionarioOficial.ferias[i].periodo.dataFinal, 0, 0, 0, 0);
        }
      }
      $scope.infoHorario = util.getInfoHorario($scope.funcionarioOficial, []);      
      checkDates();
    };

    $scope.isEmptyFunc = function(){
      
      ////console.log('is Empty func?');
      if (!$scope.funcionario.selected || $scope.funcionario.selected == ""){
        $scope.infoHorario = "";
        return true;
      }
      return false;
    };

    $scope.search = function () {
      $scope.obsActive = false;
      $scope.obsMessage = "";
      if ($scope.checkboxModel.funcionario){

        if (!$scope.funcionario.selected){
        
          alert('Por favor, preencha o campo com o nome do funcionário.');

        } else {

          funcSel = util.searchEmployee($scope.funcionario.selected.id, $scope.employees);
          $scope.infoHorario = [];
          $scope.infoHorario = util.getInfoHorario(funcSel, []);
          equipe = funcSel.equipe;
          // //console.log('funcionario AutoComplete: ', $scope.funcionario.selected);
          console.log('funcionario pego: ', funcSel);

          var dataAdmissao = new Date(funcSel.alocacao.dataAdmissao);
          var dataInicial = $scope.currentDate;//new Date(ano.value, mes._id, 1);
          var dataFinal = $scope.currentDate2;//new Date(ano.value, mes._id+1, 1);//primeiro dia do mês posterior

          //se a data inicial da pesquisa for antes da data de admissão: não pode!
          if (util.compareOnlyDates(dataInicial, dataAdmissao) == -1) {
            dataInicial = angular.copy(dataAdmissao);
            $scope.currentDate = new Date(dataInicial);
            $scope.currentDateFtd = $filter('date')($scope.currentDate, 'abvFullDate');
            $scope.obsMessage = "A data inicial era anterior a data de admissão (" + dataAdmissao + ") por conta disso esta ultima foi utilizada como data inicial na busca.";
            $scope.obsActive = true;
          }
          if (util.compareOnlyDates(dataFinal, dataAdmissao) == -1) {
            return alert("A data final deve ser maior que a data de admissão.");
          }
          if (util.compareOnlyDates(new Date(), dataInicial) == -1 || util.compareOnlyDates(new Date(), dataFinal) == -1){
            return alert ("data inicial ou final não podem ser maiores que a data corrente");            
          }
          if (util.compareOnlyDates(dataInicial, dataFinal) == 1){
            return alert("data final deve ser maior que a data inicial.");            
          }
          if (!funcSel.active){
            console.log("Caso de funcionario demitido...");
            if ($scope.funcionarioOficial.historico)
              if ($scope.funcionarioOficial.historico.datasDemissao)
                if(funcSel.historico.datasDemissao.length > 0){
                  var dataDemissao = new Date(funcSel.historico.datasDemissao[0]);
                  if (util.compareOnlyDates(dataDemissao, dataFinal) == -1) {
                    dataFinal = angular.copy(dataDemissao);
                    $scope.currentDate2 = new Date(dataFinal);
                    $scope.currentDateFtd2 = $filter('date')($scope.currentDate2, 'abvFullDate');
                    $scope.obsMessage = "A data final era posterior a data de demissão (" + dataDemissao + ") por conta disso esta ultima foi utilizada como data final na busca.";
                    $scope.obsActive = true;
                  }   
                }
          }

          getApontamentosByDateRangeAndEquipe(dataInicial, dataFinal, funcSel);          
        }

      } 

      if ($scope.checkboxModel.equipe) {

        ////console.log('Selected Equipe: ', $scope.selectedEquipe.item);
        //vou ter que calcular os totais para cada employee da equipe e depois gerar o PDF para concatenar num documento so
      }      
      
    };

    $scope.searchAll = function(){     
      
      if (!$scope.funcionario.selected){
        
          alert('Por favor, preencha o campo com o nome do funcionário.');

        } else {

          getAllApontamentos($scope.funcionarioOficial);
        }
      
    };

    $scope.gerarPDFAll = function(){

    };

    $scope.gerarPDFLimitado = function(){

      //console.log("FuncSel: ", funcSel);
      var cDate1Ftd = $filter('date')($scope.currentDate, 'dd/MM/yyyy');
      var cDate2Ftd = $filter('date')($scope.currentDate2, 'dd/MM/yyyy');
      var periodoStr = 'Período Selecionado: ' + cDate1Ftd + ' até ' + cDate2Ftd;
      var totais = {
        aTrabalhar: $scope.minutosParaTrabalharFtd,
        trabalhados: $scope.minutosTrabalhadosFtd,
        saldoFinal: $scope.saldoFinalMesFtd
      };

      var docDefinition = utilReports.gerarBancoHoras($scope.funcionario.selected, periodoStr, totais);
      
      //console.log('Funcionario selecionado para relatorio: ', $scope.funcionario.selected);

      docDefinition.footer = function(currentPage, pageCount) { 
        return { 
          text: currentPage.toString() + ' de ' + pageCount, 
          alignment: 'right', 
          margin: [20, 0] 
        }; 
      };

      //var name = funcSel.nome + ' ' + funcSel.sobrenome;
      var strPDFName = $scope.funcionario.selected.name + '-' + $scope.funcionario.selected.matricula + '-banco_horas.pdf';

      // download the PDF
      pdfMake.createPdf(docDefinition).download(strPDFName);

    };

    $scope.gerarPDFPeriodo = function(){
     
      var periodoStr = 'Período Selecionado: ' + $scope.allDataInicial + ' até ' + $scope.allDataFinal;
      var totais = {
        aTrabalhar: $scope.allMinutosParaTrabalharFtd,
        trabalhados: $scope.allMinutosTrabalhadosFtd,
        saldoFinal: $scope.allSaldoFinalMesFtd
      };

      var docDefinition = utilReports.gerarBancoHoras($scope.funcionario.selected, periodoStr, totais);
      console.log("docDefinition: ", docDefinition);
      //console.log('Funcionario selecionado para relatorio: ', $scope.funcionario.selected);

      docDefinition.footer = function(currentPage, pageCount) { 
        return { 
          text: currentPage.toString() + ' de ' + pageCount, 
          alignment: 'right', 
          margin: [20, 0] 
        }; 
      };

      var strPDFName = $scope.funcionario.selected.name + '-' + $scope.funcionario.selected.matricula + '-banco_horas.pdf';

      // download the PDF
      pdfMake.createPdf(docDefinition).download(strPDFName);
    };    



    /*     
     * Solicita ao servidor um objeto com os apontamentos dos componentes da equipe (apenas 1 componente nesse caso)     
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
      $scope.periodoApontamento = [];

      appointmentAPI.getApontamentosByDateRangeAndFuncionario(objDateWorker).then(function successCallback(response){

        var apontamentosResponse = response.data;
        //console.log("!@# Apontamentos do funcionário: ", apontamentosResponse);
        //$scope.periodoApontamento = calcularBancoHoras(dateAux, endDateAux, 1, apontamentosResponse, funcionario);
        var objRetornoCalculo = calcularBancoHoras(dateAux, endDateAux, 1, apontamentosResponse, funcionario);

        $scope.periodoApontamento = objRetornoCalculo.arrayItemApontamentos;
        $scope.diasTrabalho = objRetornoCalculo.diasTrabalho;
        $scope.diasParaTrabalhar = objRetornoCalculo.diasParaTrabalhar;
        $scope.minutosTrabalhadosFtd = objRetornoCalculo.minutosTrabalhadosFtd;
        $scope.minutosParaTrabalharFtd = objRetornoCalculo.minutosParaTrabalharFtd;
        $scope.saldoFinalPositivoFtd = objRetornoCalculo.saldoFinalPositivoFtd;
        $scope.saldoFinalNegativoFtd = objRetornoCalculo.saldoFinalNegativoFtd;
        $scope.saldoFinalMesPos = objRetornoCalculo.saldoFinalMesPos;
        $scope.saldoFinalMesNeg = objRetornoCalculo.saldoFinalMesNeg;
        $scope.saldoFinalMesFtd = objRetornoCalculo.saldoFinalMesFtd;

      }, function errorCallback(response){
        
        $scope.errorMsg = response.data.message;
      });
    };

    function getAllApontamentos (funcionario){

      $scope.allApontamentos = [];

      appointmentAPI.getAllByFunc(funcionario).then(function successCallback(response){

        var appResponse = response.data;
        //console.log("!@# Apontamentos do funcionário: ", appResponse);
        if(appResponse.length > 0){
          //console.log("Data do primeiro apontamento: ", appResponse[0].data)
          //a data inicial vai ser a data do primeiro apontamento.
          //a data final vai ser a data corrente se o funcionario estiver ativo e a data de demissao se for inativo.
          var dateAux = new Date(appResponse[0].data);
          var endDateAux = angular.copy(dataMaxBusca);
          if (!funcionario.active){
            if (funcionario.historico){
              if (funcionario.historico.datasDemissao){
                if (funcionario.historico.datasDemissao.length > 0) {
                  var arrayFireds =  funcionario.historico.datasDemissao;
                  var dateDem = arrayFireds[arrayFireds.length-1];
                  endDateAux = new Date(dateDem);
                }
              }
            }  
          }
          var objRetornoCalculo = calcularBancoHoras(dateAux, endDateAux, 1, appResponse, funcionario);

          $scope.allDataInicial = $filter('date')(dateAux, 'dd/MM/yyyy');
          $scope.allDataFinal = $filter('date')(endDateAux, 'dd/MM/yyyy');

          $scope.allApontamentos = objRetornoCalculo.arrayItemApontamentos;
          $scope.allDiasTrabalho = objRetornoCalculo.diasTrabalho;
          $scope.allDiasParaTrabalhar = objRetornoCalculo.diasParaTrabalhar;
          $scope.allMinutosTrabalhadosFtd = objRetornoCalculo.minutosTrabalhadosFtd;
          $scope.allMinutosParaTrabalharFtd = objRetornoCalculo.minutosParaTrabalharFtd;
          $scope.allSaldoFinalPositivoFtd = objRetornoCalculo.saldoFinalPositivoFtd;
          $scope.allSaldoFinalNegativoFtd = objRetornoCalculo.saldoFinalNegativoFtd;
          $scope.allSaldoFinalMesPos = objRetornoCalculo.saldoFinalMesPos;
          $scope.allSaldoFinalMesNeg = objRetornoCalculo.saldoFinalMesNeg;
          $scope.allSaldoFinalMesFtd = objRetornoCalculo.saldoFinalMesFtd;

          lastAllSearch.funcId = funcionario._id;
        }

      }, function errorCallback(response){
        
        $scope.errorMsg = response.data.message;
      });
    };

    function calcularBancoHoras(startDate, endDate, interval, apontamentosSemanais, funcionario){

      var interval = interval || 1;
      var retVal = [];
      var current = new Date(startDate);
      var endDate = new Date(endDate);

      var ferias = funcionario.ferias;

      var itemApontamento = {};
      var i = 0;
      var apontamentoF = null;
      var objEntradasSaidas = {};
      var saldoFinalPositivo = 0;
      var saldoFinalNegativo = 0;
      var diasTrabalho = apontamentosSemanais.length;
      var diasParaTrabalhar = 0;
      var minTrabalhados = 0;
      var minParaTrabalhar = 0;
      
      while (current <= endDate) {//navegar no período solicitado

        itemApontamento = {};
        apontamentoF = utilBancoHoras.getApontamentoFromSpecificDate(apontamentosSemanais, current);
        itemApontamento.order = i;
        itemApontamento.rawDate = new Date(current);
        itemApontamento.data = $filter('date')(new Date(current), 'abvFullDate2');
        itemApontamento.dataReport = $filter('date')(new Date(current), 'dd/EEE');
        //console.log('current ', current);

        if (apontamentoF){ //se tiver apontamento já tem os dados de horas trabalhadas
          
          //console.log('apontamentoF #: ', apontamentoF);
          //na função getSaldoPresente temos as horas a trabalhar e trabalhadas
          itemApontamento.saldo = utilBancoHoras.getSaldoPresente(apontamentoF);
          ////console.log('itemApontamento: ', itemApontamento);
          if (itemApontamento.saldo.saldoDiario > 0) {
            saldoFinalPositivo += itemApontamento.saldo.saldoDiario;
          } else {
            saldoFinalNegativo -= itemApontamento.saldo.saldoDiario;
          }

          if (!apontamentoF.infoTrabalho.ferias){ //se era um dia de trabalho de fato, incrementa a variável
            //talvez devessemos fazer um tratamento diferenciado para quando não for o dia de trabalho
            //tem que ver se precisaria contar mais horas (horas extras e tals)
            diasParaTrabalhar++;
            ////console.log("Considerou dia de trabalho");
            minTrabalhados += apontamentoF.infoTrabalho.trabalhados;
            minParaTrabalhar += apontamentoF.infoTrabalho.aTrabalhar;
          }

          if (apontamentoF.infoTrabalho.ferias)
            itemApontamento.observacao = "Férias";
          else if (apontamentoF.status.id > 0) //Se for Incompleto, Erro ou Justificado...
            itemApontamento.observacao = apontamentoF.status.descricao;

        } else { //se não tiver apontamento tem que verificar qual o motivo (falta, feriado, folga, férias?)

          ////////console.log('Não vai ter batidas em ', current);
          itemApontamento.entradaSaidaFinal = "-";
          itemApontamento.arrayEntSai = [];
          itemApontamento.ocorrencia = {};
          itemApontamento.saldo = {};
          //itemApontamento.observacao = "Sem Batidas";
          utilBancoHoras.setInfoAusencia(itemApontamento, current, funcionario, feriados, funcionario.equipe); //injeta as informações de ausencia no apontamento
          ////console.log('SEM apontamento: ');

          if (itemApontamento.ocorrencia.statusCodeString == "AUS"){ //Ausente quando deveria ter trabalhado
            diasParaTrabalhar++;
            ////console.log("Considerou dia de trabalho");
            saldoFinalNegativo -= -itemApontamento.ocorrencia.minutosDevidos;
            minParaTrabalhar += itemApontamento.ocorrencia.minutosDevidos;
            //colocar o saldo negativo faltante do dia para exibição no Relatório de Espelho de Ponto
            var devido = util.converteParaHoraMinutoSeparados(itemApontamento.ocorrencia.minutosDevidos);
            itemApontamento.saldo = {
              horasNegat: true,
              horasFtd: '-' + devido.hora + ':' + devido.minuto
            };
            //////console.log('########quando falta: ', itemApontamento);
          } else if (itemApontamento.ocorrencia.statusCodeString == "FER"){ //de férias, nada deve ser contabilizado

          }
        }

        //////////console.log('itemApontamento depois: ', itemApontamento);
        retVal.push(itemApontamento);
        current = util.addOrSubtractDays(current, interval);
        i++;
      }

      var minTrabalhadosTot = util.converteParaHoraMinutoSeparados(minTrabalhados);
      var minParaTrabalharTot = util.converteParaHoraMinutoSeparados(minParaTrabalhar);
      var minutosTrabalhadosFtd = minTrabalhadosTot.hora + ':' + minTrabalhadosTot.minuto;
      var minutosParaTrabalharFtd = minParaTrabalharTot.hora + ':' + minParaTrabalharTot.minuto;
      var sfPos = util.converteParaHoraMinutoSeparados(saldoFinalPositivo);
      var sfNeg = util.converteParaHoraMinutoSeparados(saldoFinalNegativo);
      var diff = saldoFinalPositivo - saldoFinalNegativo;
      var sfTot = util.converteParaHoraMinutoSeparados(Math.abs(diff));
      var saldoFinalPositivoFtd = sfPos.hora + ':' + sfPos.minuto;
      var saldoFinalNegativoFtd = sfNeg.hora + ':' + sfNeg.minuto;
      
      var saldoFinalMesPos = false;
      var saldoFinalMesNeg = false;
      var saldoFinalMesFtd = "";

      if (diff < 0){
        saldoFinalMesPos = false;
        saldoFinalMesNeg = true;
        saldoFinalMesFtd = '-' + sfTot.hora + ':' + sfTot.minuto;
      }
      else{
        saldoFinalMesPos = true;
        saldoFinalMesNeg = false;
        saldoFinalMesFtd = sfTot.hora + ':' + sfTot.minuto;
      }

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
      ////////////console.log('rangeDate calculado e ordenado decresc:', retVal);
      return {
        arrayItemApontamentos: retVal,
        diasTrabalho: diasTrabalho,
        diasParaTrabalhar: diasParaTrabalhar,
        minutosTrabalhadosFtd: minutosTrabalhadosFtd,
        minutosParaTrabalharFtd: minutosParaTrabalharFtd,
        saldoFinalPositivoFtd: saldoFinalPositivoFtd,
        saldoFinalNegativoFtd: saldoFinalNegativoFtd,
        saldoFinalMesPos: saldoFinalMesPos,
        saldoFinalMesNeg: saldoFinalMesNeg,
        saldoFinalMesFtd: saldoFinalMesFtd
      };
      
    };

    //Traz todos os employees para tela de Administrador
    function getAllEmployees(allEmployees, allEquipes) {
      
      //var empsArray = allEmployees.data;
      $scope.equipes = allEquipes.data;
      fillEquipes();
      $scope.filtroPonto = true;
    };

   /*
     * Função chamada no início do carregamento, traz as equipes do gestor atual
    **/
    function getEquipesByGestor() {

      teamAPI.getEquipesByGestor($scope.gestor).then(function successCallback(response){

        $scope.equipes = response.data;
        if($scope.equipes){
          if($scope.equipes.length > 0){
            fillEquipes();
          } 
        } 
      }, 
      function errorCallback(response){
        $errorMsg = response.data.message;
      });
    };

    function fillEquipes(){

      if ($scope.equipes.length > 0)
        $scope.selectedEquipe = { item: $scope.equipes[0] };

      fillEmployees();

      $scope.filtroPonto = true;
    };

    function fillEmployees(){
      //////console.log('gsetor, equipes comonentes: ', $scope.equipes);
      for (var i=0; i<$scope.equipes.length; i++){
        for (var j=0; j<$scope.equipes[i].componentes.length; j++) {
          setEquipeAttrsForEmployee($scope.equipes[i].componentes[j], $scope.equipes[i]);
          $scope.employees.push($scope.equipes[i].componentes[j]);
          $scope.employeesNames.push( {
            indiceEq: i, 
            indiceComp: j, 
            equipe: $scope.equipes[i], 
            //equipe: $scope.equipes[i].nome
            dataAdmissao: $scope.equipes[i].componentes[j].alocacao.dataAdmissao,
            id: $scope.equipes[i].componentes[j]._id, 
            name: $scope.equipes[i].componentes[j].nome + ' ' + $scope.equipes[i].componentes[j].sobrenome,
            matricula: $scope.equipes[i].componentes[j].matricula,
            PIS: $scope.equipes[i].componentes[j].PIS,
            cargo: $scope.equipes[i].componentes[j].sexoMasculino ? $scope.equipes[i].componentes[j].alocacao.cargo.especificacao : $scope.equipes[i].componentes[j].alocacao.cargo.nomeFeminino
          });
        }
      }
    };

    function setEquipeAttrsForEmployee(employee, equipe){

      employee.equipe = {
        _id: equipe._id,
        nome: equipe.nome,
        gestor: equipe.gestor,
        fiscal: equipe.fiscal,
        setor: equipe.setor
      };
    };

    function getId (array) {
      return (array.length + 1);
    };    

    function init(allEmployees, allEquipes) {

      if (Usuario.perfil.accessLevel == 2 || Usuario.perfil.accessLevel == 3) {
        
        $scope.gestor = Usuario.funcionario;
        getEquipesByGestor();

      } else if (Usuario.perfil.accessLevel == 4) {
         
         $scope.isAdmin = true;
        ////console.log('allEmployees: ', allEmployees.data);
        getAllEmployees(allEmployees, allEquipes);

      } else if (Usuario.perfil.accessLevel >= 5) {

        $scope.isAdmin = true;
        ////console.log('allEmployees: ', allEmployees.data);
        getAllEmployees(allEmployees, allEquipes);

      } else {

        //////////console.log("Não deve ter acesso.");
        $scope.errorMsg = "Este funcionário não tem permissão para visualizar estas informações";

      }
    };

    /*
    * INICIALIZANDO O CONTROLLER
    */
    init(allEmployees, allEquipes);

  }   

})();
