/**
 * @author Gilliard Lopes
 * created on 17.05.2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.adjustsolicitation')
      .controller('AdjustSolicitationCtrl', AdjustSolicitationCtrl)
      .controller('DesconsiderarCtrl', DesconsiderarCtrl)
      .controller('IncluirBatimentoCtrl', IncluirBatimentoCtrl)
      .controller('ConfirmationModalCtrl', ConfirmationModalCtrl);

  /** @ngInject */
  function AdjustSolicitationCtrl($scope, $filter, $state, $uibModal, appointmentAPI, myhitpointAPI, usuario, currentDate, feriados) {

    var usuario = usuario.data;
    var feriados = feriados.data;
    var arrayESOriginal = [];

    $scope.liberado = false;
    $scope.currentDate = new Date(currentDate.data.date);
    $scope.funcionario = usuario.funcionario;
    $scope.currentDateFtd = $filter('date')($scope.currentDate, 'abvFullDate');
    $scope.arrayES = [];
    $scope.ajuste = {};

    var pagePath = 'app/pages/adjust_solicitation/modals/desconsiderarModal.html'; //representa o local que vai estar o html de conteúdo da modal
    var pageIncluirPath = 'app/pages/adjust_solicitation/modals/incluirBatimentoModal.html';
    var pageConfirmationPath = 'app/pages/adjust_solicitation/modals/confirmationModal.html';
    var defaultSize = 'md'; //representa o tamanho da Modal

    //console.log('data ftd? ', $scope.currentDate);

    // $scope.reconverter = function(index){
    //   //console.log('descricao atual: ', $scope.arrayES[index]);
    //   //console.log('descricao atual: ', $scope.arrayES[index].descricao);
    //   //console.log('horario atual: ', $scope.arrayES[index].horario);
    // };
    $scope.propor = function(ajuste){
      
      console.log('clicou para propor ajuste: ', ajuste);

      var marcacoesPropostas = reorganizarBatidasPropostas($scope.arrayES);
      
      var solicitacaoAjuste = {
        data: $scope.currentDate,
        funcionario: $scope.funcionario._id,
        status: 0, //pendente (-1 é reprovada) e (1 é aprovada)
        motivo: ajuste.motivo,
        anterior: {
          marcacoes: arrayESOriginal
        },
        proposto: {
          marcacoes: marcacoesPropostas
        }
      };
      
      openConfirmaAjuste(solicitacaoAjuste);  
    };

    $scope.incluir = function(){

      openIncluirModal($scope.currentDate, $scope.arrayES);
    };

    $scope.desconsiderar = function(index){
      
      openDesconsiderarModal($scope.currentDate, $scope.arrayES, index);
    };

    //Compara duas marcações e retorna a "menor" (que bateu mais cedo no dia)
    //cuidado com as batidas pelo relógio, NSR de uma menor que a outra se for na mesma hora...
    function compare(a, b) {
      if (a.totalMin < b.totalMin)
        return -1;
      if (a.totalMin > b.totalMin)
        return 1;
      return 0;
    }    

    /**
    * 1. Remove os pontos que foram descartados
    * 2. Dá um sort pelo totalMin para organizar na sequencia as batidas
    * 3. Cria o orderId e as Descrições e acopla aos batimentos que ja estão na ordem correta
    */
    function reorganizarBatidasPropostas(arrayES){
      
      //1.
      var newArrayES = arrayES.filter(function( obj ) {
        return obj.desconsiderada === false;
      });
      //2.
      newArrayES.sort(compare);

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
            newArrayES[i-1].descricao = "Entrada "+(Math.floor(i/2) + 1);
          }
        }
      }

      return newArrayES;
    };

    //seria bom mostrar telinha confirmando as alterações...
    function openConfirmaAjuste(solicitacaoAjuste) {
      
      var modalInstance = $uibModal.open({
        animation: true,
        templateUrl: pageConfirmationPath,
        size: defaultSize,
        controller: 'ConfirmationModalCtrl',
        resolve: {
          solicitacaoAjuste: function () {
            return solicitacaoAjuste;
          }
        }
      });

      modalInstance.result.then(function (confirmation){

        if (confirmation){
          $state.reload();
        }
      }, function (args) {
        console.log('dismissed confirmation');
      });
    };

    function openDesconsiderarModal (data, arrayES, indice) {

      var objBatida = {
        data: data,
        array: arrayES,
        index: indice
      }

      var modalInstance = $uibModal.open({
        animation: true,
        templateUrl: pagePath,
        size: defaultSize,
        controller: 'DesconsiderarCtrl',
        resolve: {
          objBatida: function () {
            return objBatida;
          }
        }
      });

      modalInstance.result.then(function (result){

        //console.log('Result: ', result);
        if (result.index){

          $scope.arrayES[result.index].desconsiderada = true;
          $scope.arrayES[result.index].motivo = result.motivo;
        }

        //console.log('array novo: ', $scope.arrayES);

      }, function (args) {

        //console.log('modal is dismissed or closed.', args);

      });
    };

    function openIncluirModal (data, arrayES) {

      var objBatida = {
        data: data        
      }

      var modalInstance = $uibModal.open({
        animation: true,
        templateUrl: pageIncluirPath,
        size: defaultSize,
        controller: 'IncluirBatimentoCtrl',
        resolve: {
          objBatida: function () {
            return objBatida;
          }
        }
      });

      modalInstance.result.then(function (marcacao){
         
        console.log('result?.', marcacao);
        console.log('array? ', $scope.arrayES);
        
        if (marcacao){

          $scope.arrayES.push(marcacao);
          $scope.apontamento = true; //AJEITAR ISSO PLS
        } 

      }, function () {
        //console.log('modal is dismissed or close.', args);
      });
    };

    function getApontamentosByDateRangeAndEquipe(beginDate, intervaloDias, componentes) {

      ////console.log('beginDate? ', beginDate);
      ////console.log('intervaloDias? ', intervaloDias);
      var dateAux = new Date(beginDate);

      var objDateEquipe = {
        date: {
          raw: beginDate,
          year: dateAux.getFullYear(),
          month: dateAux.getMonth(),
          day: dateAux.getDate(),
          hour: dateAux.getHours(),
          minute: dateAux.getMinutes()
        }, 
        dias: intervaloDias.dias, 
        equipe: componentes
      };

      ////console.log("Objeto Date Equipe Enviado: ", objDateEquipe);

      appointmentAPI.getApontamentosByDateRangeAndEquipe(objDateEquipe).then(function successCallback(response){

        $scope.apontamento = null;
        var apontamentosResponse = response.data;
        var itemApontamento = {};
        var objEntradasSaidas = {};
        //console.log("!@# Apontamentos Semanais: ", apontamentosResponse);
        if (apontamentosResponse.length > 0){
          $scope.apontamento = response.data[0];          
          itemApontamento.rawDate = new Date($scope.currentDate);
          itemApontamento.data = $filter('date')(itemApontamento.rawDate, 'abvFullDate2');

          objEntradasSaidas = getEntradasSaidas($scope.apontamento);
          itemApontamento.entradaSaidaFinal = objEntradasSaidas.esFinal;
          // itemApontamento.arrayEntSai = objEntradasSaidas.arrayEntSai;
          // itemApontamento.saldo = getSaldoPresente($scope.apontamento);
          $scope.arrayES = objEntradasSaidas.arrayEntSai;
        }

      }, function errorCallback(response){
        
        $errorMsg = response.data.message;
        ////console.log("Erro ao obter apontamentos por um range de data e equipe");
      });
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

      arrayESOriginal = angular.copy(apontamentoF.marcacoes);

      for (var i=0; i<apontamentoF.marcacoes.length; i++){

        itemDescricaoHorario = {};
        strDescricao = "";
        strDescricao = apontamentoF.marcacoes[i].descricao;
        
        itemDescricaoHorario.id = apontamentoF.marcacoes[i].id;
        itemDescricaoHorario.descricao = strDescricao;
        itemDescricaoHorario.hora = apontamentoF.marcacoes[i].hora;
        itemDescricaoHorario.minuto = apontamentoF.marcacoes[i].minuto;
        itemDescricaoHorario.segundo = apontamentoF.marcacoes[i].segundo;
        itemDescricaoHorario.totalMin = apontamentoF.marcacoes[i].totalMin;
        itemDescricaoHorario.tzOffset = apontamentoF.marcacoes[i].tzOffset;
        itemDescricaoHorario.RHWeb = apontamentoF.marcacoes[i].RHWeb;
        itemDescricaoHorario.REP = apontamentoF.marcacoes[i].REP;
        itemDescricaoHorario.NSR = apontamentoF.marcacoes[i].NSR;
        itemDescricaoHorario.desconsiderada = apontamentoF.marcacoes[i].desconsiderada;
        // itemDescricaoHorario.reconvertida = apontamentoF.marcacoes[i].reconvertida;
        itemDescricaoHorario.motivo = apontamentoF.motivo;
        itemDescricaoHorario.gerada = apontamentoF.gerada;
        
        itemDescricaoHorario.rDescricao = strDescricao.replace(/ent|sai/gi, function(matched){return mapObj[matched]});
        
        if (apontamentoF.marcacoes[i].strHorario){
          itemDescricaoHorario.strHorario = apontamentoF.marcacoes[i].strHorario;  
        } else {
          totalMinutes = (apontamentoF.marcacoes[i].hora * 60) + apontamentoF.marcacoes[i].minuto;
          objHoraMinuto = converteParaHoraMinutoSeparados(totalMinutes);
          itemDescricaoHorario.strHorario = objHoraMinuto.hora + ":" + objHoraMinuto.minuto;
        }

        arrayEntSai.push(itemDescricaoHorario);
      }

      var objetoEntradasSaidas = {
        arrayEntSai: arrayEntSai,
        esFinal: esFinal
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

    function initGetApontamento(){

      getApontamentosByDateRangeAndEquipe($scope.currentDate, {dias: 1}, [$scope.funcionario], true, false, false);//pegando o diário
    };

    function init() {

      if ($scope.funcionario){

        initGetApontamento();
        $scope.liberado = true;
      }
    };

    init();
  };

  function DesconsiderarCtrl($uibModalInstance, $scope, $state, $filter, objBatida){
    
    //console.log('objBatida: ', objBatida);
    $scope.algo = {};
    $scope.objBatida = objBatida;
    $scope.objBatida.data = $filter('date')($scope.objBatida.data, 'abvFullDate');
    $scope.horario = objBatida.array[objBatida.index].strHorario;

    $scope.confirmDes = function() {
      
      //$state.go('point_adjust', {obj: objAjusteParams});
      $uibModalInstance.close({index: $scope.objBatida.index, motivo: $scope.algo.motivo});
    };

  };

  function IncluirBatimentoCtrl($uibModalInstance, $scope, $state, $filter, objBatida){
   
    $scope.algo = {};
    $scope.errorMsg = null;
    $scope.objBatida = objBatida;
    $scope.objBatida.data = $filter('date')($scope.objBatida.data, 'abvFullDate');

    $scope.confirmaInclusao = function(batida) {
      
      //$state.go('point_adjust', {obj: objAjusteParams});
      if (batida.horario){
        var objHorario = getObjectHorario(batida.horario);
        if (!objHorario){
          $scope.errorMsg = "O horário deve estar no formato 00 a 23 para as Horas e 00 a 59 para os minutos";
        } else {
          console.log('objHorario: ', objHorario);
          var marcacao = {
            id: undefined,
            descricao: undefined,
            hora: objHorario.hora,
            minuto: objHorario.minutes,
            segundo: 0,
            totalMin: objHorario.totalMinutes,
            strHorario: objHorario.horarioFtd,
            tzOffset: (new Date()).getTimezoneOffset(),
            RHWeb: false,
            REP: false,
            NSR: "MANUAL",
            desconsiderada: false,
            // itemDescricaoHorario.reconvertida = apontamentoF.marcacoes[i].reconvertida;
            motivo: batida.motivo,
            gerada: {created_at: new Date()}
          };
          $uibModalInstance.close(marcacao);
        }
      } else {
        $scope.errorMsg = "O horário deve estar no formato 00 a 23 para as Horas e 00 a 59 para os minutos";
      }
    };

    function getObjectHorario (strHorario) {

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

  };

  function ConfirmationModalCtrl($uibModalInstance, $scope, $state, $filter, solicitacaoAjuste){
    
    console.log('solicitacaoAjuste: ', solicitacaoAjuste);
    $scope.solicitacaoAjuste = solicitacaoAjuste;
    $scope.solicitacaoAjuste.dataFtd = $filter('date')($scope.solicitacaoAjuste.data, 'abvFullDate');
    
    $scope.confirma = function() {
      alert('Indisponível no momento, ainda em fase de finalização');
      // myhitpointAPI.create(solicitacaoAjuste).then(function successCallback(response){

      //   var retorno = response.data;
      //   $uibModalInstance.close({index: $scope.objBatida.index, motivo: $scope.algo.motivo});

      // }, function errorCallback(response){
        
      //   $scope.errorMsg = response.data.message;
      //   console.log("Erro ao criar solicitação de ajuste.");
      // });
    };

  };


})();
