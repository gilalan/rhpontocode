/**
 * @author Gilliard Lopes
 * created on 04/12/2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.reports')
      .controller('ReportsCtrl', ReportsCtrl);

  /** @ngInject */
  function ReportsCtrl($scope, $filter, $location, $state, $interval, appointmentAPI, teamAPI, employeeAPI, reportsAPI, Auth, util, utilReports, utilCorrectApps, utilBancoHoras, usuario, feriados, allEmployees, allEquipes) {

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
    $scope.mes = "";
    $scope.ano = "";
    $scope.meses = [];
    $scope.anos = [];
    $scope.periodo = {}; //para data de referência da escala de revezamento
    $scope.periodoApontamento = [];
    $scope.checkboxModel = {
      equipe: false,
      funcionario: true
    };
    $scope.matchHistorico = false;
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

          $scope.matchHistorico = false;
          funcSel = searchEmployee($scope.funcionario.selected.id, $scope.employees);
          $scope.mes = mes;
          $scope.ano = ano;
          $scope.infoHorario = [];
          $scope.infoHorario = util.getInfoHorario(funcSel, []);
          equipe = funcSel.equipe;
          
          if (funcSel.historico){
            if (funcSel.historico.turnos){
              if (funcSel.historico.turnos.length > 0){
                $scope.horarioHistorico = {};
                $scope.horarioHistorico = util.getInfoHorarioHistorico(funcSel, [], mes, ano);
                if ($scope.horarioHistorico) {
                  $scope.matchHistorico = true;
                }
              }
            }
          }          
          console.log('periodo: ' + mes._id + ", " + ano.value);
          console.log('funcionario pego: ', funcSel);
          //$scope.infoHorario = util.getInfoHorario(funcSel, []);

          var dataInicial = new Date(ano.value, mes._id, 1);
          //Esse é um workaround pra funcionar a obtenção da quantidade de dias em Javascript
          //Dessa maneira a gnt obtém o último dia (valor zero no últ argumento) do mês anterior, que dá exatamente a qtde de dias do mês que vc quer
          //var dataFinal = new Date(ano.value, mes._id+1, 0);
          var dataFinal = new Date(ano.value, mes._id+1, 1);//primeiro dia do mês posterior

          getApontamentosByDateRangeAndEquipe(dataInicial, dataFinal, funcSel);         
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
        }
      };

      reportsAPI.getEspelhoPontoAll(objDateWorker).then(function successCallback(response){

        var arrayFuncAppoints = response.data;
        console.log("##*## Funcionários e apontamentos: ", arrayFuncAppoints);
        generateSuperPDF(dateAux, endDateAux, 1, arrayFuncAppoints);

      }, function errorCallback(response){
        
        $scope.errorMsg = response.data.message;
        console.log("Erro ao obter apontamentos por um range de data e equipe");
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

    $scope.corrigirErroZerados = function(){

      utilCorrectApps.correctRepeatedAppointments(apontamentosTesteCorrect);

    };

    $scope.alterarDataReferencia = function(){

      console.log("Data passada: ", $scope.periodo.dataReferencia);
      var flag = utilCorrectApps.changeBaseDate($scope.periodo.dataReferencia, apontamentosTesteCorrect);

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

    };

    function correctMarcacoesFtd(apontamentosErrosNull){

      
      
      appointmentAPI.correctMarcacoesFtd(apontamentosErrosNull).then(function successCallback(response){

        var resp = response.data;
        console.log("##*## Correcao dos erros: ", resp);
        //generateSuperPDF(dateAux, endDateAux, 1, arrayFuncAppoints);

      }, function errorCallback(response){
        
        $scope.errorMsg = response.data.message;
        console.log("Erro ao corrigir apontamentos...");
      });      

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
        $scope.dataReferenciaEscalaRevezamento = checkEscalaFillData(funcionario, apontamentosResponse);
        $scope.dataReferenciaEscalaRevezamentoFtd = $filter('date')($scope.dataReferenciaEscalaRevezamento, 'dd/MM/yyyy');
        //console.log("$scope dataReferencia: ", $scope.dataReferenciaEscalaRevezamento);
        var objRetorno = fillReportHtml(dateAux, endDateAux, 1, apontamentosResponse, funcionario);
        var apontamentosErrosNull = objRetorno.erros;
        if(apontamentosErrosNull.length > 0){
          //correctMarcacoesFtd(apontamentosErrosNull);
          //console.log("Erros: ", apontamentosErrosNull);
          //var correctedApps = utilCorrectApps.correctMarcacoesFtd(apontamentosErrosNull);
          //console.log("correctMarcacoesFtd: ", correctedApps);
        }
        $scope.periodoApontamento = objRetorno.retVal;

      }, function errorCallback(response){
        
        $scope.errorMsg = response.data.message;
        ////////console.log("Erro ao obter apontamentos por um range de data e equipe");
      });
    };

    function checkEscalaFillData(funcionario, apontamentos){

      var dataReferencia = null;
      var revezamentoFlag = false;

      if (funcionario.alocacao){
        if (funcionario.alocacao.turno){
          if (funcionario.alocacao.turno.escala){
            if (funcionario.alocacao.turno.escala.codigo == 2){
              revezamentoFlag = true;
            }
          }
        }
      } 

      if (revezamentoFlag){
        if (apontamentos.length > 0){
          //apontamentos.sort(function(a,b){return a.data - b.data;});
          apontamentos.sort(
            function (a, b) {
              if (a.data < b.data)
                return -1;
              if (a.data > b.data)
                return 1;
              return 0;
            } 
          );
          if(apontamentos[0].infoTrabalho.dataReferencia)
            dataReferencia = apontamentos[0].infoTrabalho.dataReferencia;
          else
            dataReferencia = funcionario.alocacao.dataInicioEfetivo;
        }
      }

      return dataReferencia;

    };

    //Traz todos os employees para tela de Administrador
    function getAllEmployees(allEmployees, allEquipes) {
      
      //var empsArray = allEmployees.data;
      $scope.equipes = allEquipes.data;
      fillEquipes();
      
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
      var cargoTemp;
      ////console.log('gsetor, equipes comonentes: ', $scope.equipes);
      for (var i=0; i<$scope.equipes.length; i++){
        for (var j=0; j<$scope.equipes[i].componentes.length; j++) {
          //console.log('C: ', $scope.equipes);
          cargoTemp = $scope.equipes[i].componentes[j].sexoMasculino ? $scope.equipes[i].componentes[j].alocacao.cargo.especificacao : $scope.equipes[i].componentes[j].alocacao.cargo.nomeFeminino;
          setEquipeAttrsForEmployee($scope.equipes[i].componentes[j], $scope.equipes[i]);
          $scope.employees.push($scope.equipes[i].componentes[j]);
          $scope.employeesNames.push( { 
            id: $scope.equipes[i].componentes[j]._id, 
            name: $scope.equipes[i].componentes[j].nome + ' ' + $scope.equipes[i].componentes[j].sobrenome,
            matricula: $scope.equipes[i].componentes[j].matricula,
            PIS: $scope.equipes[i].componentes[j].PIS,
            cbNameMatr: $scope.equipes[i].componentes[j].nome + ' ' + $scope.equipes[i].componentes[j].sobrenome + ', ' + 
            $scope.equipes[i].componentes[j].matricula + '(' + $scope.equipes[i].nome + ' - '+ cargoTemp +')',
            cargo: cargoTemp,
            equipe: $scope.equipes[i].nome
            // equipe: $scope.equipes[i]
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

      $scope.anos = [{value: '2020'}, {value: '2019'}, {value: '2018'}, {value: '2017'}];
      $scope.selectedAno = { item: $scope.anos[0] };
      ano = $scope.anos[0];
    };

    function fillReportHtml (startDate, endDate, interval, apontamentosSemanais, funcionario) {
      
      var interval = interval || 1;
      var objRetorno = {retVal: [], erros: []};
      // var retVal = [];
      var current = new Date(startDate);
      var endDate = new Date(endDate);

      var ferias = funcionario.ferias;

      //Tivemos que fazer um workaround para funcionar a obtenção dos apontamentos da data final no servidor
      //agora nós 'removemos' esse workaround:
      endDate = util.addOrSubtractDays(endDate, -1);

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
        apontamentoF = utilBancoHoras.getApontamentoFromSpecificDate(apontamentosSemanais, current);
        itemApontamento.order = i;
        itemApontamento.rawDate = new Date(current);
        itemApontamento.data = $filter('date')(new Date(current), 'abvFullDate2');
        itemApontamento.dataReport = $filter('date')(new Date(current), 'dd/EEE');
        //console.log('current ', current);

        if (apontamentoF){ //se tiver apontamento já tem os dados de horas trabalhadas
          
          if (apontamentoF.marcacoes.length > 0 || apontamentoF.status.id == 4 || apontamentoF.status.id == 5) {

            //console.log('apontamentoF #: ', apontamentoF);
            objEntradasSaidas = util.getEntradasSaidas(apontamentoF);
            // //console.log('objEntradasSaidas: ', objEntradasSaidas);
            if (objEntradasSaidas.erros){
              objRetorno.erros.push(apontamentoF);
            }
            itemApontamento.entradaSaidaFinal = objEntradasSaidas.esFinal;
            itemApontamento.entradasSaidasTodas = objEntradasSaidas.esTodas;
            itemApontamento.arrayEntSai = objEntradasSaidas.arrayEntSai;
            //na função getSaldoPresente temos as horas a trabalhar e trabalhadas
            itemApontamento.saldo = utilBancoHoras.getSaldoPresente(apontamentoF);
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
            else if (apontamentoF.status.id > 0){//Se for Incompleto, Erro ou Justificado...
              itemApontamento.observacao = apontamentoF.status.descricao;
              if (apontamentoF.status.id == 3)
                if (apontamentoF.status.justificativaStr)
                  itemApontamento.observacao += " (" + apontamentoF.status.justificativaStr + ")";
              else if (apontamentoF.status.id == 4) //abono
                itemApontamento.observacao += " (" + apontamentoF.status.abonoStr + ")";
            }
          } else {

            $scope.diasTrabalho--;
            itemApontamento.entradaSaidaFinal = "-";
            itemApontamento.arrayEntSai = [];
            itemApontamento.ocorrencia = {};
            itemApontamento.infoTrabalho = undefined;
            itemApontamento.saldo = {};
            utilBancoHoras.setInfoAusencia(itemApontamento, current, funcionario, feriados, funcionario.equipe); //injeta as informações de ausencia no apontamento
            var teste = itemApontamento.saldo.horasFtd;

            if (itemApontamento.ocorrencia.statusCodeString == "AUS"){ //Ausente quando deveria ter trabalhado
              $scope.diasParaTrabalhar++;
              saldoFinalNegativo -= -itemApontamento.ocorrencia.minutosDevidos;
              minParaTrabalhar += itemApontamento.ocorrencia.minutosDevidos;
              //colocar o saldo negativo faltante do dia para exibição no Relatório de Espelho de Ponto
              var devido = util.converteParaHoraMinutoSeparados(itemApontamento.ocorrencia.minutosDevidos);
              itemApontamento.saldo = {
                horasNegat: true,
                horasFtd: '-' + devido.hora + ':' + devido.minuto
              };
            } else if (itemApontamento.ocorrencia.statusCodeString == "FER"){ //de férias, nada deve ser contabilizado

            }
          }

        } else { //se não tiver apontamento tem que verificar qual o motivo (falta, feriado, folga, férias?)

          //////console.log('Não vai ter batidas em ', current);
          itemApontamento.entradaSaidaFinal = "-";
          itemApontamento.arrayEntSai = [];
          itemApontamento.ocorrencia = {};
          itemApontamento.saldo = {};
          //itemApontamento.observacao = "Sem Batidas";
          // setInfoAusencia(itemApontamento, current, false); //injeta as informações de ausencia no apontamento
          utilBancoHoras.setInfoAusencia(itemApontamento, current, funcionario, feriados, funcionario.equipe); //injeta as informações de ausencia no apontamento
          var teste = itemApontamento.saldo.horasFtd;

          if (itemApontamento.ocorrencia.statusCodeString == "AUS"){ //Ausente quando deveria ter trabalhado
            $scope.diasParaTrabalhar++;
            saldoFinalNegativo -= -itemApontamento.ocorrencia.minutosDevidos;
            minParaTrabalhar += itemApontamento.ocorrencia.minutosDevidos;
            //colocar o saldo negativo faltante do dia para exibição no Relatório de Espelho de Ponto
            var devido = util.converteParaHoraMinutoSeparados(itemApontamento.ocorrencia.minutosDevidos);
            itemApontamento.saldo = {
              horasNegat: true,
              horasFtd: '-' + devido.hora + ':' + devido.minuto
            };
            ////console.log('########quando falta: ', itemApontamento);
          } else if (itemApontamento.ocorrencia.statusCodeString == "FER"){ //de férias, nada deve ser contabilizado

          }
        }

        ////////console.log('itemApontamento depois: ', itemApontamento);
        objRetorno.retVal.push(itemApontamento);
        current = util.addOrSubtractDays(current, interval);
        i++;
      }

      var minTrabalhadosTot = util.converteParaHoraMinutoSeparados(minTrabalhados);
      var minParaTrabalharTot = util.converteParaHoraMinutoSeparados(minParaTrabalhar);
      $scope.minutosTrabalhadosFtd = minTrabalhadosTot.hora + ':' + minTrabalhadosTot.minuto;
      $scope.minutosParaTrabalharFtd = minParaTrabalharTot.hora + ':' + minParaTrabalharTot.minuto;
      var sfPos = util.converteParaHoraMinutoSeparados(saldoFinalPositivo);
      var sfNeg = util.converteParaHoraMinutoSeparados(saldoFinalNegativo);
      var diff = saldoFinalPositivo - saldoFinalNegativo;
      var sfTot = util.converteParaHoraMinutoSeparados(Math.abs(diff));
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
      objRetorno.retVal.sort(function (a, b) {
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
      return objRetorno;  
    };

    function getApontamentoFromSpecificDateAndPis(apontamentosSemanais, dataAtual, pis){

      for (var i=0; i<apontamentosSemanais.length; i++){

        if ((util.compareOnlyDates(dataAtual, new Date(apontamentosSemanais[i].data)) == 0) && 
          (pis == apontamentosSemanais[i].PIS)) {

          return apontamentosSemanais[i];
        }
      }

      return null;
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
        
        $scope.errorMsg = "Este funcionário não tem permissão para visualizar estas informações";

      }

      fillMeses();
      fillAnos();
    };
  }   

})();
