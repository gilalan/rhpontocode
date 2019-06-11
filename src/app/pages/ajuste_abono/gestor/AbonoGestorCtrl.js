/**
 * @author Gilliard Lopes
 * created on 03.06.2019
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.abono')
      .controller('AbonoSolicitationGestorCtrl', AbonoSolicitationGestorCtrl)
      .controller('ConfirmationModalCtrl', ConfirmationModalCtrl);

  /** @ngInject */
  function AbonoSolicitationGestorCtrl($scope, $filter, $state, $uibModal, $timeout, util, Auth, employeeAPI, appointmentAPI, myhitpointAPI, teamAPI, usuario, currentDate, eventosAbono, feriados, allEquipes) {

    var Usuario = usuario.data;
    var currentUser = Auth.getCurrentUser();
    var feriados = feriados.data;
    var arrayESOriginal = [];
    var equipe = {};
    var dataMaxBusca = util.addOrSubtractDays(new Date(currentDate.data.date), -1); //dia anterior
    var resourcesFiles = [];
    var ident = 0;

    $scope.employees = [];
    $scope.employeesNames = [];
    $scope.equipesLiberadas = false;
    $scope.flagFerias = false;

    console.log("Current Date para os trabalhos: ",$scope.currentDate);

    $scope.hasSolicitation = false;
    $scope.funcionario = {};
    $scope.funcionarioOficial = {};
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
      console.log('#changeDate');
      $scope.dataErrorMsg = null;
      // if (util.compareOnlyDates(date, dataMaxBusca) == 1){
      //   $scope.datepic.dt = new Date($scope.currentDate);
      //   $scope.dataErrorMsg = "Você só pode solicitar ajustes de: "+$filter('date')(dataMaxBusca, 'abvFullDate')+" para trás.";
      //   $timeout(hideDataError, 8000);
      //   return $scope.dataErrorMsg;
      // }
      $scope.currentDate = new Date(date);
      $scope.currentDateFtd = $filter('date')($scope.currentDate, 'abvFullDate');
      
      visualizar(date);            
    };

    $scope.changeDate2 = function(date) {
      console.log('#changeDate2');
      $scope.dataErrorMsg = null;
      // if (util.compareOnlyDates(date, dataMaxBusca) == 1){
      //   $scope.datepic2.dt = new Date($scope.currentDate);
      //   $scope.dataErrorMsg = "Você só pode solicitar ajustes de: "+$filter('date')(dataMaxBusca, 'abvFullDate')+" para trás.";
      //   $timeout(hideDataError, 8000);
      //   return $scope.dataErrorMsg;
      // }

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
      
      visualizar($scope.currentDate, date);
    };    

    $scope.changeFunc = function(funcSel){
      
      $scope.funcionarioOficial = $scope.equipes[funcSel.indiceEq].componentes[funcSel.indiceComp];
      $scope.funcionarioOficial.equipe = angular.copy(funcSel.equipe);
      console.log("funcionario changeFUNC: ", $scope.funcionarioOficial);
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

    $scope.criarAbono = function(){
      
      //FAZER UM FIND para saber se já tem uma solicitação com essa data e abrir uma dialog perguntando se deseja assim mesmo
      if (_isValidFields()){
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
          funcionario: $scope.funcionarioOficial,
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
      }

      else {
        alert('Favor preencher todos os campos obrigatórios.');        
      }
      
    }; 

    $scope.onUploadSelect = function(element){
      //console.log("clicou para upload". file);
      $scope.$apply(function(scope) {
        console.log('files:', element.files);
        var countErrors = 0;
        for (var i = 0; i < element.files.length; i++) {
          if(validateFile(element.files[i])){
            element.files[i].sizeFtd = (Math.round(element.files[i].size)/1000000).toFixed(2) + "MB";
            element.files[i].ident = ident;
            $scope.files.push(element.files[i]);
            getBase64(element.files[i]);
            ident++;
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
        console.log("resourcesFiles ", resourcesFiles);
      });
    };  

    $scope.deletar = function(index){
      console.log("elemento: " , $scope.files[index]);
      for (var i=0; i < resourcesFiles.length; i++){
        if(resourcesFiles[i].ident == $scope.files[index].ident){
          resourcesFiles.splice(i, 1);
          break;
        }
      }
      $scope.files.splice(index, 1);
      console.log("files: ", $scope.files);
      console.log("resources: ", resourcesFiles);
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
        matr: $scope.funcionarioOficial.matricula,//$scope.funcionario.matricula,
        name: file.name,
        size: file.size,
        ident: file.ident
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

    function _isValidFields() {
      if ($scope.currentDate && $scope.justif.motivo && $scope.justif.motivo != ""){
        return true;
      }
      return false;
    };

    function visualizar(dateToView, dateEnd) {
      //$scope.refillFlag = false;
      resetFields();
      console.log("Ferias do funcionario: ", $scope.funcionarioOficial);
      if (!dateEnd){
        $scope.flagFerias = util.checkFerias(dateToView, $scope.funcionarioOficial.ferias);
        if (!$scope.flagFerias)
          getSolicitacaoOuApontamento();
      } else {
        $scope.flagFerias = util.checkFerias(dateEnd, $scope.funcionarioOficial.ferias);
        if (!$scope.flagFerias)
          getSolicitacaoOuApontamento();
      }
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

    function getSolicitacaoOuApontamento(dateA){

      var dateAux = new Date($scope.currentDate);
      if (dateA){
        dateAux = new Date(dateA);
      }
      var objDataFuncionario = {
        date: {
          raw: $scope.currentDate,
          year: dateAux.getFullYear(),
          month: dateAux.getMonth(),
          day: dateAux.getDate()
        },
        funcionario: $scope.funcionarioOficial,
        tipo: 1
      };
      
      console.log("ENVIADO: ", objDataFuncionario);

      myhitpointAPI.getFromDataFuncionario(objDataFuncionario).then(function successCallback(response){

        console.log('response de solicitacaoAjuste: ', response.data);
        if (!response.data || response.data.length <= 0){

          //getApontamentosByDateRangeAndEquipe($scope.currentDate, {dias: 1}, [$scope.funcionario], true, false, false);//pegando o diário

        } else {

          if (response.data.length > 0){
            $scope.solicitacaoObtida = angular.copy(response.data[0]);
            $scope.tipoZero = false;
            $scope.tipoUm = false;
            $scope.tipoDois = false;
            //var resultArray = util.getInfoSolicitacaoAjuste(response.data[0]);
            var message = "";
            if ($scope.solicitacaoObtida.dataFinal){
              message = "Ausência de Justificativa para dia único";
              if ($scope.solicitacaoObtida.horarioEnviado) {
                  message += " e período de tempo limitado";
                  $scope.tipoUm = true;
                }
                $scope.tipoZero = !$scope.tipoUm;
            } else {
              message = "Ausência de Justificativa para um período de dias";
              $scope.tipoDois = true;
            }

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

    //Traz todos os employees/equipes para tela de Administrador
    function getAllEmployees() {
      
      $scope.equipes = allEquipes.data;
      fillEquipes();
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

      fillEmployees();
      $scope.equipesLiberadas = true;
    };

    function fillEmployees(){

      for (var i=0; i<$scope.equipes.length; i++){
        for (var j=0; j<$scope.equipes[i].componentes.length; j++) {
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
    };

    function init() {

      if (Usuario.perfil.accessLevel == 2 || Usuario.perfil.accessLevel == 3) {
        
        $scope.gestor = Usuario.funcionario;
        getEquipesByGestor();

      } else if (Usuario.perfil.accessLevel == 4) {
         
        $scope.isAdmin = true;
        getAllEmployees();

      } else if (Usuario.perfil.accessLevel >= 5) {

        $scope.isAdmin = true;
        getAllEmployees();
      }
    };

    init();
  };

  function ConfirmationModalCtrl($uibModalInstance, $scope, $state, $filter, util, employeeAPI, myhitpointAPI, solicitacaoAjuste, gestor, feriados, equipe){
    
    console.log('solicitacaoAjuste: ', solicitacaoAjuste);
    console.log('feriados: ', feriados);
    console.log('equipe: ', equipe);
    //var equipe = equipe.data;
    //var feriados = feriados.data;

    $scope.dataProcess = false;
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
      $scope.dataProcess = true;
      getApontamentoDiarioFromFuncionario()
    };

    function getApontamentoDiarioFromFuncionario() {
      
      var multiDatas = false;
      var dataSol = new Date($scope.solicitacao.data);

      var date = {
        raw: dataSol,
        year: dataSol.getFullYear(),
        month: dataSol.getMonth(),
        day: dataSol.getDate(),
        hour: dataSol.getHours(),
        minute: dataSol.getMinutes()
        //dataFinal {}// => com o mesmo formato acima se quiser pegar para um range de datas...
      };

        
      if ($scope.solicitacao.dataFinal){          
        //coloca uma data a mais na busca pois o argumento da pesquisa no mongoose é MENOR QUE (não inclui)
        var dataEnd = new Date($scope.solicitacao.dataFinal);
        dataEnd = util.addOrSubtractDays(dataEnd, 1);
        date.dataFinal = {
          raw: dataEnd,
          year: dataEnd.getFullYear(),
          month: dataEnd.getMonth(),
          day: dataEnd.getDate(),
          hour: dataEnd.getHours(),
          minute: dataEnd.getMinutes()
        };
        multiDatas = true;
      }

      employeeAPI.getPeriodoApontamentoByFuncionario($scope.solicitacao.funcionario._id, date).then(function sucessCallback(response){

        console.log('Data Object: ', date);
        console.log('apontamento recebido:', angular.copy(response.data));
        var apontamentoArray = null;
        var apontamento = null;
        var isNewApontamento = false;
        apontamentoArray = response.data;
        
        if (!multiDatas){

          if (apontamentoArray.length > 0) {

            if (apontamentoArray.length == 1){
              console.log("Modificiar apontamento com único item");  
              apontamento = apontamentoArray[0];
              coletarHistorico(apontamento);
              modificarApontamento(apontamento);
              modificarSolicitacao($scope.solicitacao); 
              saveSolicitacaoApontamento({solicitacao: $scope.solicitacao, apontamento: apontamento, isNew: isNewApontamento});

            } else { //caso de período de dias para abono...
              console.log("Modificiar apontamento com período de itens");  
            }

          } else {
            console.log("Criar Apontamento, pois veio vazio");
            apontamento = criarNovoApontamento($scope.solicitacao);
            isNewApontamento = true;
            modificarSolicitacao($scope.solicitacao);      
            saveSolicitacaoApontamento({solicitacao: $scope.solicitacao, apontamento: apontamento, isNew: isNewApontamento});
          }
        } else { //Caso de mais um dia para o (somente para o Abono)

          var apontamentosToSend = _navigateDates(dataSol, $scope.solicitacao.dataFinal, apontamentoArray, $scope.solicitacao);
          modificarSolicitacao($scope.solicitacao);
          console.log("Array de apontamentos para envio: ", apontamentosToSend);
          saveSolicitacaoAndPeriodoApontamentos({
            solicitacao: $scope.solicitacao, 
            apontamentos: apontamentosToSend
          });
        }


      }, function errorCallback(response){

        $scope.errorMsg = response.data.message;
        //console.log("Erro na obtenção do apontamento diário: " + response.data.message);
        $scope.dataProcess = false;
      });
    }; 


    function coletarHistorico(apontamento){
      console.log("coletar historico");
      var historicoArray = apontamento.historico;
      var itemId = 1;
      if (historicoArray.length > 0){
        
        //historicoArray.sort(compareHist);
        //itemId = historicoArray[historicoArray.length-1].itemId + 1;
        itemId = historicoArray.length + 1;

      }

      var justificativaStr = "";
      if ($scope.solicitacao.tipo === 0)
        justificativaStr = "Ajuste de batimento aceito pelo Gestor";
      else
        justificativaStr = "Abono aceito pelo Gestor";

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

      //console.log('nextItemHistorico: ', nextItemHistorico);
      historicoArray.push(nextItemHistorico);
      console.log("historicoArray", historicoArray);
    };

    function modificarApontamento(apontamento){
      console.log("modificar apontamento");
      var statusObj = {};      

      if ($scope.solicitacao.horarioEnviado) {
        apontamento.infoTrabalho.aTrabalhar = apontamento.infoTrabalho.aTrabalhar - $scope.solicitacao.horarioEnviado.diff; 
      } else {
        apontamento.infoTrabalho.trabalhados = apontamento.infoTrabalho.aTrabalhar;
      }
      statusObj.id = 4;
      statusObj.descricao = "Abonado";

      apontamento.status = statusObj;
    };    

    function criarNovoApontamento(solicitacao, anotherDate){

      var data = util.getOnlyDate(new Date(solicitacao.data));
      if (anotherDate) 
        data = util.getOnlyDate(new Date(anotherDate));

      var statusObj = {};
      var infoTrabalho = util.getInfoTrabalho(solicitacao.funcionario, equipe, data, feriados);
      console.log("InfoTrabalho retornado: ", infoTrabalho);
      if (solicitacao.horarioEnviado) {
        infoTrabalho.trabalhados = 0;
        infoTrabalho.aTrabalhar = infoTrabalho.aTrabalhar - solicitacao.horarioEnviado.diff; //Abona o total de minutos enviado do que tem a trabalhar.
      } else {
        infoTrabalho.trabalhados = infoTrabalho.aTrabalhar;
      }
      statusObj.id = 4;
      statusObj.descricao = "Abonado";
        
      if (!infoTrabalho){
        $scope.errorMsg = "Código 1020: Não foi possível obter a informação de horário do funcionário.";
        return $scope.errorMsg;
      }

      var apontamento = {
        data: data,
        funcionario: solicitacao.funcionario._id,
        PIS: solicitacao.funcionario.PIS,
        status: statusObj,
        justificativa: "",
        infoTrabalho: infoTrabalho,
        marcacoes: [],
        marcacoesFtd: [],
        historico: []
      };

      console.log('apontamento a ser criado: ', apontamento);
      return apontamento;      
    };

    function modificarSolicitacao(solicitacao){

      solicitacao.resposta = {
        aprovada: true,
        data: util.getOnlyDate(new Date()),
        gestor: gestor._id
      };

      solicitacao.status = 1;
    };

    function saveSolicitacaoApontamento(objSolApont){
      
      console.log("objSolApont: ", objSolApont);
      
      myhitpointAPI.createSolicitationAndApontamento(objSolApont).then(function sucessCallback(response){

        console.log("salvos com sucesso!");
        $scope.dataProcess = false;
        $uibModalInstance.close(response.data.success);

      }, function errorCallback(response){

        $scope.errorMsg = response.data.message;
        console.log("Erro no SAVE do apontamento + solicitacao: ", response.data.message);
        $scope.dataProcess = false;
      });
    };

    function saveSolicitacaoAndPeriodoApontamentos(objSolicitacaoArrayApontamentos){

      console.log("Objeto enviado para atualização: ", objSolicitacaoArrayApontamentos);
      myhitpointAPI.createAndUpdateManyApontamentos(objSolicitacaoArrayApontamentos).then(function sucessCallback(response){

        console.log("salvos com sucesso!");
        $scope.dataProcess = false;
        $uibModalInstance.close(response.data.success);

      }, function errorCallback(response){

        $scope.errorMsg = response.data.message;
        console.log("Erro no SAVE do apontamento + solicitacao: ", response.data.message);
        $scope.dataProcess = false;
      });
    };

    function _navigateDates(date1, date2, apontamentoArray, solicitacao){

      var apontamentosNovos = [];
      var apontamentosAntigos = [];
      var findedDate = false;

      var d1 = angular.copy(date1); 
      var d2 = new Date(date2);
      d1.setHours(0,0,0,0);
      d2.setHours(0,0,0,0);

      console.log("Data 1: ", d1);
      console.log("Data 2: ", d2);

      var current = angular.copy(d1);
      var currentApont = {};

      while(current <= d2){
        console.log("Data no loop: ", current);
        currentApont = {};
        findedDate = false;
        //_hasApontamento()
        for (var i=0; i < apontamentoArray.length; i++){
          currentApont = angular.copy(apontamentoArray[i]);

          if (util.compareOnlyDates(current, new Date(currentApont.data)) === 0){
            console.log("Encontrou uma data que tem apontamento");
            findedDate = true;
            coletarHistorico(currentApont);
            modificarApontamento(currentApont);
            apontamentosAntigos.push(currentApont);
            break;
          }
        }

        if (!findedDate){
          currentApont = criarNovoApontamento(solicitacao, current);
          apontamentosNovos.push(currentApont);
        }

        current = util.addOrSubtractDays(current, 1);
      }

      return {
        novos: apontamentosNovos,
        antigos: apontamentosAntigos
      };
    };

  };


})();
