/**
 * @author Gilliard Lopes
 * created on 17.05.2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.adjustsolicitation')
      .controller('AdjustSolicitationGestorCtrl', AdjustSolicitationGestorCtrl)
      .controller('DesconsiderarCtrl', DesconsiderarCtrl)
      .controller('IncluirBatimentoCtrl', IncluirBatimentoCtrl)
      .controller('ConfirmationModalGestCtrl', ConfirmationModalGestCtrl);

  /** @ngInject */
  function AdjustSolicitationGestorCtrl($scope, $filter, $state, $uibModal, $timeout, util, Auth, employeeAPI, appointmentAPI, myhitpointAPI, teamAPI, usuario, currentDate, feriados, allEmployees, allEquipes) {

    var Usuario = usuario.data;
    var currentUser = Auth.getCurrentUser();
    var feriados = feriados.data;
    var arrayESOriginal = [];
    var equipe = {};
    var dataMaxBusca = util.addOrSubtractDays(new Date(currentDate.data.date), -1); //dia anterior
    var lastSearch = null;

    $scope.employees = [];
    $scope.employeesNames = [];
    $scope.equipesLiberadas = false;
    $scope.currentDate = new Date(dataMaxBusca);
    $scope.currentDateFtd = $filter('date')($scope.currentDate, 'abvFullDate');  
    $scope.flagFerias = false;
    //console.log("Current Date para os trabalhos: ",$scope.currentDate);

    $scope.hasFuncionario = false; //indica se há um funcionário
    $scope.hasSolicitation = false;
    $scope.funcionario = {};
    $scope.funcionarioOficial = {};
    // $scope.funcionario = Usuario.funcionario;
    $scope.arrayES = [];
    $scope.ajuste = {};

    var refillObj = {};
    $scope.refillFlag = false; //só ficará ativada se houver um pedido de manutenção do preenchimento dos dados após a confirmação de um ajuste (para otimizar) 
    // $scope.infoHorario = {};

    var pagePath = 'app/pages/adjust_solicitation/modals/desconsiderarModal.html'; //representa o local que vai estar o html de conteúdo da modal
    var pageIncluirPath = 'app/pages/adjust_solicitation/modals/incluirBatimentoModal.html';
    var pageConfirmationPath = 'app/pages/adjust_solicitation/modals/confirmationModal.html';
    var defaultSize = 'md'; //representa o tamanho da Modal

    //parte do datePicker
    $scope.datepic = {
      dt: $scope.currentDate
      //dt: new Date(teste.getFullYear(), teste.getMonth(), teste.getDate())
    };
    $scope.options = {
      //minDate: $scope.datepic.dt,
      showWeeks: true
    };
    $scope.open = open;
    $scope.something = {
      opened: false
    };
    $scope.formats = ['dd-MMMM-yyyy', 'dd/MM/yyyy', 'dd.MM.yyyy', 'fullDate'];
    $scope.format = $scope.formats[1];
    function open() {
      ////console.log("open function", $scope.something.opened);
      $scope.something.opened = true;
    }
    $scope.changeDate = function(date) {
      
      $scope.dataErrorMsg = null;
      if (util.compareOnlyDates(date, dataMaxBusca) == 1){
        $scope.datepic.dt = new Date($scope.currentDate);
        $scope.dataErrorMsg = "Você só pode solicitar ajustes de: "+$filter('date')(dataMaxBusca, 'abvFullDate')+" para trás.";
        $timeout(hideDataError, 8000);
        return $scope.dataErrorMsg;
      }
      $scope.currentDate = new Date(date);
      $scope.currentDateFtd = $filter('date')($scope.currentDate, 'abvFullDate');
      
      //reset field apenas quando clicar em PESQUISAR agora
    };

    function hideDataError(seconds){
      $scope.dataErrorMsg = null;
    };
    //Fim do datePicker

    //Seria uma especie de INIT(), pois eh daqui que inicia esse Controller.
    $scope.visualizar = function() {
      //$scope.refillFlag = false;
      resetFields();
      console.log("Ferias do funcionario: ", $scope.funcionarioOficial);
      $scope.flagFerias = util.checkFerias($scope.currentDate, $scope.funcionarioOficial.ferias);
      if (!$scope.flagFerias)
        getSolicitacaoOuApontamento();
    };

    $scope.changeFunc = function(funcSel){
      
      $scope.funcionarioOficial = $scope.equipes[funcSel.indiceEq].componentes[funcSel.indiceComp];
      $scope.funcionarioOficial.equipe = angular.copy(funcSel.equipe);
      console.log("funcionario ferias do INIT: ", $scope.funcionarioOficial);
      if ($scope.funcionarioOficial.ferias){

        for (var i=0; i<$scope.funcionarioOficial.ferias.length; i++){
          $scope.funcionarioOficial.ferias[i].dataIniFtd = new Date($scope.funcionarioOficial.ferias[i].periodo.anoInicial, 
            $scope.funcionarioOficial.ferias[i].periodo.mesInicial-1, $scope.funcionarioOficial.ferias[i].periodo.dataInicial, 0, 0, 0, 0);
          $scope.funcionarioOficial.ferias[i].dataFinFtd = new Date($scope.funcionarioOficial.ferias[i].periodo.anoFinal, 
            $scope.funcionarioOficial.ferias[i].periodo.mesFinal-1, $scope.funcionarioOficial.ferias[i].periodo.dataFinal, 0, 0, 0, 0);
        }
      }
      $scope.infoHorario = util.getInfoHorario($scope.funcionarioOficial, []);
    };

    $scope.isEmptyFunc = function(){
      
      //console.log('is Empty func?');
      if (!$scope.funcionario.selected || $scope.funcionario.selected == ""){
        $scope.infoHorario = "";
        return true;
      }
      return false;
    };

    function hideAppointErrorMsg(seconds){
      $scope.invalidAppointMsg = null;
    };

    $scope.propor = function(ajuste){
      
      if (!util.isValidBatidasSchema($scope.arrayES)) {
        
        $scope.invalidAppointMsg = null;
        $scope.invalidAppointMsg = "o total de batidas deve ser em quantidade par!";
        $timeout(hideAppointErrorMsg, 5000);
        return $scope.invalidAppointMsg;
      }

      var marcacoesPropostas = reorganizarBatidasPropostas($scope.arrayES);      

      var solicitacaoAjuste = {
        rawData: $scope.currentDate,
        date: {
          year: $scope.currentDate.getFullYear(),
          month: $scope.currentDate.getMonth(),
          day: $scope.currentDate.getDate()
        },
        data: util.getOnlyDate($scope.currentDate),
        funcionario: $scope.funcionarioOficial,
        status: 1, //pendente (-1 é reprovada) e (1 é aprovada)
        resposta: {
          aprovada: true,
          data: util.getOnlyDate($scope.currentDate),
          gestor: $scope.gestor,
          motivo: "Aprovada Automaticamente"
        },
        motivo: ajuste.motivo,
        anterior: {
          marcacoes: arrayESOriginal
        },
        proposto: {
          marcacoes: marcacoesPropostas
        }
      };

      //console.log('solicitacaoAjuste no metodo propor', solicitacaoAjuste);
      
      openConfirmaAjuste(solicitacaoAjuste);  
    };

    $scope.incluir = function(){

      if (isValidSearch()){
        openIncluirModal($scope.currentDate, $scope.arrayES);
      } else {
        $scope.dataErrorMsg = "é necessário realizar uma pesquisa de funcionário e data antes de incluir novos batimentos.";
        $timeout(hideDataError, 6000);
      }
    };

    $scope.desconsiderar = function(index){
      
      openDesconsiderarModal($scope.currentDate, $scope.arrayES, index);
    };

    $scope.aprovarSolicitacaoPendente = function(){

      alert('Em desenvolvimento! Por enquanto você pode aprovar essa solicitação no menu Solicitações.');
    };

    $scope.reprovarSolicitacaoPendente = function(){
      
      alert('Em desenvolvimento! Por enquanto você pode rejeitar essa solicitação no menu Solicitações.');
    };

    $scope.refill = function() {
      $scope.arrayES = refillObj.batidas;
      $scope.ajuste.motivo = refillObj.motivo;
      $scope.apontamento = true;
    };

    function resetFields() {
      //Parte do apontamento em si
      arrayESOriginal = [];
      $scope.hasSolicitation = false;
      $scope.arrayES = [];
      $scope.apontamento = null;
      $scope.ajuste = {};
      $scope.solicitacaoObtida = {};
      //Parte do Histórico
    };

    function _visualizar() {
      resetFields();
      $scope.datepic.dt = refillObj.date;
      $scope.changeDate(refillObj.date);
      $scope.flagFerias = util.checkFerias($scope.currentDate, $scope.funcionarioOficial.ferias);
      if (!$scope.flagFerias)
        getSolicitacaoOuApontamento();
    };

    function isValidSearch(){
      //console.log('lastSearch: ', lastSearch);
      if (lastSearch){
        
        //console.log('$scope.funcionario: ', $scope.funcionarioOficial._id);
        //console.log('last.funcionario: ', lastSearch.func);
        //console.log('date: ', $scope.currentDate.getTime());
        //console.log('last date: ', lastSearch.date);
        
        if ($scope.funcionarioOficial._id != lastSearch.func || 
          $scope.currentDate.getTime() != lastSearch.date) {

          //console.log('mudou funcionário ou data');
          return false;

        } else {

          return true;
        }
        
      } else {

        return false;
      }

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
            newArrayES[i-1].rDescricao = "Entrada "+(Math.floor(i/2) + 1);
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
        controller: 'ConfirmationModalGestCtrl',
        backdrop: 'static',
        resolve: {
          solicitacaoAjuste: function () {
            return solicitacaoAjuste;
          },
          gestor: function(){
            if ($scope.gestor)
              return $scope.gestor;
            else
              return {
                nome: currentUser._id,
                sobrenome: currentUser._id,
                email: currentUser.email,
                PIS: currentUser.email
              };
          },
          feriados: function(){
            return feriados;
          },
          equipe: function(){
            return $scope.funcionarioOficial.equipe;
          },
          apontamento: function(){
            return $scope.apontamento;
          }
        }
      });

      modalInstance.result.then(function (){

        console.log("confirma?");
        $scope.refillFlag = true;

        var objNextWorkDay = util.getNextWorkingDay(solicitacaoAjuste.data, solicitacaoAjuste.funcionario, 
          $scope.funcionarioOficial.equipe, feriados, dataMaxBusca);

        //$scope.datepic.dt = objNextWorkDay.date;
        //Funcionario nao sera alterado pois nao foi efetuado nenhum reload() na tela...
        
        refillObj = {
          date: objNextWorkDay.date,
          motivo: solicitacaoAjuste.motivo,
          batidas: solicitacaoAjuste.proposto.marcacoes            
        };
        

        _visualizar();

      }, function (args) {
        console.log('dismissed confirmation');
        //$scope.refillFlag = false;
        $state.reload();
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
        if (result.indice >= 0){

          $scope.arrayES[result.indice].desconsiderada = true;
          $scope.arrayES[result.indice].motivo = result.motivo;
          $scope.arrayES[result.indice].estadoAtual = util.obterStatusMarcacao($scope.arrayES[result.indice]);
          //console.log('$scope.arrayES: ', $scope.arrayES);
        }

        ////console.log('array novo: ', $scope.arrayES);

      }, function (args) {

        ////console.log('modal is dismissed or closed.', args);

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
         
        //console.log('result?.', marcacao);
        //console.log('array? ', $scope.arrayES);
        
        if (marcacao){

          $scope.arrayES.push(marcacao);
          if (!$scope.apontamento)
            $scope.apontamento = true; //AJEITAR ISSO PLS
        } 

      }, function () {
        ////console.log('modal is dismissed or close.', args);
      });
    };

    function getSolicitacaoOuApontamento(){

      var dateAux = new Date($scope.currentDate);
      var objDataFuncionario = {
        date: {
          raw: $scope.currentDate,
          year: dateAux.getFullYear(),
          month: dateAux.getMonth(),
          day: dateAux.getDate()
        },
        funcionario: $scope.funcionarioOficial
      };

      myhitpointAPI.getFromDataFuncionario(objDataFuncionario).then(function successCallback(response){

        console.log('resultado da pesquisa: ', response.data);
        if (!response.data || response.data.length <= 0){//se nao tiver solicitacao, pegar o apontamento
          
          getApontamentosByDateRangeAndEquipe($scope.currentDate, {dias: 1}, [$scope.funcionarioOficial], true, false, false);//pegando o diário

        } else {

          if (response.data.length > 0){
            
            var resultArray = util.getInfoSolicitacaoAjuste(response.data[0]);
            $scope.solicitacaoObtida = {
              anterior: resultArray.arrayESAnterior,
              proposto: resultArray.arrayESProposto,
              motivo: response.data[0].motivo
            };
            console.log('Já tem uma solicitação PENDENTE para esta data!', $scope.solicitacaoObtida);
            $scope.hasSolicitation = true;
            lastSearch = {
              func: $scope.funcionarioOficial._id,
              date: $scope.currentDate.getTime()
            };
          }
        }

      }, function errorCallback(response){

        $errorMsg = response.data.message;
        //console.log('response error : ', response.data.message);
      });
    };

    function getApontamentosByDateRangeAndEquipe(beginDate, intervaloDias, componentes) {

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

      // //console.log("Objeto Date Equipe Enviado: ", objDateEquipe);

      appointmentAPI.getApontamentosByDateRangeAndEquipe(objDateEquipe).then(function successCallback(response){

        $scope.apontamento = null;
        var apontamentosResponse = response.data;
        var itemApontamento = {};
        var objEntradasSaidas = {};
        console.log("!@# Apontamentos Recebidos: ", apontamentosResponse);
        if (apontamentosResponse.length > 0){
          $scope.apontamento = response.data[0];          
          itemApontamento.rawDate = new Date($scope.currentDate);
          itemApontamento.data = $filter('date')(itemApontamento.rawDate, 'abvFullDate2');

          objEntradasSaidas = getEntradasSaidas($scope.apontamento);
          itemApontamento.entradaSaidaFinal = objEntradasSaidas.esFinal;
          $scope.arrayES = objEntradasSaidas.arrayEntSai;
        }

        lastSearch = {
          func: componentes[0]._id,
          date: $scope.currentDate.getTime()
        };
        // //console.log('independente de ter apontamento, tem lastSearch: ', lastSearch);

      }, function errorCallback(response){
        
        $errorMsg = response.data.message;
        //////console.log("Erro ao obter apontamentos por um range de data e equipe");
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
      //console.log('ArrayES do apontamentoF');

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
        itemDescricaoHorario.motivo = apontamentoF.marcacoes[i].motivo;
        itemDescricaoHorario.gerada = apontamentoF.marcacoes[i].gerada;
        
        itemDescricaoHorario.rDescricao = strDescricao.replace(/ent|sai/gi, function(matched){return mapObj[matched]});
        
        if (apontamentoF.marcacoes[i].strHorario){
          itemDescricaoHorario.strHorario = apontamentoF.marcacoes[i].strHorario;  
        } else {
          totalMinutes = (apontamentoF.marcacoes[i].hora * 60) + apontamentoF.marcacoes[i].minuto;
          objHoraMinuto = converteParaHoraMinutoSeparados(totalMinutes);
          itemDescricaoHorario.strHorario = objHoraMinuto.hora + ":" + objHoraMinuto.minuto;
        }

        itemDescricaoHorario.estadoAtual = util.obterStatusMarcacao(apontamentoF.marcacoes[i]);

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

    //Traz todos os employees/equipes para tela de Administrador
    function getAllEmployees(allEmployees, allEquipes) {
      
      //var empsArray = allEmployees.data;
      $scope.equipes = allEquipes.data;
      fillEquipes();
      // for (var j=0; j<empsArray.length; j++) {
      //     $scope.employees.push(empsArray[j]);
      //     $scope.employeesNames.push( { id: empsArray[j]._id, name: empsArray[j].nome + ' ' + empsArray[j].sobrenome});
      //   }
      // $scope.equipesLiberadas = true;
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

        //////console.log('Equipes do gestor: ', response.data);

      }, 
      function errorCallback(response){
        $errorMsg = response.data.message;
        //////console.log("houve um erro ao carregar as equipes do gestor");
      });
    };

    function fillEquipes(){

      // if ($scope.equipes.length > 0)
      //   $scope.selectedEquipe = { item: $scope.equipes[0] };

      fillEmployees();

      $scope.equipesLiberadas = true;
    };

    function fillEmployees(){

      for (var i=0; i<$scope.equipes.length; i++){
        for (var j=0; j<$scope.equipes[i].componentes.length; j++) {
          // $scope.equipes[i].componentes[j].equipeName = $scope.equipes[i].nome;
          $scope.employees.push($scope.equipes[i].componentes[j]);
          $scope.employeesNames.push( { 
            indiceEq: i, 
            indiceComp: j, 
            equipe: $scope.equipes[i],
            id: $scope.equipes[i].componentes[j]._id, 
            name: $scope.equipes[i].componentes[j].nome + ' ' + $scope.equipes[i].componentes[j].sobrenome
          });
        }
      }

      //////console.log('employees: ', $scope.employeesNames);
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
      }
    };

    init(allEmployees, allEquipes);
  };

  function DesconsiderarCtrl($uibModalInstance, $scope, $state, $filter, objBatida){
    
    ////console.log('objBatida: ', objBatida);
    $scope.algo = {};
    $scope.objBatida = objBatida;
    $scope.objBatida.data = $filter('date')($scope.objBatida.data, 'abvFullDate');
    $scope.horario = objBatida.array[objBatida.index].strHorario;

    $scope.confirmDes = function() {
      
      //$state.go('point_adjust', {obj: objAjusteParams});
      $uibModalInstance.close({indice: $scope.objBatida.index, motivo: $scope.algo.motivo});
    };

  };

  function IncluirBatimentoCtrl($uibModalInstance, $scope, $state, $filter, util, objBatida){
   
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
          //console.log('objHorario: ', objHorario);
          var marcacao = {
            incluida: true, //tem que remover na hora de enviar o objeto, é só local isso
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
          marcacao.estadoAtual = util.obterStatusMarcacao(marcacao);
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

  function ConfirmationModalGestCtrl($uibModalInstance, $scope, $state, $filter, appointmentAPI, util, solicitacaoAjuste, gestor, feriados, equipe, apontamento){
    
    $scope.dataProcess = false;
    $scope.cleanModal = false;
    //console.log('solicitacaoAjuste: ', solicitacaoAjuste);
    $scope.solicitacao = solicitacaoAjuste;
    $scope.dataFtd = $filter('date')(solicitacaoAjuste.rawData, 'abvFullDate');

    //console.log('equipe encontrada: ', equipe);
    //console.log('feriados: ', feriados);
    console.log('gestor: ', gestor);
    //console.log('apontamento?: ', apontamento);

    var isNewApontamento = false;
    var apontamentoR = apontamento;

    var resultArray = util.getInfoSolicitacaoAjuste(solicitacaoAjuste);
    $scope.solicitacaoObtida = {
      anterior: resultArray.arrayESAnterior,
      proposto: resultArray.arrayESProposto
    };
    
    $scope.confirma = function() {
      
      $scope.dataProcess = true;
      //não tem apontamento, o 'true' foi só um artifício de visualização dos dados
      if (apontamentoR === true){ 
        
        apontamentoR = criarNovoApontamento(solicitacaoAjuste);
        coletarHistorico(apontamentoR, true);
        saveApontamento(apontamentoR);

      } else {
        
        //console.log('tem apontamento, fazer as coisas...');
        coletarHistorico(apontamentoR, false);
        modificarApontamento(apontamentoR);
        //console.log('apontamento final:', apontamentoR);
        updateApontamento(apontamentoR);
      }

      //Perguntar aqui se o usuario deseja continuar ajustando data para o atual funcionario (prosseguir para a proxima data de trabalho?)
      //Se estiver vazia (sem apontamentos), ai ja preenche com as informacoes anterioeres (batimentos criados)
      $scope.cleanModal = true;//remove as informacoes anteriores.
      //Informar se foi salvo ou nao com sucesso e perguntar o que foi desrito acima...
    };

    $scope.buscarProxApontamento = function(){

      $uibModalInstance.close();
    };

    function criarNovoApontamento(solicitacao){

      var data = util.getOnlyDate(new Date(solicitacao.data));
      var infoTrabalho = util.getInfoTrabalho(solicitacao.funcionario, equipe, data, feriados);
      infoTrabalho.trabalhados = util.calcularHorasMarcacoesPropostas(solicitacao.proposto.marcacoes);

      if (!infoTrabalho){
        $scope.errorMsg = "Código 1020: Não foi possível obter a informação de horário do funcionário.";
        return $scope.errorMsg;
      }

      var apontamento = {
        data: data,
        funcionario: solicitacao.funcionario._id,
        PIS: solicitacao.funcionario.PIS,
        status: {
          id: 3,
          descricao: "Justificado"
        },
        justificativa: "",
        infoTrabalho: infoTrabalho,
        marcacoes: solicitacao.proposto.marcacoes,
        marcacoesFtd: resultArray.arrayESProposto,
        historico: []
      };

      //console.log('apontamento a ser criado: ', apontamento);
      return apontamento;      
    };

    function coletarHistorico(apontamento, isFirst){

      var historicoArray = apontamento.historico;
      var itemId = 1;
      if (historicoArray.length > 0){
        
        //console.log("ja tem historico!", historicoArray);
        //historicoArray.sort(compareHist);
        itemId = historicoArray.length + 1;

      }
      var nextItemHistorico = {
        id: itemId,
        infoTrabalho: angular.copy(apontamento.infoTrabalho),
        marcacoes: isFirst ? [] : angular.copy(solicitacaoAjuste.anterior.marcacoes),
        marcacoesFtd: isFirst ? [] : angular.copy(apontamento.marcacoesFtd),
        justificativa: "Justificado pelo Gestor",
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

      //console.log('nextItemHistorico: ', nextItemHistorico);
      historicoArray.push(nextItemHistorico);
    };

    function modificarApontamento(apontamento){

      apontamento.status = {
        id: 3,
        descricao: "Justificado"
      };

      apontamento.marcacoesFtd = resultArray.arrayESProposto;
      apontamento.marcacoes = solicitacaoAjuste.proposto.marcacoes;      
      apontamento.infoTrabalho.trabalhados = util.calcularHorasMarcacoesPropostas(apontamento.marcacoes);
    };    

    function saveApontamento(apontamento){

      appointmentAPI.create(apontamento).then(function sucessCallback(response){

        //console.log("dados recebidos: ", response.data);
        if (response.data.success){
          $scope.successMsg = "Registro salvo com sucesso!";
          $scope.dataProcess = false;
          //responseData = response.data;
          //$uibModalInstance.close(response.data.success);
        }

      }, function errorCallback(response){
        
        //responseData = response.data;
        $scope.errorMsg = response.data.message;
        //console.log("Erro de registro: " + response.data.message);
        $scope.dataProcess = false;
        
      });
    };

    function updateApontamento(apontamento){

      appointmentAPI.update(apontamento._id, apontamento).then(function sucessCallback(response){

        //console.log("dados recebidos: ", response.data);
        if (response.data.success){
          $scope.successMsg = "Registro atualizado com sucesso!";
          $scope.dataProcess = false;
          //responseData = response.data;
          //$uibModalInstance.close(response.data.success);
        }

      }, function errorCallback(response){
        
        //responseData = response.data;
        $scope.errorMsg = response.data.message;
        //console.log("Erro de update: " + response.data.message);
        $scope.dataProcess = false;
        
      });
    };    

  };


})();
