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
    var resourcesFiles = [];


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
    $scope.files = [];
    
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
      
      //FAZER UM FIND para saber se já tem uma solicitação com essa data e abrir uma dialog perguntando se deseja assim mesmo

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

          var horario1 = util.isValidHorarioField($scope.hora.inicio);
          var horario2 = util.isValidHorarioField($scope.hora.fim);

          if (!horario1 || !horario2){
            $scope.timeErrorMsg = "O horário deve conter dois dígitos para hora e dois dígitos para os minutos e deve estar entre 00 e 23 horas e 00 e 59 minutos.";
            $timeout(hideTimeErrorMsg, 8000);
            return $scope.timeErrorMsg;
          }
          else {
            horarioUnico = {
              inicial: {
                hora: horario1.hora,
                minuto: horario1.minutes,
                segundo: 0,
                totalMin: horario1.totalMinutes,
                horarioFtd: horario1.horarioFtd 
              }, 
              final: {
                hora: horario2.hora,
                minuto: horario2.minutes,
                segundo: 0,
                totalMin: horario2.totalMinutes,
                horarioFtd: horario2.horarioFtd
              },
              diff: horario2.totalMinutes - horario1.totalMinutes
            };
          }
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
          //Tenho que ter as marcacoes se for apenas por horário e seguir o método igual ao de ajuste...
          //solicitacaoAjuste.proposto.marcacoes = _criarMarcacoesManuaisAbono(horarioUnico);
        }

      } else {
        console.log("vai ser abono de data range", dataUnica);
        solicitacaoAjuste.data = util.getOnlyDate($scope.currentDate);
        solicitacaoAjuste.dataFinal = util.getOnlyDate($scope.currentDate2);
        solicitacaoAjuste.arrayAusAjt = dataRange;
      }

      solicitacaoAjuste.anexo = resourcesFiles;
      //retirei pra atualizar o servidor
      openConfirmaAjuste(solicitacaoAjuste);
      

      // myhitpointAPI.create(solicitacaoAjuste).then(function successCallback(response){

      //   var retorno = response.data;
      //   $uibModalInstance.close(retorno.success);

      // }, function errorCallback(response){
        
      //   $scope.errorMsg = response.data.message;
      //   console.log("Erro ao criar solicitação de ajuste.");
      // });
    };   

    $scope.onUploadSelect = function(element){
      //console.log("clicou para upload". file);
      $scope.$apply(function(scope) {
        console.log('files:', element.files);
        var countErrors = 0;
        for (var i = 0; i < element.files.length; i++) {
          if(validateFile(element.files[i])){
            element.files[i].sizeFtd = (Math.round(element.files[i].size)/1000000).toFixed(2) + "MB";
            $scope.files.push(element.files[i]);
            getBase64(element.files[i]);
          } else {
            countErrors++;
          }
        }

        if(countErrors>0){
          
          if (countErrors == 1)
            $scope.fileErrorMsg = "Um arquivo não passou no critério de tipo ou tamanho.";
          else
            $scope.fileErrorMsg = "O total de " + countErrors + " arquivos não passaram no critério de tipo ou tamanho.";

          $timeout(hideFileError, 8000);
          return $scope.fileErrorMsg;
        }
        //var matches = element.files.match(/data:([A-Za-z-+\/].+);base64,(.+)/);
        //console.log("Matches? ", matches);
      });
    };

    $scope.makeUpload = function() {
      console.log("$scope.files: ", $scope.files);
      console.log("respirces files: ", resourcesFiles);
      var obj = {
        array: resourcesFiles//$scope.files
      };
      myhitpointAPI.uploadImage(obj).then(function successCallback(response){

        console.log("Response.data: ", response.data);

      }, function errorCallback(response){

        $scope.errorMsg = response.data.message;
        console.log('response error : ', response.data.message);
      });      
    };

    function validateFile(file) {
      
      if (file.size > 2048000)
        return false;

      var typeFile = file.type.split('/');
      if(typeFile.length == 2) {

        if (typeFile[0] === "application") {
          if (typeFile[1] !== "pdf")
            return false;
        } else {
          if (typeFile[0] !== "image")
            return false;
        }

      } 
      else 
        return false;      

      return true;
    };

    function getBase64(file) {
      var resourceObj = {
        matr: $scope.funcionario.matricula,
        name: file.name,
        size: file.size
      };
      var reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = function () {
        //console.log("Reader Result: ", reader.result);
        resourceObj.data = reader.result;
        resourcesFiles.push(resourceObj);
      };
      reader.onerror = function (error) {
        console.log('Error: ', error);
      };
    };

    function criarMarcacoesManuaisAbono(horarioUnico) {

      var marcacao1 = {
        id: 1,
        descricao: "ent1",
        hora: horarioUnico.inicial.hora,
        minuto: horarioUnico.inicial.minuto,
        segundo: horarioUnicio.inicial.segundo,
        totalMin: horarioUnico.inicial.totalMin,
        strHorario: horarioUnico.inicial.horarioFtd,
        tzOffset: (new Date()).getTimezoneOffset(),
        RHWeb: false,
        REP: false,
        NSR: "MANUAL",
        desconsiderada: false,
        motivo: "ABONO",
        gerada: {created_at: new Date()}
      };

      var marcacao2 = {
        id: 2,
        descricao: "sai1",
        hora: horarioUnico.final.hora,
        minuto: horarioUnico.final.minuto,
        segundo: horarioUnicio.final.segundo,
        totalMin: horarioUnico.final.totalMin,
        strHorario: horarioUnico.final.horarioFtd,
        tzOffset: (new Date()).getTimezoneOffset(),
        RHWeb: false,
        REP: false,
        NSR: "MANUAL",
        desconsiderada: false,
        motivo: "ABONO",
        gerada: {created_at: new Date()}
      };

      var arrayMarcacoes = [marcacao1, marcacao2];
      return arrayMarcacoes;
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

    function hideFileError(seconds){
      $scope.fileErrorMsg = null;
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
           $state.go($state.current, {userId: Usuario._id, year: solicitacaoAjuste.data.getFullYear(),
           month: solicitacaoAjuste.data.getMonth(),
           day: solicitacaoAjuste.data.getDate()}, {reload: true});
          //$state.reload({});
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
