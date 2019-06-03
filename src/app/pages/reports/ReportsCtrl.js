/**
 * @author Gilliard Lopes
 * created on 04/12/2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.reports')
      .controller('ReportsCtrl', ReportsCtrl);

  /** @ngInject */
  function ReportsCtrl($scope, $filter, $location, $state, $interval, appointmentAPI, teamAPI, employeeAPI, reportsAPI, Auth, util, utilReports, utilCorrectApps, usuario, feriados, allEmployees, allEquipes) {

    var Usuario = usuario.data;
    var feriados = feriados.data;
    var mes = null;
    var ano = null;
    var _selected;
    var testarRelatorioArray = [];
    var equipe = {};
    var funcSel = {};
    var apontamentosTesteCorrect;
    // ////////console.log('usuario.data: ', usuario.data);
    $scope.smartTablePageSize = 35;
    $scope.gestor = null;
    $scope.isGestorGeral = false;
    $scope.isAdmin = false;
    $scope.espelhoPonto = true;
    $scope.bancoHoras = false;
    $scope.filtroPonto = false;

    $scope.funcionario = {};
    $scope.employees = [];
    $scope.employeesNames = []; //Auxiliar para o AutoComplete do Input do nome do funcionario
    $scope.meses = [];
    $scope.anos = [];
    $scope.periodoApontamento = [];
    $scope.checkboxModel = {
      equipe: false,
      funcionario: true
    };
    $scope.textoBotao = "Visualizar";

    // ////////console.log("### Dentro de ReportsCtrl!!!", $scope.gestor);

    init(allEmployees, allEquipes);
    
    $scope.showEspelhoPonto = function () {
      $scope.bancoHoras = false;
      $scope.espelhoPonto = true;
      ////////console.log("mostrar espelho de ponto");
    }

    $scope.showBancoHoras = function () {
      $scope.espelhoPonto = false;
      $scope.bancoHoras = true;
      ////////console.log("mostrar banco de horas");
    }

    $scope.setMes = function (pMes) {
      mes = pMes;
    }

    $scope.setAno = function (pAno) { 
      ano = pAno;
    }

    $scope.clickEmployeeCB = function(){
      //console.log('clicou employee', $scope.checkboxModel.funcionario);
      if ($scope.checkboxModel.funcionario){
          $scope.checkboxModel.equipe = false;
          $scope.textoBotao = "Visualizar";
      } else {
        $scope.checkboxModel.equipe = true;
        $scope.textoBotao = "Salvar Relatório de Equipe em PDF";
      }
    };

    $scope.clickTeamCB = function(){
      //console.log('clicou equipe', $scope.checkboxModel.equipe);
      if($scope.checkboxModel.equipe){
        $scope.checkboxModel.funcionario = false;
        $scope.textoBotao = "Salvar Relatório de Equipe em PDF";
      } else {
        $scope.checkboxModel.funcionario = true;
        $scope.textoBotao = "Visualizar";
      }
    };

    $scope.search = function () {

      if ($scope.checkboxModel.funcionario){

        if (!$scope.funcionario.selected){
        
          alert('Por favor, preencha o campo com o nome do funcionário.');

        } else {

          funcSel = searchEmployee($scope.funcionario.selected.id, $scope.employees);
          $scope.infoHorario = [];
          $scope.infoHorario = util.getInfoHorario(funcSel, []);
          equipe = funcSel.equipe;
          // console.log('funcionario AutoComplete: ', $scope.funcionario.selected);
          // console.log('funcionario pego: ', funcSel);

          var dataInicial = new Date(ano.value, mes._id, 1);
          //Esse é um workaround pra funcionar a obtenção da quantidade de dias em Javascript
          //Dessa maneira a gnt obtém o último dia (valor zero no últ argumento) do mês anterior, que dá exatamente a qtde de dias do mês que vc quer
          //var dataFinal = new Date(ano.value, mes._id+1, 0);
          var dataFinal = new Date(ano.value, mes._id+1, 1);//primeiro dia do mês posterior

          getApontamentosByDateRangeAndEquipe(dataInicial, dataFinal, funcSel);

          ////console.log('funcSelecionado para busca: ', funcSel);

          // employeeAPI.getEquipe(funcSel._id).then(function successCallback(response){

          //   equipe = response.data;
          //   ////console.log('response retornado da equipe do buscado: ', response);
          //   getApontamentosByDateRangeAndEquipe(dataInicial, dataFinal, funcSel);

          // }, function errorCallback(response){
            
          //   $scope.errorMsg = response.data.message;
          // });

          //initGetEquipe(funcSel);//Chama 
        }

      } 

      if ($scope.checkboxModel.equipe) {

        //console.log('Selected Equipe: ', $scope.selectedEquipe.item);
        //vou ter que calcular os totais para cada employee da equipe e depois gerar o PDF para concatenar num documento so
      }      
      
    }

    $scope.buildAllReports = function() {

      var beginDate = new Date(ano.value, mes._id, 1);
      var endDate = new Date(ano.value, mes._id+1, 1);//primeiro dia do mês posterior

      var dateAux = new Date(beginDate);
      var endDateAux = new Date(endDate);

      //var equipeIds = $scope.employees.map(a => a._id);

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
        equipe: equipeIds        
      };

      reportsAPI.getEspelhoPontoFuncionarios(objDateWorker).then(function successCallback(response){

        var arrayFuncAppoints = response.data;
        ////console.log("##*## Funcionários e apontamentos: ", arrayFuncAppoints);
        //$scope.periodoApontamento = createArrayRangeDate(dateAux, endDateAux, 1, apontamentosResponse);
        generateSuperPDF(dateAux, endDateAux, 1, arrayFuncAppoints);

      }, function errorCallback(response){
        
        $scope.errorMsg = response.data.message;
        ////////console.log("Erro ao obter apontamentos por um range de data e equipe");
      });
    };

    $scope.corrigirEscalaRevezamento = function(){      

      var totais = {
        aTrabalhar: $scope.minutosParaTrabalharFtd,
        trabalhados: $scope.minutosTrabalhadosFtd,
        saldoPositivo: $scope.saldoFinalPositivoFtd,
        saldoNegativo: $scope.saldoFinalNegativoFtd,
        saldoFinal: $scope.saldoFinalMesFtd
      };

      utilCorrectApps.correctArray(funcSel, 
        $scope.infoHorario, apontamentosTesteCorrect, totais, feriados, equipe);

    };

    $scope.gerarPDF = function() {

      //console.log('Funcionário selecionado: ', $scope.funcionario.selected);
      
      var periodoStr = mes.nome + ' / ' + ano.value;
      var diasRelatorio = gerarDiasRelatorioPonto();
      var totais = {
        aTrabalhar: $scope.minutosParaTrabalharFtd,
        trabalhados: $scope.minutosTrabalhadosFtd,
        saldoPositivo: $scope.saldoFinalPositivoFtd,
        saldoNegativo: $scope.saldoFinalNegativoFtd,
        saldoFinal: $scope.saldoFinalMesFtd
      };

      var docDefinition = utilReports.gerarEspelhoPonto($scope.funcionario.selected, 
        $scope.infoHorario, periodoStr, diasRelatorio, totais);
      
      //console.log('Funcionario selecionado para relatorio: ', $scope.funcionario.selected);

      docDefinition.footer = function(currentPage, pageCount) { 
        return { 
          text: currentPage.toString() + ' de ' + pageCount, 
          alignment: 'right', 
          margin: [20, 0] 
        }; 
      };

      var strPDFName = $scope.funcionario.selected.name + '-' + $scope.funcionario.selected.matricula + '.pdf';

      // download the PDF
      pdfMake.createPdf(docDefinition).download(strPDFName);
      // var dd = {
      //   content: [
      //     'First paragraph',
      //     'Another paragraph, this time a little bit longer to make sure, this line will be divided into at least two lines'
      //   ]
      // };

      // pdfMake.createPdf(dd).download('espelho_ponto.pdf');


    };

    function generateSuperPDF(beginDate, endDate, interval, arrayFuncionariosApontamentos){

      // var currentFunc = {};
      // var horarioFunc = {};
      // var objRelatorio = {};
      // var contentArray = [];
      // var periodoStr = mes.nome + ' / ' + ano.value;
      // var docDefinition = utilReports.getDocDefinition();

      // docDefinition.footer = function(currentPage, pageCount) { 
      //   return { 
      //     text: currentPage.toString() + ' de ' + pageCount, 
      //     alignment: 'right', 
      //     margin: [20, 0] 
      //   }; 
      // };
      
      // for (var i=0; i<$scope.employees.length; i++){
      // //for (var i=0; i<5; i++){  
      //   ////console.log('i: ', i);
      //   currentFunc = {};
      //   currentFunc = $scope.employees[i];
      //   currentFunc.name = currentFunc.nome + ' ' + currentFunc.sobrenome;
      //   currentFunc.cargo = currentFunc.sexoMasculino ? currentFunc.alocacao.cargo.especificacao : currentFunc.alocacao.cargo.nomeFeminino,
      //   horarioFunc = util.getInfoHorario(currentFunc, []);
      //   currentFunc.equipe = '';
        
      //   employeeAPI.getEquipe(currentFunc._id).then(function successCallback(response){

      //     equipe = response.data;
      //     ////console.log('response retornado da equipe do buscado: ', response);
      //     objRelatorio = getFtdPontosFuncionario(beginDate, endDate, interval, currentFunc, arrayFuncionariosApontamentos);
        
      //     utilReports.pushContentArray(contentArray, currentFunc, horarioFunc, periodoStr, 
      //       objRelatorio.retVal, objRelatorio.saldos);

      //     if (i == 0)
      //       break;

      //   }, function errorCallback(response){
          
      //     $scope.errorMsg = response.data.message;
      //   });            

      // }

      // docDefinition.content = contentArray;
      // pdfMake.createPdf(docDefinition).download('espelho_ponto_geral.pdf');
    };

    function gerarDiasRelatorio(){

      var arrayRelatorio = [];
      for (var i=0; i<$scope.periodoApontamento.length; i++){
        if ($scope.periodoApontamento[i].entradasSaidasTodas)
          arrayRelatorio.push($scope.periodoApontamento[i].data + '              ' + $scope.periodoApontamento[i].entradasSaidasTodas);
        else 
          arrayRelatorio.push($scope.periodoApontamento[i].data + '              ' + $scope.periodoApontamento[i].observacao);
      }

      return arrayRelatorio;
    };

    function gerarDiasRelatorioPonto(){
      ////console.log('periodoApontamento: ', $scope.periodoApontamento);
      var arrayRelatorio = [];
      for (var i=0; i<$scope.periodoApontamento.length; i++){
        if ($scope.periodoApontamento[i].entradasSaidasTodas){
          arrayRelatorio.push(
            {
              hasPoint: true,
              date: $scope.periodoApontamento[i].dataReport,
              marcacoesStr: $scope.periodoApontamento[i].entradasSaidasTodas,
              observacao: $scope.periodoApontamento[i].observacao,
              saldo: $scope.periodoApontamento[i].saldo
            }
          );
        }
        else {
          arrayRelatorio.push(
            {
              hasPoint: false,
              date: $scope.periodoApontamento[i].dataReport,
              observacao: $scope.periodoApontamento[i].observacao,
              saldo: $scope.periodoApontamento[i].saldo
            }
          );          
        }
      }

      return arrayRelatorio;
    };

    function searchEmployee(nameKey, myArray){
      for (var i=0; i < myArray.length; i++) {
          if (myArray[i]._id === nameKey) {
              return myArray[i];
          }
      }
    }

    function initGetEquipe(funcionario){

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
      $scope.periodoApontamento = [];
      //console.log("objDateWorker Enviado: ", objDateWorker);

      appointmentAPI.getApontamentosByDateRangeAndFuncionario(objDateWorker).then(function successCallback(response){

        var apontamentosResponse = response.data;
        apontamentosTesteCorrect = response.data;
        ////console.log("!@# Apontamentos do funcionário: ", apontamentosResponse);
        //$scope.periodoApontamento = createArrayRangeDate(dateAux, endDateAux, 1, apontamentosResponse);
        $scope.periodoApontamento = testePetrolina(dateAux, endDateAux, 1, apontamentosResponse, funcionario);

      }, function errorCallback(response){
        
        $scope.errorMsg = response.data.message;
        ////////console.log("Erro ao obter apontamentos por um range de data e equipe");
      });
    };

    //Traz todos os employees para tela de Administrador
    function getAllEmployees(allEmployees, allEquipes) {
      
      //var empsArray = allEmployees.data;
      $scope.equipes = allEquipes.data;
      fillEquipes();

      // for (var j=0; j<empsArray.length; j++) {
      //     $scope.employees.push(empsArray[j]);
      //     $scope.employeesNames.push( { 
      //       id: empsArray[j]._id, 
      //       name: empsArray[j].nome + ' ' + empsArray[j].sobrenome,
      //       matricula: empsArray[j].matricula,
      //       PIS: empsArray[j].PIS,
      //       cargo: empsArray[j].sexoMasculino ? empsArray[j].alocacao.cargo.especificacao : empsArray[j].alocacao.cargo.nomeFeminino,
      //       equipe: 'equipeVar'
      //     });
      //   }
      $scope.filtroPonto = true;
    };

   /*
     *
     * Função chamada no início do carregamento, traz as equipes do gestor atual
     *
    **/
    function getEquipesByGestor() {

      teamAPI.getEquipesByGestor($scope.gestor).then(function successCallback(response){

        $scope.equipes = response.data;
        if($scope.equipes){
          if($scope.equipes.length > 0){
            fillEquipes();
          } 
        } 

        ////////console.log('Equipes do gestor: ', response.data);

      }, 
      function errorCallback(response){
        $errorMsg = response.data.message;
        ////////console.log("houve um erro ao carregar as equipes do gestor");
      });
    };

    function fillEquipes(){

      if ($scope.equipes.length > 0)
        $scope.selectedEquipe = { item: $scope.equipes[0] };

      fillEmployees();

      $scope.filtroPonto = true;
    };

    function fillEmployees(){
      ////console.log('gsetor, equipes comonentes: ', $scope.equipes);
      for (var i=0; i<$scope.equipes.length; i++){
        for (var j=0; j<$scope.equipes[i].componentes.length; j++) {
          setEquipeAttrsForEmployee($scope.equipes[i].componentes[j], $scope.equipes[i]);
          $scope.employees.push($scope.equipes[i].componentes[j]);
          $scope.employeesNames.push( { 
            id: $scope.equipes[i].componentes[j]._id, 
            name: $scope.equipes[i].componentes[j].nome + ' ' + $scope.equipes[i].componentes[j].sobrenome,
            matricula: $scope.equipes[i].componentes[j].matricula,
            PIS: $scope.equipes[i].componentes[j].PIS,
            cargo: $scope.equipes[i].componentes[j].sexoMasculino ? $scope.equipes[i].componentes[j].alocacao.cargo.especificacao : $scope.equipes[i].componentes[j].alocacao.cargo.nomeFeminino,
            equipe: $scope.equipes[i].nome
            // equipe: $scope.equipes[i]
          });
        }
      }

      ////////console.log('employees: ', $scope.employeesNames);
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

    function addOrSubtractDays(date, value) {
          
      date = angular.copy(date);
      date.setHours(0,0,0,0);

      return new Date(date.getTime() + (value*864e5));
    }

    function fillMeses(){

      $scope.meses = [{
        _id: 0,
        nome: 'Janeiro'
      },
      {
        _id: 1,
        nome: 'Fevereiro'
      },
      {
        _id: 2,
        nome: 'Março'
      },
      {
        _id: 3,
        nome: 'Abril'
      },
      {
        _id: 4,
        nome: 'Maio'
      },
      {
        _id: 5,
        nome: 'Junho'
      },
      {
        _id: 6,
        nome: 'Julho'
      },
      {
        _id: 7,
        nome: 'Agosto'
      },
      {
        _id: 8,
        nome: 'Setembro'
      },
      {
        _id: 9,
        nome: 'Outubro'
      },
      {
        _id: 10,
        nome: 'Novembro'
      },
      {
        _id: 11,
        nome: 'Dezembro'
      }
      ];

      $scope.selectedMes = { item: $scope.meses[0] };
      mes = $scope.meses[0];
    };

    function fillAnos() {

      $scope.anos = [{value: '2019'}, {value: '2018'}, {value: '2017'}, {value: '2016'}, {value: '2015'}, {value: '2014'}, {value: '2013'}];
      $scope.selectedAno = { item: $scope.anos[0] };
      ano = $scope.anos[0];
    };

    function testePetrolina (startDate, endDate, interval, apontamentosSemanais, funcionario) {
      
      var interval = interval || 1;
      var retVal = [];
      var current = new Date(startDate);
      var endDate = new Date(endDate);

      var ferias = funcionario.ferias;

      //console.log("#ReportsCtrl Funcionario oficioal: ", funcionario);
      //console.log("#ReportsCtrl Funcionario.ferias oficioal: ", funcionario.ferias);

      //Tivemos que fazer um workaround para funcionar a obtenção dos apontamentos da data final no servidor
      //agora nós 'removemos' esse workaround:
      endDate = addOrSubtractDays(endDate, -1);

      var itemApontamento = {};
      var i = 0;
      var apontamentoF = null;
      var objEntradasSaidas = {};
      var saldoFinalPositivo = 0;
      var saldoFinalNegativo = 0;
      $scope.diasTrabalho = apontamentosSemanais.length;
      $scope.diasParaTrabalhar = 0;
      var minTrabalhados = 0;
      var minParaTrabalhar = 0;
      
      while (current <= endDate) {//navegar no período solicitado

        itemApontamento = {};
        objEntradasSaidas = {};
        apontamentoF = getApontamentoFromSpecificDate(apontamentosSemanais, current);
        itemApontamento.order = i;
        itemApontamento.rawDate = new Date(current);
        itemApontamento.data = $filter('date')(new Date(current), 'abvFullDate2');
        itemApontamento.dataReport = $filter('date')(new Date(current), 'dd/EEE');
        console.log('current ', current);

        if (apontamentoF){ //se tiver apontamento já tem os dados de horas trabalhadas
          
          console.log('apontamentoF #: ', apontamentoF);
          objEntradasSaidas = getEntradasSaidas(apontamentoF);
          // //console.log('objEntradasSaidas: ', objEntradasSaidas);
          itemApontamento.entradaSaidaFinal = objEntradasSaidas.esFinal;
          itemApontamento.entradasSaidasTodas = objEntradasSaidas.esTodas;
          itemApontamento.arrayEntSai = objEntradasSaidas.arrayEntSai;
          //na função getSaldoPresente temos as horas a trabalhar e trabalhadas
          itemApontamento.saldo = getSaldoPresente(apontamentoF);
          //console.log('itemApontamento: ', itemApontamento);
          if (itemApontamento.saldo.saldoDiario > 0) {
            saldoFinalPositivo += itemApontamento.saldo.saldoDiario;
          } else {
            saldoFinalNegativo -= itemApontamento.saldo.saldoDiario;
          }

          if (!apontamentoF.infoTrabalho.ferias){ //se era um dia de trabalho de fato, incrementa a variável
            //talvez devessemos fazer um tratamento diferenciado para quando não for o dia de trabalho
            //tem que ver se precisaria contar mais horas (horas extras e tals)
            $scope.diasParaTrabalhar++;
            minTrabalhados += apontamentoF.infoTrabalho.trabalhados;
            minParaTrabalhar += apontamentoF.infoTrabalho.aTrabalhar;
          }

          if (apontamentoF.infoTrabalho.ferias)
            itemApontamento.observacao = "Férias";
          else if (apontamentoF.status.id > 0) //Se for Incompleto, Erro ou Justificado...
            itemApontamento.observacao = apontamentoF.status.descricao;

        } else { //se não tiver apontamento tem que verificar qual o motivo (falta, feriado, folga, férias?)

          //////console.log('Não vai ter batidas em ', current);
          itemApontamento.entradaSaidaFinal = "-";
          itemApontamento.arrayEntSai = [];
          itemApontamento.ocorrencia = {};
          itemApontamento.saldo = {};
          //itemApontamento.observacao = "Sem Batidas";
          setInfoAusencia(itemApontamento, current, false); //injeta as informações de ausencia no apontamento
          var teste = itemApontamento.saldo.horasFtd;
          //console.log('SEM apontamento: ');

          if (itemApontamento.ocorrencia.statusCodeString == "AUS"){ //Ausente quando deveria ter trabalhado
            $scope.diasParaTrabalhar++;
            saldoFinalNegativo -= -itemApontamento.ocorrencia.minutosDevidos;
            minParaTrabalhar += itemApontamento.ocorrencia.minutosDevidos;
            //colocar o saldo negativo faltante do dia para exibição no Relatório de Espelho de Ponto
            var devido = converteParaHoraMinutoSeparados(itemApontamento.ocorrencia.minutosDevidos);
            itemApontamento.saldo = {
              horasNegat: true,
              horasFtd: '-' + devido.hora + ':' + devido.minuto
            };
            ////console.log('########quando falta: ', itemApontamento);
          } else if (itemApontamento.ocorrencia.statusCodeString == "FER"){ //de férias, nada deve ser contabilizado

          }
        }

        ////////console.log('itemApontamento depois: ', itemApontamento);
        retVal.push(itemApontamento);
        current = addOrSubtractDays(current, interval);
        i++;
      }

      var minTrabalhadosTot = converteParaHoraMinutoSeparados(minTrabalhados);
      var minParaTrabalharTot = converteParaHoraMinutoSeparados(minParaTrabalhar);
      $scope.minutosTrabalhadosFtd = minTrabalhadosTot.hora + ':' + minTrabalhadosTot.minuto;
      $scope.minutosParaTrabalharFtd = minParaTrabalharTot.hora + ':' + minParaTrabalharTot.minuto;
      var sfPos = converteParaHoraMinutoSeparados(saldoFinalPositivo);
      var sfNeg = converteParaHoraMinutoSeparados(saldoFinalNegativo);
      var diff = saldoFinalPositivo - saldoFinalNegativo;
      var sfTot = converteParaHoraMinutoSeparados(Math.abs(diff));
      $scope.saldoFinalPositivoFtd = sfPos.hora + ':' + sfPos.minuto;
      $scope.saldoFinalNegativoFtd = sfNeg.hora + ':' + sfNeg.minuto;
      
      if (diff < 0)
        $scope.saldoFinalMesFtd = '-' + sfTot.hora + ':' + sfTot.minuto;
      else
        $scope.saldoFinalMesFtd = sfTot.hora + ':' + sfTot.minuto;

      //////////console.log('rangeDate calculado:', retVal);
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
      //////////console.log('rangeDate calculado e ordenado decresc:', retVal);
      return retVal;  
    };

    function getFtdPontosFuncionario(startDate, endDate, interval, funcionario, apontamentosSemanais){

      var interval = interval || 1;
      var retVal = [];
      var current = new Date(startDate);
      var endDate = new Date(endDate);

      //////console.log('apontamentosSemanais: ', apontamentosSemanais);
      
      endDate = addOrSubtractDays(endDate, -1);

      var itemApontamento = {};
      //////////console.log('current ', current);
      //////////console.log('endDate ', endDate);
      var i = 0;
      var apontamentoF = null;
      var objEntradasSaidas = {};
      var saldoFinalPositivo = 0;
      var saldoFinalNegativo = 0;
      var diasTrabalho = apontamentosSemanais.length;
      var diasParaTrabalhar = 0;
      var minTrabalhados = 0;
      var minParaTrabalhar = 0;

      ////console.log('current ', current);
      ////console.log('endDate ', endDate);
      
      while (current <= endDate) {//navegar no período solicitado

        ////console.log('data: ', current);
        itemApontamento = {};
        objEntradasSaidas = {};
        apontamentoF = getApontamentoFromSpecificDateAndPis(apontamentosSemanais, current, funcionario.PIS);
        itemApontamento.date = $filter('date')(new Date(current), 'dd/EEE');

        if (apontamentoF){ //se tiver apontamento já tem os dados de horas trabalhadas
          
          itemApontamento.hasPoint = true;
          objEntradasSaidas = getEntradasSaidas(apontamentoF);
          if(objEntradasSaidas.esTodas){
            itemApontamento.marcacoesStr = objEntradasSaidas.esTodas;
          }
          //na função getSaldoPresente temos as horas a trabalhar e trabalhadas
          itemApontamento.saldo = getSaldoPresente(apontamentoF);
          if (itemApontamento.saldo.saldoDiario > 0) {
            saldoFinalPositivo += itemApontamento.saldo.saldoDiario;
          } else {
            saldoFinalNegativo -= itemApontamento.saldo.saldoDiario;
          }

          //if (apontamentoF.infoTrabalho.trabalha){ //se era um dia de trabalho de fato, incrementa a variável
          //talvez devessemos fazer um tratamento diferenciado para quando não for o dia de trabalho
          //tem que ver se precisaria contar mais horas (horas extras e tals)
          diasParaTrabalhar++;
          minTrabalhados += apontamentoF.infoTrabalho.trabalhados;
          minParaTrabalhar += apontamentoF.infoTrabalho.aTrabalhar;
          //}

          if (apontamentoF.status.id > 0) //Se for Incompleto, Erro ou Justificado...
            itemApontamento.observacao = apontamentoF.status.descricao;

        } else { //se não tiver apontamento tem que verificar qual o motivo (falta, feriado, folga, férias?)

          itemApontamento.hasPoint = true;
          itemApontamento.ocorrencia = {};
          itemApontamento.saldo = {};
          //itemApontamento.observacao = "Sem Batidas";
          setInfoAusencia(itemApontamento, current, funcionario); //injeta as informações de ausencia no apontamento

          if (itemApontamento.ocorrencia.statusCodeString == "AUS"){ //Ausente quando deveria ter trabalhado
            diasParaTrabalhar++;
            saldoFinalNegativo -= -itemApontamento.ocorrencia.minutosDevidos;
            minParaTrabalhar += itemApontamento.ocorrencia.minutosDevidos;
            //colocar o saldo negativo faltante do dia para exibição no Relatório de Espelho de Ponto
            var devido = converteParaHoraMinutoSeparados(itemApontamento.ocorrencia.minutosDevidos);
            itemApontamento.saldo = {
              horasNegat: true,
              horasFtd: '-' + devido.hora + ':' + devido.minuto
            };
            //////console.log('########quando falta: ', itemApontamento);
          }
        }

        ////////console.log('itemApontamento depois: ', itemApontamento);
        retVal.push(itemApontamento);
        current = addOrSubtractDays(current, interval);
        i++;
      }

      var minTrabalhadosTot = converteParaHoraMinutoSeparados(minTrabalhados);
      var minParaTrabalharTot = converteParaHoraMinutoSeparados(minParaTrabalhar);
      var minutosTrabalhadosFtd = minTrabalhadosTot.hora + ':' + minTrabalhadosTot.minuto;
      var minutosParaTrabalharFtd = minParaTrabalharTot.hora + ':' + minParaTrabalharTot.minuto;
      var sfPos = converteParaHoraMinutoSeparados(saldoFinalPositivo);
      var sfNeg = converteParaHoraMinutoSeparados(saldoFinalNegativo);
      var diff = saldoFinalPositivo - saldoFinalNegativo;
      var sfTot = converteParaHoraMinutoSeparados(Math.abs(diff));
      var saldoFinalPositivoFtd = sfPos.hora + ':' + sfPos.minuto;
      var saldoFinalNegativoFtd = sfNeg.hora + ':' + sfNeg.minuto;
      var saldoFinalMesFtd;
      if (diff < 0)
        saldoFinalMesFtd = '-' + sfTot.hora + ':' + sfTot.minuto;
      else
        saldoFinalMesFtd = sfTot.hora + ':' + sfTot.minuto;

      var saldosTotalizados = {
        aTrabalhar: minutosParaTrabalharFtd,
        trabalhados: minutosTrabalhadosFtd,
        saldoPositivo: saldoFinalPositivoFtd,
        saldoNegativo: saldoFinalNegativoFtd,
        saldoFinal: saldoFinalMesFtd
      };

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
      //////////console.log('rangeDate calculado e ordenado decresc:', retVal);
      return {
        retVal: retVal,
        saldos: saldosTotalizados
      };
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

    function getApontamentoFromSpecificDateAndPis(apontamentosSemanais, dataAtual, pis){

      ////console.log('verificar data e pis: ', dataAtual);
      ////console.log('pis: ', pis);
      for (var i=0; i<apontamentosSemanais.length; i++){

        if ((compareOnlyDates(dataAtual, new Date(apontamentosSemanais[i].data)) == 0) && 
          (pis == apontamentosSemanais[i].PIS)) {

          return apontamentosSemanais[i];
        }
      }

      return null;
    };

    function compareOnlyDates(date1, date2) {

      //como a passagem é por referência, devemos criar uma cópia do objeto
      var d1 = angular.copy(date1); 
      var d2 = angular.copy(date2);
      //////////console.log('date1', d1);
      //////////console.log('date2', d2);
      d1.setHours(0,0,0,0);
      d2.setHours(0,0,0,0);

      //////////console.log('date1 time', d1.getTime());
      //////////console.log('date2 time', d2.getTime());

      if (d1.getTime() < d2.getTime())
        return -1;
      else if (d1.getTime() === d2.getTime())
        return 0;
      else
        return 1; 
    };

    /*
    ** Vai retornar um objeto com duas variáveis
    ** A variável esFinal possui apenas a 1a entrada e a última saída
    ** A variável arrayEntSai possui 1 objeto para cada batida, esse objeto informa por extenso 
    ** qual a entrada/saída junto com o valor da hora:minuto referente à batida. Ex.: descricao: 1a Entrada, horario: 08:05
    */
    function getEntradasSaidas(apontamentoF){

      var esFinal = "";
      var esTodas = "";
      
      apontamentoF.marcacoesFtd.sort(function(a, b){//ordena o array de marcaçõesFtd
        return a > b;
      });

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
        esFinal: esFinal,
        esTodas: esTodas
      };
      return objetoEntradasSaidas;
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

      //console.log('apontamento recebido saldo presente: ', apontamento);
      //console.log('apontamento.infoTrabalho.trabalhados: ', apontamento.infoTrabalho.trabalhados);
      //console.log('apontamento.infoTrabalho.aTrabalhar: ', apontamento.infoTrabalho.aTrabalhar);
      var saldoDia = apontamento.infoTrabalho.trabalhados - apontamento.infoTrabalho.aTrabalhar;
      var sinalFlag = '-';
      var saldoFlag = false;

      if (saldoDia >= 0){
        saldoFlag = true;
        sinalFlag = '';
      }

      var saldoDiarioFormatado = converteParaHoraMinutoSeparados(Math.abs(saldoDia));

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

    function setInfoAusencia(apontamento, currentDate, funcionarioParam){

      var saldoFlag = false;
      var sinalFlag = '-';
      var saldoDiarioFormatado = {};

      //pode não ter expediente iniciado, ser feriado, estar atrasado, de folga ou faltante mesmo
      var expedienteObj;
      if (funcionarioParam)
        expedienteObj = updateAbsenceStatus(funcionarioParam, currentDate);
      else
        expedienteObj = updateAbsenceStatus(funcSel, currentDate);

      apontamento.ocorrencia.statusCodeString = expedienteObj.code;
      apontamento.ocorrencia.minutosDevidos = expedienteObj.minutosDia;
      apontamento.ocorrencia.statusString = expedienteObj.string;
      apontamento.ocorrencia.statusImgUrl = expedienteObj.imgUrl;

      if (expedienteObj.code == "FER"){

        saldoFlag = true;
        sinalFlag = '';
        saldoDiarioFormatado = converteParaHoraMinutoSeparados(Math.abs(expedienteObj.saldoDia));
        apontamento.observacao = expedienteObj.string;
        apontamento.saldo.horasPosit = saldoFlag;
        apontamento.saldo.horasNegat = !saldoFlag;

      } else if (expedienteObj.code == "FRD"){
        saldoFlag = true;
        sinalFlag = '';
        saldoDiarioFormatado = converteParaHoraMinutoSeparados(Math.abs(expedienteObj.saldoDia));
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
        
        saldoDiarioFormatado = converteParaHoraMinutoSeparados(Math.abs(expedienteObj.saldoDia));
        apontamento.observacao = "Falta";
        apontamento.saldo.horasPosit = saldoFlag;
        apontamento.saldo.horasNegat = !saldoFlag;
      }

      apontamento.saldo.horasFtd = sinalFlag + saldoDiarioFormatado.hora + ':' + saldoDiarioFormatado.minuto;
      // apontamento.saldo = {
      //   horasFtd: sinalFlag + saldoDiarioFormatado.hora + ':' + saldoDiarioFormatado.minuto,
      //   horasPosit: saldoFlag,
      //   horasNegat: !saldoFlag
      // };
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
    function updateAbsenceStatus(funcionario, dataDesejada) {
      
      var funcionarioAlocacao = funcionario.alocacao;
      var codigoEscala = funcionarioAlocacao.turno.escala.codigo; 
      var ignoraFeriados =  funcionarioAlocacao.turno.ignoraFeriados;
      var objFeriadoRet = isFeriado(dataDesejada);
      //console.log('#ReportsCtrl: objeto de férias do Funcionario: ', funcionario.ferias);
      var objFerias = util.checkFerias(dataDesejada, funcionario.ferias);
      //console.log('está de férias ?', objFerias);

      if (objFerias){
        
        //console.log("funcionários de férias na data", dataDesejada);
        return {code: "FER", string: "Férias!", imgUrl: "assets/img/app/todo/mypoint_correct16.png", saldoDia: 0};

      } else {

        if (objFeriadoRet.flag && !ignoraFeriados){ //Caso 1 - feriado

          //////console.log('Feriado em: ', dataDesejada);
          return {code: "FRD", string: objFeriadoRet.name, imgUrl: "assets/img/app/todo/mypoint_correct16.png", saldoDia: 0};//getSaldoDiaFrd(funcionarioAlocacao)};

        } else if (hasFolgaSolicitada() || hasLicenca()){ //Caso 3 - Folgas/Licenças

          //////////console.log('Caso 3 - checar');

        } else { //Caso 2, 4 ou 5
          
          if (codigoEscala == 1) {
            return checkJornadaSemanal(funcionarioAlocacao, dataDesejada);
          }

          else if (codigoEscala == 2)
            return checkJornadaRevezamento(funcionarioAlocacao, dataDesejada);
        }
      }
    };

    function isFeriado(dataDesejada) {
      
      var data = dataDesejada;

      ////////console.log('Data Desejada: ', data);
      ////////console.log('Setor.local: ', $scope.equipe);

      var date = data.getDate();//1 a 31
      var month = data.getMonth();//0 a 11
      var year = data.getFullYear();//
      var flagFeriado = false;
      var feriadoName = "";
      var tempDate;      

      feriados.forEach(function(feriado){
        
        ////////console.log('feriado atual: ', feriado);        

        for (var i = 0; i < feriado.array.length; i++) {
          
          tempDate = new Date(feriado.array[i]);
          if (feriado.fixo){
          
            if (tempDate.getMonth() === month && tempDate.getDate() === date){
              //////console.log("É Feriado (fixo)!", tempDate);
              flagFeriado = checkFeriadoSchema(feriado);
              feriadoName = feriado.nome;
              return feriado;
            }

          } else {//se não é fixo

            if ( (tempDate.getFullYear() === year) && (tempDate.getMonth() === month) && (tempDate.getDate() === date) ){
              //////console.log("É Feriado (variável)!", tempDate);
              flagFeriado = checkFeriadoSchema(feriado);
              feriadoName = feriado.nome;
              return feriado;
            }
          }
        }
      });
      //////console.log('FlagFeriado: ', flagFeriado);
      return {flag: flagFeriado, name: feriadoName};//no futuro retornar o flag de Feriado e a descrição do mesmo!
    };

    function checkFeriadoSchema(feriado){

      var abrangencias = ["Nacional", "Estadual", "Municipal"];
      var flagFeriado = false;

      if (feriado.abrangencia == abrangencias[0]){

        //////console.log('Feriado Nacional!');
        flagFeriado = true;

      } else  if (feriado.abrangencia == abrangencias[1]){
        
        //////console.log('Feriado Estadual!');
        if (equipe.setor.local.estado == feriado.local.estado._id){
          //////console.log('Feriado Estadual no Estado correto!');
          flagFeriado = true;
        }

      } else if (feriado.abrangencia == abrangencias[2]){
        
        //////console.log('Feriado Municipal!');
        if (equipe.setor.local.municipio == feriado.local.municipio._id){
          //////console.log('No municipio correto!');
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
      ////////console.log('Dentro de Jornada Semanal: funcionarioAlocacao', funcionarioAlocacao);
      var objDay = getDayInArrayJornadaSemanal(dataAtual.getDay(), jornadaArray);
      ////////console.log('objDay', objDay);
      
      if (!objDay || !objDay.minutosTrabalho || objDay.minutosTrabalho <= 0) { //Caso 4 - DSR
        
        return {code: "DSR", string: "Descanso Semanal Remunerado", imgUrl: "assets/img/app/todo/bullet-grey-16.png"};

      } else { //Chegando aqui, só pode ser ENI ou Ausente de fato

        var codDate = compareOnlyDates(dataAtual, dataHoje);

        if (codDate === 0) { //é o próprio dia de hoje
          //////////////console.log("Olhando para o dia de hoje! Pode estar Ausente ou ENI");
          //HORA ATUAL é menor que ENT1 ? caso sim, sua jornada ainda não começou
          var totalMinutesAtual = converteParaMinutosTotais(dataHoje.getHours(), 
          dataHoje.getMinutes());
          var ENT1 = objDay.horarios.ent1;
          //////////console.log("Total de minutos da hora atual: ", totalMinutesAtual);
          //////////console.log("Entrada 1: ", ENT1);

          if (totalMinutesAtual < ENT1) {
          
            //////////////console.log("Ainda não iniciou o expediente");
            return {code: "ENI", string: "Expediente Não Iniciado", imgUrl: "assets/img/app/todo/bullet-blue.png"};

          } else {
            //////////////console.log("Já passou o tempo da batida dele , então está ausente, ainda não bateu!");
            return {code: "AUS", minutosDia: objDay.minutosTrabalho, string: "Ausente", imgUrl: "assets/img/app/todo/mypoint_wrong16.png", saldoDia: objDay.minutosTrabalho};
          }

        } else if (codDate === -1) {//Navegando em dia passado 

          //////////////console.log("Navegando em dias anteriores e sem valor de apontamento, ou seja, faltante");
          return {code: "AUS", minutosDia: objDay.minutosTrabalho, string: "Ausente", imgUrl: "assets/img/app/todo/mypoint_wrong16.png", saldoDia: objDay.minutosTrabalho};

        } else { //Navegando em dias futuros

          //////////////console.log("Navegando em dias futuros, expediente não iniciado!");
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

      ////////console.log('dataComparacao: ', dataComparacao);
      var trabalha = isWorkingDay(dataComparacao, 
        new Date(funcionarioAlocacao.dataInicioEfetivo));
      
      if (trabalha && jornadaArray.length > 0) { //ele deveria ter trabalhado, ou é ENI ou AUSENCIA

        var ENT1 = jornadaArray[0].horarios.ent1;
        var codDate = compareOnlyDates(dataComparacao, dataHoje);

        if (codDate === 0) { //é o próprio dia de hoje
          //////////////console.log("Olhando para o dia de hoje! Pode estar Ausente ou ENI");
          //HORA ATUAL é menor que ENT1 ? caso sim, sua jornada ainda não começou
          var totalMinutesAtual = converteParaMinutosTotais(dataHoje.getHours(), 
          dataHoje.getMinutes());
          //////////////console.log("Total de minutos da hora atual: ", totalMinutesAtual);

          if (totalMinutesAtual < ENT1) {
          
            //////////////console.log("Ainda não iniciou o expediente");
            return {code: "ENI", string: "Expediente Não Iniciado", imgUrl: "assets/img/app/todo/bullet-blue.png"};

          } else {
            //////////////console.log("Já passou o tempo da batida dele , então está ausente, ainda não bateu!");
            return {code: "AUS", minutosDia: minutosTrabalho, string: "Ausente", imgUrl: "assets/img/app/todo/mypoint_wrong16.png", saldoDia: funcionarioAlocacao.turno.jornada.minutosTrabalho};
          }
        } else if (codDate === -1) {//Navegando em dia passado 

          //////////////console.log("Navegando em dias anteriores e sem valor de apontamento, ou seja, faltante");
          return {code: "AUS", minutosDia: minutosTrabalho, string: "Ausente", imgUrl: "assets/img/app/todo/mypoint_wrong16.png", saldoDia: funcionarioAlocacao.turno.jornada.minutosTrabalho};
        } else { //Navegando em dias futuros

          //////////////console.log("Navegando em dias futuros, expediente não iniciado!");
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
      //////////console.log("DIA RETORNO NO getDayInArrayJornadaSemanal: ", diaRetorno);
      return diaRetorno;
    };

    function isWorkingDay(dateToCompare, dataInicioEfetivo) {

      var oneDay = 24*60*60*1000; // hours*minutes*seconds*milliseconds
      
      var d1 = angular.copy(dateToCompare); 
      var d2 = angular.copy(dataInicioEfetivo);
      d1.setHours(0,0,0,0);
      d2.setHours(0,0,0,0);

      var diffDays = Math.round(Math.abs((d1.getTime() - d2.getTime())/(oneDay)));
      //////////////console.log("diffDays: ", diffDays);
      
      return (diffDays % 2 == 0) ? true : false;
    };

    function converteParaHorasTotais(totalMinutos) {
      return (totalMinutos/60);
    };

    function converteParaMinutosTotais(hours, mins) {
      return (hours * 60) + mins;
    };

    function init(allEmployees, allEquipes) {

      if (Usuario.perfil.accessLevel == 2 || Usuario.perfil.accessLevel == 3) {
        
        $scope.gestor = Usuario.funcionario;
        getEquipesByGestor();

      } else if (Usuario.perfil.accessLevel == 4) {
         
         $scope.isAdmin = true;
        //console.log('allEmployees: ', allEmployees.data);
        getAllEmployees(allEmployees, allEquipes);

      } else if (Usuario.perfil.accessLevel >= 5) {

        $scope.isAdmin = true;
        //console.log('allEmployees: ', allEmployees.data);
        getAllEmployees(allEmployees, allEquipes);

      } else {

        ////////console.log("Não deve ter acesso.");
        $scope.errorMsg = "Este funcionário não tem permissão para visualizar estas informações";

      }

      fillMeses();
      fillAnos();
    };
  }   

})();
