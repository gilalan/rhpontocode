/**
 * @author Gilliard Lopes
 * created on 09.04.2019
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.abono')
      .controller('AbonoSolicitationCtrl', AbonoSolicitationCtrl)
      .controller('ConfirmationModalCtrl', ConfirmationModalCtrl);

  /** @ngInject */
  function AbonoSolicitationCtrl($scope, $filter, $state, $uibModal, $timeout, util, employeeAPI, appointmentAPI, myhitpointAPI, usuario, currentDate, feriados, eventosAbono) {

    var Usuario = usuario.data;
    var feriados = feriados.data;
    var arrayESOriginal = [];
    var equipe = {};
    var dataMaxBusca = util.addOrSubtractDays(new Date(currentDate.data.date), -1); //dia anterior


    console.log("Current Date para os trabalhos: ",$scope.currentDate);

    $scope.hasFuncionario = false; //indica se há um funcionário
    $scope.hasSolicitation = false;
    $scope.funcionario = Usuario.funcionario;
    $scope.eventosAbono = eventosAbono.data;
    $scope.arrayES = [];
    $scope.ajuste = {};
    $scope.justif = {};
    $scope.hora = {};                
    // $scope.infoHorario = {};
    
    if ($scope.eventosAbono.length > 0)
      $scope.selected = { item: $scope.eventosAbono[0] };

    var pageConfirmationPath = 'app/pages/ajuste_abono/modals/confirmationModal.html';
    var defaultSize = 'md'; //representa o tamanho da Modal

    //parte do datePicker
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
      //console.log("open function", $scope.something.opened);
      $scope.something.opened = true;
    }
    function open2() {
      //console.log("open function", $scope.something.opened);
      $scope.something2.opened = true;
    }
    $scope.changeDate = function(date) {
      console.log('já passou no changeDate no carregamento?');
      $scope.dataErrorMsg = null;
      if (util.compareOnlyDates(date, dataMaxBusca) == 1){
        $scope.datepic.dt = new Date($scope.currentDate);
        $scope.dataErrorMsg = "Você só pode solicitar ajustes de: "+$filter('date')(dataMaxBusca, 'abvFullDate')+" para trás.";
        $timeout(hideDataError, 8000);
        return $scope.dataErrorMsg;
      }
      console.log('passou por aqui!!!');
      $scope.currentDate = new Date(date);
      $scope.currentDateFtd = $filter('date')($scope.currentDate, 'abvFullDate');
      //reset fields
      arrayESOriginal = [];
      $scope.hasSolicitation = false;
      $scope.arrayES = [];
      $scope.apontamento = null;
      $scope.ajuste = {};
      $scope.solicitacaoObtida = {};
      console.log("infoHorario: ", $scope.infoHorario);
      //init(); Get Solicitacao de Abono existente...
    };

    $scope.changeDate2 = function(date) {
      console.log('já passou no changeDate no carregamento?');
      $scope.dataErrorMsg = null;
      if (util.compareOnlyDates(date, dataMaxBusca) == 1){
        $scope.datepic.dt = new Date($scope.currentDate);
        $scope.dataErrorMsg = "Você só pode solicitar ajustes de: "+$filter('date')(dataMaxBusca, 'abvFullDate')+" para trás.";
        $timeout(hideDataError, 8000);
        return $scope.dataErrorMsg;
      }
      console.log('passou por aqui!!!');
      $scope.currentDate2 = new Date(date);
      $scope.currentDateFtd2 = $filter('date')($scope.currentDate, 'abvFullDate');
      //reset fields
      arrayESOriginal = [];
      $scope.hasSolicitation = false;
      $scope.arrayES = [];
      $scope.apontamento = null;
      $scope.ajuste = {};
      $scope.solicitacaoObtida = {};
      console.log("infoHorario: ", $scope.infoHorario);
      //init(); Get Solicitacao de Abono existente...
    };

    $scope.criarAbono = function(){
      
      console.log("vai criar uma solicitação de abono.");
      //console.log($scope.infoHorario);
      var dataUnica = null;
      var horarioUnico = null;
      var dataRange = [];
      //Aqui, é o caso de um abono apenas para um dia
      if ($scope.currentDate2 == null){
        console.log("Sem data final");
        //Turno inteiro
        dataUnica = util.getOnlyDate($scope.currentDate);
        if ($scope.hora.inicio == null && $scope.hora.fim == null){
          
          console.log("Sem data fina, iniciall", dataUnica);
          var dataNaFolga = false;
          if ($scope.infoHorario.folgas){
            for (var i = 0; i < $scope.infoHorario.folgas.length; i++) {
              if (dataUnica.getDay() == $scope.infoHorario.folgas[i]){
                dataNaFolga = true;
                break;
              }
            }
          }

          if (dataNaFolga)
            dataUnica = null;

          console.log('#horario? ', $scope.hora);

        } else if ($scope.hora.inicio != null && $scope.hora.inicio != "" 
          && $scope.hora.fim != null && $scope.hora.fim != "") {

          console.log('com horarios');
          console.log('#horario? ', $scope.hora);

          if ($scope.hora.inicio.length < 4){
            $scope.timeErrorMsg = "O horário deve conter dois dígitos para hora e dois dígitos para os minutos.";
            $timeout(hideTimeErrorMsg, 8000);
            return $scope.timeErrorMsg;
          }

          if ($scope.hora.fim.length < 4){
            $scope.timeErrorMsg2 = "O horário deve conter dois dígitos para hora e dois dígitos para os minutos.";
            $timeout(hideTimeErrorMsg2, 8000);
            return $scope.timeErrorMsg2;
          }

          horarioUnico = {
            inicial: getTotalMinutosHorario($scope.hora.inicio),
            final: getTotalMinutosHorario($scope.hora.fim)
          };
        }
      } else {
        console.log("com data final");
        if ($scope.currentDate == null) {
          $scope.dataErrorMsg = "Data Inicial precisa ser preenchida!";
          $timeout(hideDataError, 8000);
          return $scope.dataErrorMsg;
        } else {

          var date1 = util.getOnlyDate($scope.currentDate);
          var date2 = util.getOnlyDate($scope.currentDate2);
          dataRange = util.daysCountBtwDates(date1, date2).arrayDias;
          console.log("dataRange: ", dataRange);
          if ($scope.infoHorario.folgas){
            for (var i = 0; i < $scope.infoHorario.folgas.length; i++) {
              for (var j=0; j< dataRange.length; j++){
                if (dataRange[j].day == $scope.infoHorario.folgas[i]){
                  //dataRange[j] = null;
                }
              }
            }
          }
        }
      }

      var solicitacaoAjuste = {
        funcionario: $scope.funcionario._id,
        tipo: 1, //tipo Abono
        status: 0, //pendente (-1 é reprovada) e (1 é aprovada)
        motivo: $scope.justif.motivo,
        eventoAbono: $scope.selected.item
      };

      if (dataUnica != null){
        console.log("vai ser abono de data unica",dataUnica);
        solicitacaoAjuste.data = dataUnica;
        if (horarioUnico != null){
          console.log("vai ser abono de data unica + horario de turno");
          solicitacaoAjuste.horarioEnviado = horarioUnico;
        }

      } else {
        console.log("vai ser abono de data range", dataUnica);
        solicitacaoAjuste.data = util.getOnlyDate($scope.currentDate);
        solicitacaoAjuste.dataFinal = util.getOnlyDate($scope.currentDate2);
        solicitacaoAjuste.arrayAusAjt = dataRange;
      }

      alert ('Funcionalidade em construção...');
      /* retirei pra atualizar o servidor
      openConfirmaAjuste(solicitacaoAjuste);
      */

      // myhitpointAPI.create(solicitacaoAjuste).then(function successCallback(response){

      //   var retorno = response.data;
      //   $uibModalInstance.close(retorno.success);

      // }, function errorCallback(response){
        
      //   $scope.errorMsg = response.data.message;
      //   console.log("Erro ao criar solicitação de ajuste.");
      // });
    };

    function getTotalMinutosHorario (strHorario) {

        if (strHorario.length < 4)
            return "";
        
        var hoursStr = strHorario.substring(0, 2);
        var minutesStr = strHorario.substring(2);
        var hours = parseInt(hoursStr) * 60;
        var minutes = parseInt(minutesStr);
        return {
          hora: parseInt(hoursStr),
          minuto: parseInt(minutesStr),
          segundo: 0,
          totalMin: hours + minutes
        }
        //return (hours + minutes); 
    };

    function hideDataError(seconds){
      $scope.dataErrorMsg = null;
    };    
    //Fim do datePicker

    function hideDataError2(seconds){
      $scope.dataErrorMsg2 = null;
    };

    function hideTimeError(seconds){
      $scope.timeErrorMsg = null;
    };

    function hideTimeError2(seconds){
      $scope.timeErrorMsg2 = null;
    };

    function hideAppointErrorMsg(seconds){
      $scope.invalidAppointMsg = null;
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
          $state.go($state.current, {userId: Usuario._id, year: solicitacaoAjuste.date.year,
          month: solicitacaoAjuste.date.month,
          day: solicitacaoAjuste.date.day}, {reload: true});
          // $state.reload({});
        }
      }, function (args) {
        console.log('dismissed confirmation');
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
        funcionario: $scope.funcionario
      };

      myhitpointAPI.getFromDataFuncionario(objDataFuncionario).then(function successCallback(response){

        console.log('response de solicitacaoAjuste: ', response.data);
        if (!response.data || response.data.length <= 0){

          getApontamentosByDateRangeAndEquipe($scope.currentDate, {dias: 1}, [$scope.funcionario], true, false, false);//pegando o diário

        } else {

          if (response.data.length > 0){
            
            var resultArray = util.getInfoSolicitacaoAjuste(response.data[0]);
            $scope.solicitacaoObtida = {
              anterior: resultArray.arrayESAnterior,
              proposto: resultArray.arrayESProposto,
              motivo: response.data[0].motivo
            };
            $scope.hasSolicitation = true;
            console.log('vc já tem uma solicitação PENDENTE para esta data!', $scope.solicitacaoObtida);
          }
        }

      }, function errorCallback(response){

        $errorMsg = response.data.message;
        console.log('response error : ', response.data.message);
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

      console.log("Objeto Date Equipe Enviado: ", objDateEquipe);

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
      console.log('ArrayES do apontamentoF');

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

    function initGetSolicitacaoOuApontamento(){

      getSolicitacaoOuApontamento();
     
    };

    function init() {

      if (Usuario.perfil.accessLevel == 1){

        if ($scope.funcionario){

          $scope.hasFuncionario = true;
          
          if (!$scope.infoHorario){
            $scope.infoHorario = util.getInfoHorario($scope.funcionario, []);
          }

          employeeAPI.getEquipe($scope.funcionario._id).then(function successCallback(response){

            $scope.noTeamMsg = null;
            equipe = response.data;
            console.log("!@#EQUIPE OBTIDA DO FUNCIONARIO: ", equipe);
            if (!equipe){
              $scope.noTeamMsg = "Você não está associado(a) a nenhuma EQUIPE no sistema e consequentemente não é possível ajustar seus batimentos. Verifique junto ao seu fiscal/gestor a sua associação a uma EQUIPE.";
              return $scope.noTeamMsg;
            } else {

              initGetSolicitacaoOuApontamento();
            }

          }, function errorCallback(response){
            
            $scope.errorMsg = response.data.message;
          });        
        }
        
      } else if (Usuario.perfil.accessLevel == 2 || Usuario.perfil.accessLevel == 3) {
        
        $scope.gestor = Usuario.funcionario;
        // getEquipesByGestor();

      } else if (Usuario.perfil.accessLevel == 4) {
         
         $scope.gestor = Usuario.funcionario;
         $scope.isGestorGeral = true;
         // getEquipesByGestor();

      } else if (Usuario.perfil.accessLevel >= 5) {

        $scope.isAdmin = true;
        //console.log('allEmployees: ', allEmployees.data);
        // getAllEmployees();

      }
    };

    init();
  };

  function ConfirmationModalCtrl($uibModalInstance, $scope, $state, $filter, util, myhitpointAPI, solicitacaoAjuste){
    
    console.log('solicitacaoAjuste: ', solicitacaoAjuste);
    $scope.solicitacao = solicitacaoAjuste;
    $scope.solicitacao.message = false;
    $scope.tipoZero = false;
    $scope.tipoUm = false;
    $scope.tipoDois = false;

    if (!$scope.solicitacao.dataFinal){
      $scope.solicitacao.message = "Ausência de Justificativa para dia único";
      if ($scope.solicitacao.horarioEnviado) {
        $scope.solicitacao.message += " e período de tempo limitado";
        $scope.tipoUm = true;
      }
      $scope.tipoZero = !$scope.tipoUm;
    } else {
      $scope.solicitacao.message = "Ausência de Justificativa para um período de dias";
      $scope.tipoDois = true;
    }

    // $scope.dataFtd = $filter('date')(solicitacaoAjuste.rawData, 'abvFullDate');
    
    $scope.confirma = function() {
      
      myhitpointAPI.create(solicitacaoAjuste).then(function successCallback(response){

        var retorno = response.data;
        $uibModalInstance.close(retorno.success);

      }, function errorCallback(response){
        
        $scope.errorMsg = response.data.message;
        console.log("Erro ao criar solicitação de ajuste.");
      });
    };

  };


})();
