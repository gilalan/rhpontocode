/**
 * @author Gilliard Lopes
 * created on 04/12/2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.points')
      .controller('PointsCtrl', PointsCtrl)
      .controller('DesconsiderarPointCtrl', DesconsiderarPointCtrl)
      .controller('AddPointCtrl', AddPointCtrl)
      .controller('TratarPointCtrl', TratarPointCtrl)
      .controller('EditFolgaCompCtrl', EditFolgaCompCtrl);

  /** @ngInject */
  function PointsCtrl($scope, $filter, $location, $state, $uibModal, $timeout, $interval, appointmentAPI, teamAPI, employeeAPI, pointsAPI, Auth, util, utilReports, utilCorrectApps, utilBancoHoras, usuario, feriados, motivosAjuste, allEmployees, allEquipes) {

    console.log("Ja entrou no controller: ", feriados);
    var Usuario = usuario.data;
    var feriados = feriados.data;
    var mes = null;
    var ano = null;
    var equipe = {};
    var funcSel = {};
    var apontamentosTesteCorrect;
    var gestor = {};
    $scope.smartTablePageSize = 35;
    $scope.gestor = null;
    $scope.isGestorGeral = false;
    $scope.isAdmin = false;
    $scope.espelhoPonto = true;
    $scope.dataProcess = false;

    $scope.funcionario = {};
    $scope.employees = [];
    $scope.employeesNames = []; //Auxiliar para o AutoComplete do Input do nome do funcionario
    $scope.motivos = motivosAjuste.data;
    $scope.meses = [];
    $scope.anos = [];
    $scope.periodoApontamento = [];
    $scope.textoBotao = "Visualizar";
    $scope.mes = "";
    $scope.ano = "";
    $scope.matchHistorico = false;

    //Para auxílio no cálculo do banco de horas
    var saldoFinalPositivo = 0;
    var saldoFinalNegativo = 0;
    var minTrabalhados = 0;
    var minParaTrabalhar = 0;

    var pageDescPath = 'app/pages/point_management/modals/desconsiderarPointModal.html'; //representa o local que vai estar o html de conteúdo da modal
    var pageIncluirPath = 'app/pages/point_management/modals/addPointModal.html';
    var pageTratarPath = 'app/pages/point_management/modals/tratarPointModal.html';
    var pageEditFolgaCompPath = 'app/pages/point_management/modals/editFolgaComp.html';
    var defaultSize = 'md'; //representa o tamanho da Modal

    
    init(allEmployees, allEquipes);
    
    $scope.setMes = function (pMes) {
      mes = pMes;
    }

    $scope.setAno = function (pAno) { 
      ano = pAno;
    };

    $scope.edit = function(itemApontamento, index){      

      var modalInstance = $uibModal.open({
        animation: true,
        templateUrl: pageTratarPath,
        size: defaultSize,
        controller: 'TratarPointCtrl',
        resolve: {
          apontamentoObj: function () {
            return itemApontamento;
          },
          motivos: function() {
            return $scope.motivos;
          }
        }
      });

      modalInstance.result.then(function (newArrayES){
         
        if (newArrayES){

          console.log("retornou as marcações da seguinte maneira: ", newArrayES);
          _adjustItemApontamento(itemApontamento, newArrayES);
          //updateRowHtml(itemApontamento, newArrayES);
        } 

      }, function () {
        ////console.log('modal is dismissed or close.', args);
      });
    };

    $scope.editFolgaComp = function(itemApontamento, index){      

      var modalInstance = $uibModal.open({
        animation: true,
        templateUrl: pageEditFolgaCompPath,
        size: defaultSize,
        controller: 'EditFolgaCompCtrl',
        resolve: {
            apontamentoObj: function () {
                return itemApontamento;
            },
            funcionario: function() {
                return funcSel;
            },
            infoHorario: function() {
                return $scope.infoHorario;
            }
        }
      });

      modalInstance.result.then(function (valorHoras){
          
      if (valorHoras){

          console.log("retornou: ", valorHoras);
          _createFolgaCompensatoria(itemApontamento, valorHoras);
                    
      } 

      }, function () {
      ////console.log('modal is dismissed or close.', args);
      });
    };

    $scope.salvarMudancas = function(){

      $scope.dataProcess = true;
      _adjustApontamentos();
    };
   
    $scope.search = function () {

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
        //console.log('funcionario pego: ', funcSel);
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

        var dataInicial = new Date(ano.value, mes._id, 1);
        var dataFinal = new Date(ano.value, mes._id+1, 1);//primeiro dia do mês posterior

        getApontamentosByDateRangeAndEquipe(dataInicial, dataFinal, funcSel);         
      }
    }
   
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
        console.log("$scope dataReferencia: ", $scope.dataReferenciaEscalaRevezamento);
        $scope.periodoApontamento = fillReportHtml(dateAux, endDateAux, 1, apontamentosResponse, funcionario);

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
          apontamentos.sort(function(a,b){return a.data - b.data;});
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
      var cargoTemp;
      for (var i=0; i<$scope.equipes.length; i++){
        for (var j=0; j<$scope.equipes[i].componentes.length; j++) {
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
      var retVal = [];
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
      
      $scope.diasTrabalho = apontamentosSemanais.length;
      $scope.diasParaTrabalhar = 0;
      saldoFinalPositivo = 0;
      saldoFinalNegativo = 0;
      minTrabalhados = 0;
      minParaTrabalhar = 0;
      
      while (current <= endDate) {//navegar no período solicitado

        itemApontamento = {};
        objEntradasSaidas = {};
        apontamentoF = utilBancoHoras.getApontamentoFromSpecificDate(apontamentosSemanais, current);
        itemApontamento.apontamento = angular.copy(apontamentoF);
        itemApontamento.edited = false;
        itemApontamento.order = i;
        itemApontamento.rawDate = new Date(current);
        itemApontamento.data = $filter('date')(new Date(current), 'abvFullDate2');
        itemApontamento.dataReport = $filter('date')(new Date(current), 'dd/EEE');
        console.log('current ', current);

        if (apontamentoF){ //se tiver apontamento já tem os dados de horas trabalhadas
          
          if (apontamentoF.marcacoes.length > 0 || apontamentoF.status.id == 4 || apontamentoF.status.id == 5) {

            console.log('apontamentoF #: ', apontamentoF);
            objEntradasSaidas = util.getEntradasSaidas(apontamentoF);
            itemApontamento.entradaSaidaFinal = objEntradasSaidas.esFinal;
            itemApontamento.entradasSaidasTodas = objEntradasSaidas.esTodas;
            itemApontamento.arrayEntSai = objEntradasSaidas.arrayEntSai;
            itemApontamento.infoTrabalho = angular.copy(apontamentoF.infoTrabalho);
            itemApontamento.saldo = utilBancoHoras.getSaldoPresente(apontamentoF);
            if (itemApontamento.saldo.saldoDiario > 0) {
              saldoFinalPositivo += itemApontamento.saldo.saldoDiario;
            } else {
              saldoFinalNegativo -= itemApontamento.saldo.saldoDiario;
            }

            if (!apontamentoF.infoTrabalho.ferias){ //se era um dia de trabalho de fato, incrementa a variável
              $scope.diasParaTrabalhar++;
              minTrabalhados += apontamentoF.infoTrabalho.trabalhados;
              minParaTrabalhar += apontamentoF.infoTrabalho.aTrabalhar;
            }

            if (apontamentoF.infoTrabalho.ferias){
              itemApontamento.observacao = "Férias";
              itemApontamento.blocked = true; //se estiver de férias, bloqueia de ajustar
            }
            else if (apontamentoF.status.id > 0){ //Se for Incompleto, Erro ou Justificado...
              itemApontamento.observacao = apontamentoF.status.descricao;
              if (apontamentoF.status.id == 3)
                if (apontamentoF.status.justificativaStr)
                  itemApontamento.observacao += " (" + apontamentoF.status.justificativaStr + ")";
              else if (apontamentoF.status.id == 4) {//se abonado, bloqueia de ajustar
                itemApontamento.blocked = true;
                itemApontamento.observacao += " (" + apontamentoF.status.abonoStr + ")";
              }
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

        ////////console.log('itemApontamento depois: ', itemApontamento);
        retVal.push(itemApontamento);
        current = util.addOrSubtractDays(current, interval);
        i++;
      }

      _calcularResumoBancoHoras();
      
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
      return retVal;  
    };

    function _calcularResumoBancoHoras(){

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

    };

    function _adjustItemApontamento(itemApontamento, newArrayES){

      var batimentosAtivosAntesLength = itemApontamento.arrayEntSai.filter(function( obj ) {
        return obj.desconsiderada === false;
      }).length;
      var diffTrabalhados = 0;
      var saldoAnterior = 0;

      itemApontamento.edited = _isEdited(itemApontamento, newArrayES);

      var batimentosAtivos = newArrayES.filter(function( obj ) {
        return obj.desconsiderada === false;
      });

      var objEntradasSaidas = util.getEntradasSaidasOnly(batimentosAtivos);
      itemApontamento.entradaSaidaFinal = objEntradasSaidas.esFinal;
      itemApontamento.entradasSaidasTodas = objEntradasSaidas.esTodas;
      itemApontamento.arrayEntSai = angular.copy(newArrayES); //não usa o do retorno...

      //Se já tinha um objeto infoTrabalho, então tinha um 'apontamento' anteriormente...
      if (itemApontamento.infoTrabalho != undefined){
        var trabalhadosAntes = itemApontamento.infoTrabalho.trabalhados;
        saldoAnterior = itemApontamento.saldo.saldoDiario;
        console.log("trabalhados antes: ", trabalhadosAntes);
        itemApontamento.infoTrabalho.trabalhados = util.calcularHorasMarcacoesPropostas(batimentosAtivos);
        console.log("trabalhados depois: ", itemApontamento.infoTrabalho.trabalhados);
        diffTrabalhados = itemApontamento.infoTrabalho.trabalhados - trabalhadosAntes;
        console.log("trabalhados DIFF: ", diffTrabalhados);
        minTrabalhados += diffTrabalhados; //variável global
        //Rebate o saldo anterior do que já foi calculado...
        if (saldoAnterior > 0) {
          saldoFinalPositivo -= saldoAnterior;
        } else {
          saldoFinalNegativo += saldoAnterior;
        }

        if (itemApontamento.edited){
          if (batimentosAtivos.length == 0)
            $scope.diasTrabalho--;

          if(batimentosAtivos.length > 0 && batimentosAtivosAntesLength == 0)
            $scope.diasTrabalho++;
        }        
        
      } else {

        console.log("não tem infoTrabalho, temos que criar");
        var newInfoTrabalho = _createInfoTrabalho(itemApontamento.rawDate, batimentosAtivos);
        if (newInfoTrabalho){

          itemApontamento.infoTrabalho = newInfoTrabalho;
          console.log("infoTrabalho criado: ", newInfoTrabalho);

          $scope.diasTrabalho++;
          minTrabalhados += itemApontamento.infoTrabalho.trabalhados;

          saldoAnterior = itemApontamento.ocorrencia.minutosDevidos;
          console.log("minutos devidos anteriormente: ", saldoAnterior);
          console.log("Saldo Final Negativo: ", saldoFinalNegativo);
          console.log("Saldo Final Positivo: ", saldoFinalPositivo);
          //rebate o saldo anterior de minutos devidos
          saldoFinalNegativo -= saldoAnterior;

        } else {
          alert("Ocorreu um erro ao buscar as informações de trabalho do funcionário, favor tentar novamente.");
        }
      }

      //Calcula o novo saldo e acrescenta o valor atualizado
      itemApontamento.saldo = utilBancoHoras.getSaldoPresente(itemApontamento);
      console.log("item apontamento atual: ", itemApontamento);
      if (itemApontamento.saldo.saldoDiario > 0) {
        saldoFinalPositivo += itemApontamento.saldo.saldoDiario;
      } else {
        saldoFinalNegativo -= itemApontamento.saldo.saldoDiario;
      }
      if (!itemApontamento.infoTrabalho.ferias){
        itemApontamento.observacao = "Justificado";
      }

      _calcularResumoBancoHoras();

    };

    function _createFolgaCompensatoria(itemApontamento, valorHoras){
      
      _adjustItemApontamento(itemApontamento, []);
      itemApontamento.observacao = "Folga Compensatória";
      itemApontamento.FC = true;
      // if(!itemApontamento.apontamento){
      //   _criarNovoApontamentoFC(itemApontamento, valorHoras);
      // } else {
      //   _modificarApontamentoFC(itemApontamento, valorHoras);
      // }
      itemApontamento.edited = true;

    };

    function _isEdited(itemApontamento, newArrayES){

      var changed = false;
      //verificar se as novas marcações coincidem com as anteriores ou não
      //caso não coincida, então foi editado, edited = true;
      if (itemApontamento.infoTrabalho == undefined){
        if (newArrayES.length > 0)
          changed = true;

      } else {

        var arrayParametro = [];
        if(!itemApontamento.apontamento)
          arrayParametro = itemApontamento.arrayEntSai;        
        else
          arrayParametro = itemApontamento.apontamento.marcacoes;        

        if (newArrayES.length != arrayParametro.length)
          changed = true;
        else {
          for (var i=0; i<arrayParametro.length; i++){
            for (var j=0; j<newArrayES.length; j++){
              if (arrayParametro[i].id == newArrayES[j].id){
                if (arrayParametro[i].horario != newArrayES[j].horario)
                  changed = true;
              }
            }
          }
        }
      }
      return changed;
    };

    function updateRowHtml(itemApontamento, objNovasMarcacoes){

      var batimentosDesconsiderados = [];
      var diffTrabalhados = 0;
      var saldoAnterior = 0;

      if(objNovasMarcacoes.marcacoes.length > 0){
        itemApontamento.edited = true;//vai gerar uma observação do tipo "Justificado"
      }      

      //se tiver apontamento, edita ele
      if (itemApontamento.apontamento){

        //atualiza e concatena os novos apontamentos
        if (itemApontamento.apontamento.marcacoes)
          itemApontamento.apontamento.marcacoes = itemApontamento.apontamento.marcacoes.concat(objNovasMarcacoes.marcacoes);
        else
          itemApontamento.apontamento.marcacoes = objNovasMarcacoes.marcacoes;
        
        itemApontamento.apontamento.marcacoesFtd = objNovasMarcacoes.marcacoesFtd;

        var objBatidas = util.reorganizarBatidasPropostas(itemApontamento.apontamento.marcacoes);
        batimentosDesconsiderados = objBatidas.removed;
        itemApontamento.apontamento.marcacoes = objBatidas.actives;
        //fim da atualização/concatenação

        var objEntradasSaidas = util.getEntradasSaidas(itemApontamento.apontamento);
        itemApontamento.entradaSaidaFinal = objEntradasSaidas.esFinal;
        itemApontamento.entradasSaidasTodas = objEntradasSaidas.esTodas;
        itemApontamento.arrayEntSai = objEntradasSaidas.arrayEntSai;

        var trabalhadosAntes = itemApontamento.apontamento.infoTrabalho.trabalhados;
        saldoAnterior = itemApontamento.saldo.saldoDiario;
        console.log("trabalhados antes: ", trabalhadosAntes);
        _updateApontamento(itemApontamento.apontamento);
        console.log("trabalhados depois: ", itemApontamento.apontamento.infoTrabalho.trabalhados);
        diffTrabalhados = itemApontamento.apontamento.infoTrabalho.trabalhados - trabalhadosAntes;
        console.log("trabalhados DIFF: ", diffTrabalhados);
        minTrabalhados += diffTrabalhados;
        //Rebate o saldo anterior do que já foi calculado...
        if (saldoAnterior > 0) {
          saldoFinalPositivo -= saldoAnterior;
        } else {
          saldoFinalNegativo += saldoAnterior;
        }
        //Calcula o novo saldo e acrescenta o valor atualizado
        itemApontamento.saldo = utilBancoHoras.getSaldoPresente(itemApontamento.apontamento);
        //console.log("item apontamento atual: ", itemApontamento);
        if (itemApontamento.saldo.saldoDiario > 0) {
          saldoFinalPositivo += itemApontamento.saldo.saldoDiario;
        } else {
          saldoFinalNegativo -= itemApontamento.saldo.saldoDiario;
        }
        if (!itemApontamento.apontamento.infoTrabalho.ferias){
          itemApontamento.observacao = itemApontamento.apontamento.status.descricao;
        }

      } else {

        console.log("não tem apontamento, temos que criar");
        objNovasMarcacoes.data = itemApontamento.rawDate;
        var newApontamento = criarNovoApontamento(objNovasMarcacoes);
        itemApontamento.apontamento = newApontamento;              

        var objEntradasSaidas = util.getEntradasSaidas(itemApontamento.apontamento);
        itemApontamento.entradaSaidaFinal = objEntradasSaidas.esFinal;
        itemApontamento.entradasSaidasTodas = objEntradasSaidas.esTodas;
        itemApontamento.arrayEntSai = objEntradasSaidas.arrayEntSai;

        $scope.diasTrabalho++;
        minTrabalhados += itemApontamento.apontamento.infoTrabalho.trabalhados;

        saldoAnterior = itemApontamento.ocorrencia.minutosDevidos;
        console.log("minutos devidos anteriormente: ", saldoAnterior);
        console.log("Saldo Final Negativo: ", saldoFinalNegativo);
        console.log("Saldo Final Positivo: ", saldoFinalPositivo);
        //rebate o saldo anterior de minutos devidos
        saldoFinalNegativo -= saldoAnterior;
        //Calcula o novo saldo e acrescenta o valor atualizado
        itemApontamento.saldo = utilBancoHoras.getSaldoPresente(itemApontamento.apontamento);
        console.log("item apontamento atual: ", itemApontamento);
        if (itemApontamento.saldo.saldoDiario > 0) {
          saldoFinalPositivo += itemApontamento.saldo.saldoDiario;
        } else {
          saldoFinalNegativo -= itemApontamento.saldo.saldoDiario;
        }
        if (!itemApontamento.apontamento.infoTrabalho.ferias){
          itemApontamento.observacao = itemApontamento.apontamento.status.descricao;
        }
      }      

      _calcularResumoBancoHoras();

    };

    function _adjustApontamentos(){

      var apontamentosModificados = [];
      var apontamentosNovos = [];
      var currentItemApont = {};

      for (var i=0; i < $scope.periodoApontamento.length; i++){
        currentItemApont = angular.copy($scope.periodoApontamento[i]);

        if (currentItemApont.edited){
          console.log("apontamento editado, devo enviar");
          if (currentItemApont.apontamento){
            _coletarHistorico(currentItemApont.apontamento);
            if (currentItemApont.FC)
              _modificarApontamentoFC(currentItemApont, -1);
            else
              _modificarApontamento(currentItemApont);
            apontamentosModificados.push(currentItemApont.apontamento);
          } else {
            var newApont;
            if(currentItemApont.FC)
              newApont = _criarNovoApontamentoFC(currentItemApont, -1);
            else
              newApont = _criarNovoApontamento(currentItemApont);
            
            apontamentosNovos.push(newApont);
          }
        }
      }
      console.log("Vai enviar: ", {novos: apontamentosNovos, antigos: apontamentosModificados});
      savePeriodoApontamentos({novos: apontamentosNovos, antigos: apontamentosModificados});
    };

    function _coletarHistorico(apontamento){
      
      console.log("coletar historico");
      var historicoArray = apontamento.historico;
      var itemId = 1;
      if (historicoArray.length > 0)
        itemId = historicoArray.length + 1;

      var justificativaStr = "Ajuste de batimento confirmado e aprovado pelo Gestor";

      var nextItemHistorico = {
        id: itemId,
        infoTrabalho: angular.copy(apontamento.infoTrabalho),
        marcacoes: angular.copy(apontamento.marcacoes),
        marcacoesFtd: angular.copy(apontamento.marcacoesFtd),
        justificativa: justificativaStr,
        gerencial: {
          dataAlteracao: new Date(),
          gestor: {
            nome: gestor.nome,
            sobrenome: gestor.sobrenome,
            email: gestor.email,
            PIS: gestor.PIS
          }
        }
      };

      console.log('nextItemHistorico: ', nextItemHistorico);
      historicoArray.push(nextItemHistorico);
    };

    function _getInfoApontamento(arrayES){

      var novasMarcacoes = arrayES.filter(function( obj ) {
        return obj.desconsiderada === false;
      }).sort(function(a, b){//ordena o array de marcaçõesFtd
        return a.totalMin > b.totalMin;
      });

      var novasMarcacoesFtd = [];
      for(var i=0; i<novasMarcacoes.length; i++){
        novasMarcacoesFtd.push(novasMarcacoes[i].horario);        
      }
      novasMarcacoesFtd.sort(function(a, b){//ordena o array de marcaçõesFtd
        return a > b;
      });

      for (var i=0; i<novasMarcacoes.length; i++){
        if (novasMarcacoes[i].incluida)
          delete novasMarcacoes[i].incluida;
        if (novasMarcacoes[i].rDescricao)
          delete novasMarcacoes[i].rDescricao;
      }

      var statusObj = {
        id: 3,
        descricao: "Justificado",
        justificativaStr: util.getJustificativaStr(novasMarcacoes)
      };

      return {nm: novasMarcacoes, nmftd: novasMarcacoesFtd, sta: statusObj};
    };

    function _modificarApontamento(itemApontamento){

      console.log("modificar apontamento", itemApontamento.apontamento.data);
      var apontamentoInfo = _getInfoApontamento(itemApontamento.arrayEntSai);
      itemApontamento.apontamento.marcacoes = apontamentoInfo.nm;
      itemApontamento.apontamento.marcacoesFtd = apontamentoInfo.nmftd;
      itemApontamento.apontamento.infoTrabalho = itemApontamento.infoTrabalho;
      itemApontamento.apontamento.status = apontamentoInfo.sta;
      console.log("após mudanças: ", itemApontamento.apontamento);
    };
    
    function _modificarApontamentoFC(itemApontamento, valorHoras){

      console.log("modificar apontamento", itemApontamento.apontamento.data);
      //var apontamentoInfo = _getInfoApontamento(itemApontamento.arrayEntSai);
      itemApontamento.apontamento.marcacoes = [];
      itemApontamento.apontamento.marcacoesFtd = [];
      itemApontamento.apontamento.infoTrabalho.trabalhados = valorHoras == -1 ? 0 : 60*valorHoras;
      itemApontamento.apontamento.status = {id: 5, descricao: "Folga Compensatória", abonoStr: ""};
      console.log("após mudanças: ", itemApontamento.apontamento);

    };

    function _criarNovoApontamentoFC(itemApontamento, valorHoras){
      
      console.log("Criando novo apontamento de FOLGA COMP...");
      var data = util.getOnlyDate(new Date(itemApontamento.rawDate));

      var apontamento = {
        data: data,
        funcionario: funcSel,
        PIS: funcSel.PIS,
        status: {id: 5, descricao: "Folga Compensatória", abonoStr: ""},
        justificativa: "",
        infoTrabalho: itemApontamento.infoTrabalho,
        marcacoes: [],
        marcacoesFtd: [],
        historico: []
      };
      
      if(itemApontamento.infoTrabalho == undefined){

        var infoTrabalho = util.getInfoTrabalho(funcSel, equipe, data, feriados);
        apontamento.infoTrabalho = infoTrabalho;

      } 

      if (valorHoras == -1)
        apontamento.infoTrabalho.trabalhados = 0;      
      else
        apontamento.infoTrabalho.trabalhados = 60*valorHoras;

      console.log('apontamento a ser criado: ', apontamento);
      return apontamento;
    };

    function _criarNovoApontamento(itemApontamento, anotherDate){
      
      console.log("Criando novo apontamento...");
      var data = util.getOnlyDate(new Date(itemApontamento.rawDate));
      if (anotherDate) 
        data = util.getOnlyDate(new Date(anotherDate));

      var apontamentoInfo = _getInfoApontamento(itemApontamento.arrayEntSai);
      
      var apontamento = {
        data: data,
        funcionario: funcSel,
        PIS: funcSel.PIS,
        status: apontamentoInfo.sta,
        justificativa: "",
        infoTrabalho: itemApontamento.infoTrabalho,
        marcacoes: apontamentoInfo.nm,
        marcacoesFtd: apontamentoInfo.nmftd,
        historico: []
      };

      console.log('apontamento a ser criado: ', apontamento);
      return apontamento;
    };

    function savePeriodoApontamentos(arrayApontamentos){

      console.log("Objeto enviado para atualização: ", arrayApontamentos);
      appointmentAPI.createAndUpdateMany(arrayApontamentos).then(function sucessCallback(response){

        console.log("salvos com sucesso!");
        $scope.dataProcess = false;
        $state.reload();        

      }, function errorCallback(response){

        $scope.errorMsg = response.data.message;
        console.log("Erro no SAVE do apontamento + solicitacao: ", response.data.message);
        $scope.dataProcess = false;
        alert("Deu erro: " + response.data.message);
      });
    };

    function _updateApontamento(apontamento){

      console.log("modificar apontamento");
      var statusObj = {
        id: 3,
        descricao: "Justificado"
      };      

      apontamento.infoTrabalho.trabalhados = util.calcularHorasMarcacoesPropostas(apontamento.marcacoes);
      apontamento.status = statusObj;
    };

    function _createInfoTrabalho(date, batimentosAtivos){

      var data = util.getOnlyDate(new Date(date));
      var infoTrabalho = util.getInfoTrabalho(funcSel, equipe, data, feriados);
      infoTrabalho.trabalhados = util.calcularHorasMarcacoesPropostas(batimentosAtivos);
      return infoTrabalho;
    };

    function criarNovoApontamento(objNovasMarcacoes){

      var data = util.getOnlyDate(new Date(objNovasMarcacoes.data));
      var infoTrabalho = util.getInfoTrabalho(funcSel, equipe, data, feriados);
      var objBatidas = util.reorganizarBatidasPropostas(objNovasMarcacoes.marcacoes);

      infoTrabalho.trabalhados = util.calcularHorasMarcacoesPropostas(objBatidas.actives);

      if (!infoTrabalho){
        $scope.errorMsg = "Código 1020: Não foi possível obter a informação de horário do funcionário.";
        return $scope.errorMsg;
      }

      var apontamento = {
        data: data,
        funcionario: funcSel._id,
        PIS: funcSel.PIS,
        status: {
          id: 3,
          descricao: "Justificado"
        },
        justificativa: "",
        infoTrabalho: infoTrabalho,
        marcacoes: objBatidas.actives,
        marcacoesFtd: objNovasMarcacoes.marcacoesFtd,
        historico: []
      };

      //console.log('apontamento a ser criado: ', apontamento);
      return apontamento;      
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

      console.log("Perfil: ", Usuario.perfil);

      if (Usuario.perfil.accessLevel == 2 || Usuario.perfil.accessLevel == 3) {
        
        $scope.gestor = Usuario.funcionario;
        getEquipesByGestor();

      } else if (Usuario.perfil.accessLevel == 4) {
         
         $scope.isAdmin = true;
        getAllEmployees(allEmployees, allEquipes);

      } else if (Usuario.perfil.accessLevel >= 5) {

        $scope.isAdmin = true;
        getAllEmployees(allEmployees, allEquipes);

      } else {

        $scope.errorMsg = "Este funcionário não tem permissão para visualizar estas informações";

      }

      if (!$scope.gestor){
          
        var currentUser = Auth.getCurrentUser();
        gestor = {
          nome: currentUser._id,
          sobrenome: currentUser._id,
          email: currentUser.email,
          PIS: currentUser.email
        };
      } else {
        gestor.nome = $scope.gestor.nome;
        gestor.sobrenome = $scope.gestor.sobrenome;
        gestor.PIS = $scope.gestor.PIS;
        gestor.email = $scope.gestor.email;
      }

      fillMeses();
      fillAnos();
    };
  };

  function AddPointCtrl($uibModalInstance, $scope, $state, $filter, util, apontamentoObj, motivos){
       

  };  

  function DesconsiderarPointCtrl($uibModalInstance, $scope, $state, $filter, util, apontamentoObj){
   
    $scope.algo = {};
    $scope.errorMsg = null;
    $scope.apontamento = apontamentoObj;

  };  

  function TratarPointCtrl($uibModalInstance, $scope, $state, $filter, util, apontamentoObj, motivos){
    
    $scope.algo = {};
    $scope.errorMsg = null;
    $scope.apontamento = apontamentoObj; //na verdade, é o itemApontamento
    $scope.motivos = motivos;
    $scope.selected = {};
    $scope.arrayES = [];

    if(apontamentoObj){
      $scope.arrayES = angular.copy($scope.apontamento.arrayEntSai);
    }

    //var novasMarcacoes = {marcacoes: [], marcacoesFtd: [], desconsideradas: []};

    //ISSO EH PRA COLOCAR NA MODAL DE INCLUIR/TRATAR
    if ($scope.motivos.length > 0)
      $scope.selected = { item: $scope.motivos[0] };

    console.log("apontamento: ", apontamentoObj);

    $scope.incluirBatimentoLocal = function(batida){

      //console.log('motivo', $scope.selected.item);
      if (batida.horario){
        var objHorario = util.isValidHorarioField(batida.horario);
        if (!objHorario){
          $scope.errorMsg = "O horário deve estar no formato 00 a 23 para as Horas e 00 a 59 para os minutos";
        } else {
          //console.log('objHorario: ', objHorario);
          var marcacao = {
            incluida: true, //tem que remover na hora de enviar o objeto, é só local isso
            id: undefined,
            descricao: undefined,
            rDescricao: undefined,
            hora: objHorario.hora,
            minuto: objHorario.minutes,
            segundo: 0,
            totalMin: objHorario.totalMinutes,
            horario: objHorario.horarioFtd,
            tzOffset: (new Date()).getTimezoneOffset(),
            RHWeb: false,
            REP: false,
            NSR: "MANUAL",
            desconsiderada: false,
            reconvertida: false,
            motivo: $scope.selected.item.nome,
            gerada: {created_at: new Date()}
          };
          
          $scope.arrayES.push(marcacao);
          $scope.arrayES = util.reorganizarBatidasPropostasTemp($scope.arrayES);
          $scope.algo = {};//reseta a batida...
          console.log("array ES? ", $scope.arrayES);
        }
      } else {
        $scope.errorMsg = "O horário deve estar no formato 00 a 23 para as Horas e 00 a 59 para os minutos";
      }

    };

    $scope.desconsiderar = function(index){

      var horario = $scope.arrayES[index].horario;
      console.log("Horario? ", horario);
      if ($scope.arrayES[index].incluida){
        
        $scope.arrayES.splice(index, 1); //remove de fato do array...
        
      } else {
        //é batida antiga que será desconsiderada...
        $scope.arrayES[index].desconsiderada = true;
      }

      $scope.arrayES = util.reorganizarBatidasPropostasTemp($scope.arrayES);
      console.log("arrayES: ", $scope.arrayES);
      // console.log("$scopeApontamente: ", $scope.apontamento.apontamento);
    };

    $scope.reconsiderar = function(index){

      $scope.arrayES[index].desconsiderada = false;
      $scope.arrayES = util.reorganizarBatidasPropostasTemp($scope.arrayES);
      console.log("arrayES: ", $scope.arrayES);
    };

    $scope.confirmaInclusao = function(batida) {
      
      if(_estaOk()){
        
        // for (var i=0; i<$scope.arrayES.length; i++){
          // if ($scope.arrayES[i].desconsiderada == false)
          //   novasMarcacoes.marcacoesFtd.push($scope.arrayES[i].horario);
          // else
          //   novasMarcacoes.desconsideradas.push($scope.arrayES[i].horario);
        // }
        // $uibModalInstance.close(novasMarcacoes);
        $uibModalInstance.close($scope.arrayES);

      } else {
        $scope.errorMsg = "Os batimentos totais devem ser um número par, ou seja, para cada entrada deve ter uma saída.";
      }
    };

    function _estaOk(){

      var countActives = 0;
      for (var i=0; i<$scope.arrayES.length; i++){
        if ($scope.arrayES[i].desconsiderada == false)
          countActives++;
      }

      return (countActives % 2 == 0) ? true : false;
      
    };
    
  }; 

  function EditFolgaCompCtrl ($uibModalInstance, $scope, $state, $filter, util, apontamentoObj, funcionario, infoHorario){

    console.log("Apontamentos; ", apontamentoObj);
    console.log("Funcionario: ", funcionario);
    $scope.checked = true;
    var currentDate = new Date(apontamentoObj.data);
    $scope.parcial = '-';
    $scope.errorMsg = null;
    $scope.apontamento = apontamentoObj;
    $scope.apontamento.dataCompleta = $filter('date')(apontamentoObj.data, 'abvFullDate');
    $scope.funcionario = funcionario;
    $scope.infoHorario = infoHorario;
    // $scope.funcionario.alocacao.jornadaStr = funcionario.alocacao.turno.escala.codigo == 1 ? 
    // funcionario.alocacao.turno.jornada.array[currentDate.getDay()].horarioFtd : 
    // funcionario.alocacao.turno.jornada.array[0].horarioFtd;

    $scope.changeCheckBox = function(){

      $scope.checked = !$scope.checked;
      // if ($scope.checked)
      //   $scope.parcial = '-';
      // else
      //   $scope.parcial = "0";
    };

    $scope.confirmaFC = function(batida) {
            
      if($scope.checked){
              
        console.log('esta ok - folga total');
        $uibModalInstance.close(-1);

      } else {

        alert("Para salvar, faz-se necessario marcar a caixa de Folga Compensatória.");
        // if(_estaOk()){
        //   console.log('esta ok - folga parcial');
        //   $uibModalInstance.close(parseInt($scope.parcial));
        // }
        // else
        //   $scope.errorMsg = "O Valor de quantidade de horas deve ser um numero inteiro positivo.";
      }
    };

    function _estaOk(){
      
      if(checkInp()){
        var horas = parseInt($scope.parcial);
        if(horas > 0)
          return true;
        else
          return false;
      }
      else {
        return false;
      }      
    };

    function checkInp()
    {
      var x = $scope.parcial;
      var regex=/^[0-9]+$/;
      if (x.match(regex))
      {        
        return true;
      }
      else{
        return false;
      }
    };

  };

})();
