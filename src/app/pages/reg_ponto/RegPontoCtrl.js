/**
 * @author Gilliard Lopes
 * created on 26/04/2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.regponto')
      .controller('RegPontoCtrl', RegPontoCtrl)
      .controller('ModalRegisterCtrl', ModalRegisterCtrl);

  /** @ngInject */
  function RegPontoCtrl($scope, $filter, $location, $state, $interval, $uibModal, appointmentAPI, employeeAPI, Auth, usuario, currentDate, feriados, batidaDireta, util) {

    console.log("dentro do RegPontoCtrl, USUARIO: ", usuario);
    $scope.funcionario = usuario.data.funcionario;
    console.log('Funcionário: ', $scope.funcionario);
    $scope.currentDate = currentDate.data.date;
    $scope.currentDateFtd = $filter('date')($scope.currentDate, 'dd/MM/yyyy');

    var dataHoje = new Date($scope.currentDate);
    console.log('currentDate: ', $scope.currentDate);
    console.log('new Date (currentDate): ', new Date($scope.currentDate));

    console.log('Batida Direta?!??', batidaDireta);
    var batidaDireta = batidaDireta;
    var position = {};
    var feriados = feriados.data;
    var secsControl = 1;
    var apontamento = null;
    var marcacao = null;
    var pagePath = 'app/pages/reg_ponto/modals/registroModal.html';
    var defaultSize = 'md';
    var clock = new Date($scope.currentDate);//new Date($scope.currentDate);
    var tick = function() {
      //$scope.clock = Date.now();//atualiza os segundos manualmente
      clock.setSeconds(clock.getSeconds() + secsControl);
      $scope.clock = clock;
      //secsControl++;
    };

    $scope.open = function () {

      registro(pagePath, defaultSize);

    };

    /*
    * Ato de realizar a batida de ponto do funcionário
    */
    function registro (page, size) {
      
      // var geoLocalFixo = $scope.funcionario.geoLocalFixo;
      // //Se o usuário/funcionário tiver uma determinada flag
      // if (geoLocalFixo){
      //   if (geoLocalFixo.latitude && geoLocalFixo.longitude){
      //     if (position.lat && position.lon){
      //       //fazer o teste se a location está inserida no raio que é permitido para o usuario
            
      //     }
      //   }
      // }

      appointmentAPI.getCurrentDate().then(function sucessCallback(response){

        var newDate = new Date(response.data.date);
        console.log('newDate in client from server', newDate);

        var gId = (apontamento) ? getId(apontamento.marcacoes) : 1;
        var descricao = (apontamento) ? getDescricao(apontamento.marcacoes) : "ent1";

        marcacao = {
          id: gId,
          descricao: descricao,
          hora: newDate.getHours(),
          minuto: newDate.getMinutes(),
          segundo: newDate.getSeconds(),
          tzOffset: newDate.getTimezoneOffset(),
          RHWeb: true,
          REP: false,
          NSR: "WEB",
          gerada: {}
        };

        marcacao.totalMin = (marcacao.hora * 60) + marcacao.minuto;
        marcacao.strHorario = converteParaMarcacaoString(marcacao.hora, marcacao.minuto, ':');

        console.log('####### INICIO DE AVALIACAO DO METODO REGISTRO ##########');
        console.log('newDate', newDate);
        console.log('marcacao', marcacao);
        console.log('apontamento: ', apontamento);

        if (apontamento) {
          
          console.log('apontamento.marcacoes normal: ', apontamento.marcacoes);        
          apontamento.marcacoes.sort(function(a, b){//ordena o array de marcações
            return a.id - b.id;
          });
          apontamento.marcacoesFtd.sort(function(a, b){//ordena o array de marcaçõesFtd
            return a > b;
          });
          console.log('apontamento.marcacoes ordenados: ', apontamento.marcacoes);

          updateExtraInformations(newDate);//tem que ser chamado ANTES da atualização das marcações (o push abaixo)
          apontamento.marcacoes.push(marcacao);
          apontamento.marcacoesFtd.push(converteParaMarcacaoString(marcacao.hora, marcacao.minuto, ':'));
          setStatus(apontamento);
          console.log('novo apontamento: ', apontamento);
          update(page, size, apontamento._id, apontamento);

        } else {

          var extraInfo = createExtraInformations(newDate);

          apontamento = {
            data: getOnlyDate(newDate),
            status: {id: 1, descricao: 'Incompleto'},
            funcionario: $scope.funcionario._id,
            PIS: $scope.funcionario.PIS,
            marcacoes: [marcacao],
            justificativa: '',
            infoTrabalho: extraInfo.infoTrabalho,
            marcacoesFtd: [converteParaMarcacaoString(marcacao.hora, marcacao.minuto, ':')]
          };
          console.log('vai criar o apontamento: ', apontamento);
          create(page, size, apontamento);
        }

      }, function errorCallback(response) {

        $scope.errorMsg = "Erro ao obter a data do servidor, tente novamente dentro de alguns segundos";
        console.log("Erro de registro: " + response.data.message);

      });
    }
    
    function getId (array) {
      return (array.length + 1);
    }

    function getDescricao (array){
      
      if (array.length === 0)
        return "ent1";
      else if (array.length === 1)
        return "sai1";
      else if (array.length === 2)
        return "ent2";
      else if (array.length === 3)
        return "sai2";
      else { //verificar quantos pares de entrada/saida já foram adicionados para gerar a descricao
        if (array.length % 2 === 0) {//se é par
          return "ent" + ( (array.length/2) + 1);
        } else {
          return "sai" + (Math.floor(array.length/2) + 1);
        }
      }
    };

    function createExtraInformations(date) {

      console.log('Entrando no createExtraInformations: ', $scope.funcionario);
      var turno = null;
      var escala = null;
      var extraInformations = {};
      var infoTrabalho = {};

      if ($scope.funcionario)
        if ($scope.funcionario.alocacao)
          if ($scope.funcionario.alocacao.turno){
            turno = $scope.funcionario.alocacao.turno;
            if ($scope.funcionario.alocacao.turno.escala)
              escala = $scope.funcionario.alocacao.turno.escala;
          }
      
      var flagFeriado = isFeriado(date);

      if (escala) {
        
        console.log('entrou no if de criar informações extra de Escala');
        var ignoraFeriados = turno.ignoraFeriados;
        var minutos_trabalhados = undefined;
        if (escala.codigo == 1) {//escala tradicional na semana

          var diaTrabalho = isWorkingDayWeeklyScale(date.getDay(), turno.jornada.array);
          if (diaTrabalho.horarios && !flagFeriado) { //é um dia de trabalho normal

            infoTrabalho.trabalha = true;
            infoTrabalho.aTrabalhar = diaTrabalho.minutosTrabalho;
            minutos_trabalhados = getWorkedMinutes(date);
            if (minutos_trabalhados != undefined)
              infoTrabalho.trabalhados = getWorkedMinutes(date);//só calcula para ciclos pares de batidas

          } else {

            if (flagFeriado && ignoraFeriados) { //é um feriado mas o turno do colaborador ignora isso
              
              infoTrabalho.trabalha = true;
              infoTrabalho.aTrabalhar = diaTrabalho.minutosTrabalho;
              minutos_trabalhados = getWorkedMinutes(date);
              if (minutos_trabalhados != undefined)
                infoTrabalho.trabalhados = getWorkedMinutes(date);//só calcula para ciclos pares de batidas

            } else {

              infoTrabalho.trabalha = false;
              infoTrabalho.aTrabalhar = 0;
              minutos_trabalhados = getWorkedMinutes(date);
              if (minutos_trabalhados != undefined)
                infoTrabalho.trabalhados = getWorkedMinutes(date);//só calcula para ciclos pares de batidas
            }
          }

        } else if (escala.codigo == 2) { //escala 12x36

          //dia de trabalho
          console.log('new date from isWorkingDayRotationScale: ', new Date($scope.funcionario.alocacao.dataInicioEfetivo));
          if (isWorkingDayRotationScale(date, new Date($scope.funcionario.alocacao.dataInicioEfetivo)) && !flagFeriado){
            
            infoTrabalho.trabalha = true; 
            infoTrabalho.aTrabalhar = turno.jornada.minutosTrabalho;
            minutos_trabalhados = getWorkedMinutes(date);
            if (minutos_trabalhados != undefined)
              infoTrabalho.trabalhados = getWorkedMinutes(date);

          } else {

            if (flagFeriado && ignoraFeriados){ //é feriado mas o turno do colaborador ignora
              
              infoTrabalho.trabalha = true; 
              infoTrabalho.aTrabalhar = turno.jornada.minutosTrabalho;
              minutos_trabalhados = getWorkedMinutes(date);
              if (minutos_trabalhados != undefined)
                infoTrabalho.trabalhados = getWorkedMinutes(date);              

            } else {
             
              infoTrabalho.trabalha = false; 
              infoTrabalho.aTrabalhar = 0;
              minutos_trabalhados = getWorkedMinutes(date);
              if (minutos_trabalhados != undefined)
                infoTrabalho.trabalhados = getWorkedMinutes(date);
            }
          }
        }
        
        extraInformations.infoTrabalho = infoTrabalho;

      } else {

        $scope.errorMsg = "Funcionário não possui um turno ou uma escala de trabalho cadastrado(a).";
      }

      return extraInformations;
    };

    function updateExtraInformations(date){

      console.log('updateExtraInformations!');
      var minutos_trabalhados = getWorkedMinutes(date);
      if (minutos_trabalhados != undefined)
        apontamento.infoTrabalho.trabalhados = getWorkedMinutes(date);//só calcula para ciclos pares de batidas
      
    };

    /*
    *
    * Não Verifica, mas retorna o dia de trabalho na escala semanal
    *
    */
    function isWorkingDayWeeklyScale(dayToCompare, arrayJornadaSemanal) {
      
      var diaRetorno = {};
      arrayJornadaSemanal.forEach(function(objJornadaSemanal){
        if(dayToCompare == objJornadaSemanal.dia){
          diaRetorno = objJornadaSemanal;
          return diaRetorno;
        }
      });
      ////console.log("DIA RETORNO NO getDayInArrayJornadaSemanal: ", diaRetorno);
      return diaRetorno;
    };

    /*
    *
    * Verifica se é dia de trabalho na escala de revezamento 12x36h 
    *
    */
    function isWorkingDayRotationScale(dateToCompare, dataInicioEfetivo) {

      var oneDay = 24*60*60*1000; // hours*minutes*seconds*milliseconds
      
      var d1 = angular.copy(dateToCompare); 
      var d2 = angular.copy(dataInicioEfetivo);
      d1.setHours(0,0,0,0);
      d2.setHours(0,0,0,0);

      var diffDays = Math.round(Math.abs((d1.getTime() - d2.getTime())/(oneDay)));
      //////console.log("diffDays: ", diffDays);
      
      return (diffDays % 2 == 0) ? true : false;
    };

    /*
    * De acordo com a atual batida do funcionário, calcula as horas trabalhadas
    */
    function getWorkedMinutes(newDate) {
      console.log('Get Worked Minutes!');
      //primeira marcação, retorna 0
      if (marcacao.id == 1){
        return 0;
      }
      else {
        //se for uma marcação par, dá para calcular certinho
        if (marcacao.id % 2 == 0) {
          if (marcacao.id == 2){
            var parte1 = newDate.getHours()*60 + newDate.getMinutes();
            console.log('parte1: ', parte1);
            var parte2 = apontamento.marcacoes[0].hora*60 + apontamento.marcacoes[0].minuto;
            console.log('parte2: ', parte2);
            console.log('marcacao com id = 2, cálculo: ', (parte1 - parte2));
            return (newDate.getHours()*60 + newDate.getMinutes()) - (apontamento.marcacoes[0].hora*60 + apontamento.marcacoes[0].minuto);
          }
          else {            
            var minutosTrabalhados = 0;
            var lengthMarcacoes = apontamento.marcacoes.length;
            console.log('lengthMarcacoes: ', lengthMarcacoes);
            //obtém a primeira parcial de trabalho com a última batida (saída) e o registro de entrada anterior a ela. ex.: sai2 - ent2
            var parcial1 = newDate.getHours()*60 + newDate.getMinutes();
            var parcial2 = apontamento.marcacoes[lengthMarcacoes-1].hora*60 + apontamento.marcacoes[lengthMarcacoes-1].minuto;
            console.log('parcial 1: ', parcial1);
            console.log('parcial 2: ', parcial2);
            minutosTrabalhados = (newDate.getHours()*60 + newDate.getMinutes()) - (apontamento.marcacoes[lengthMarcacoes-1].hora*60 + apontamento.marcacoes[lengthMarcacoes-1].minuto);
            console.log('minutosTrabalhados: ', minutosTrabalhados);
            //como ainda não foi atualizado, esse array não tem a nova batida registrada em 'newDate' (parametro da funcao)
            for (var i=0; i < lengthMarcacoes-1; i=i+2){
              console.log('index: ', i);
              console.log('apontamento.marcacoes[i+1]: ', apontamento.marcacoes[i+1]);
              console.log('apontamento.marcacoes[i]: ', apontamento.marcacoes[i]);
              var forparcial1 = apontamento.marcacoes[i+1].hora*60 + apontamento.marcacoes[i+1].minuto;
              var forparcial2 = apontamento.marcacoes[i].hora*60 + apontamento.marcacoes[i].minuto;
              console.log('dentro do for, parcial 1: ', (forparcial1 - forparcial2));
              minutosTrabalhados += (apontamento.marcacoes[i+1].hora*60 + apontamento.marcacoes[i+1].minuto) - (apontamento.marcacoes[i].hora*60 + apontamento.marcacoes[i].minuto);
              console.log('minutosTrabalhados atualizado: ', minutosTrabalhados);
            }
            return minutosTrabalhados;
          } 
        } else return undefined;
      }
    };

    function converteParaMarcacaoString(hours, minutes, separator) {

      var hoursStr = "";
      var minutesStr = "";

      hoursStr = (hours >= 0 && hours <= 9) ? "0"+hours : ""+hours;           
      minutesStr = (minutes >= 0 && minutes <= 9) ? "0"+minutes : ""+minutes;

      return (separator) ? hoursStr+separator+minutesStr : hoursStr+minutesStr;
    };

    function getMarcacoesFtd() {

      var arrayMarcacoesFtd = [];

    };

    function isFeriado(date) {
       
      var day = date.getDate();//1 a 31
      var month = date.getMonth();//0 a 11
      var year = date.getFullYear();//
      var flagFeriado = false;
      var tempDate;

      feriados.forEach(function(feriado){
        
        tempDate = new Date(feriado.data);
        console.log('new date from feriado: ', new Date(feriado.data));
        if (feriado.fixo){
          
          if (tempDate.getMonth() === month && tempDate.getDate() === day){
            console.log("É Feriado (fixo)!");
            flagFeriado = true;
            return feriado;
          }

        } else {//se não é fixo

          if ( (tempDate.getFullYear() === year) && (tempDate.getMonth() === month) && (tempDate.getDate() === day) ){
            console.log("É Feriado (variável)!");
            flagFeriado = true;
            return feriado;
          }

        }
      });

      return flagFeriado;
    };

    function getOnlyDate (date) {
      console.log("date antes: ", date);
      var data = angular.copy(date);
      data.setHours(0,0,0,0); //essa data é importante zerar os segundos para que não tenha inconsistência na base
      console.log("date depois: ", data);
      return data;
    }; 

    
    function setStatus(apontamento) {

      var size = apontamento.marcacoes.length;
      if (size % 2 == 0) {//se for par, entendo que as marcações estão 'completas'
        apontamento.status = {
          id: 0,
          descricao: "Correto"
        };
      } else {
        apontamento.status = {
          id: 1,
          descricao: "Incompleto"
        }
      }
    };

    function create (page, size, apontamento) {

      appointmentAPI.create(apontamento).then(function sucessCallback(response){

        console.log("dados recebidos: ", response.data);
        var dateStr = $filter('date')(response.data.obj.date, "dd/MM/yyyy");
        var hora = $filter('zpad')(marcacao.hora);
        var minuto = $filter('zpad')(marcacao.minuto);
        $scope.successMsg = response.data.obj.message + dateStr + ", às " + hora + ":" + minuto;
        console.log('dados a serem enviados para o dialog: HORA: ', hora);
        console.log('dados a serem enviados para o dialog: MIN: ', minuto);
        confirmDialogRegister(page, size, dateStr, hora, minuto);

      }, function errorCallback(response){
        
        $scope.errorMsg = response.data.message;
        console.log("Erro de registro: " + response.data.message);
        
      }); 
    }

    function update (page, size, id, apontamento) {

      appointmentAPI.update(id, apontamento).then(function sucessCallback(response){

        console.log("dados recebidos: ", response.data);
        var dateStr = $filter('date')(response.data.obj.date, "dd/MM/yyyy");
        var hora = $filter('number')(marcacao.hora);
        var minuto = $filter('number')(marcacao.minuto);
        $scope.successMsg = response.data.obj.message + dateStr + ", às " + hora + ":" + minuto;
        confirmDialogRegister(page, size, dateStr, hora, minuto);

      }, function errorCallback(response){
        
        $scope.errorMsg = response.data.message;
        console.log("Erro de update: " + response.data.message);
        
      }); 
    }

    function confirmDialogRegister (page, size, date, hora, minuto) {

      var objectDlg = {
        funcionario: $scope.funcionario,
        date: date,
        hora: hora,
        minuto: minuto,
        batidaDireta: batidaDireta
      }

      var modalInstance = $uibModal.open({
        animation: true,
        templateUrl: page,
        size: size,
        controller: 'ModalRegisterCtrl',
        resolve: {
          objApontamento: function () {
            return objectDlg;
          }
        }
      });

      modalInstance.result.then(function (){
        
      }, function () {
        console.log('modal is dismissed or close.');
        if (batidaDireta){
          console.log("sair da app pois veio de uma batida direta, era só logar e bater o ponto");
          $scope.$emit('logout');
        } else {
          $state.reload();
        }
      });
    };
    
    function getApontamentoDiarioFromFuncionario() {
    
      var date = {
        raw: $scope.currentDate,
        year: dataHoje.getFullYear(),
        month: dataHoje.getMonth(),
        day: dataHoje.getDate(),
        hour: dataHoje.getHours(),
        minute: dataHoje.getMinutes()
        //dataFinal {}// => com o mesmo formato acima se quiser pegar para um range de datas...
      };

      employeeAPI.getPeriodoApontamentoByFuncionario($scope.funcionario._id, date).then(function sucessCallback(response){

        console.log('apontamento diário:', response.data);
        if (response.data.length > 0)
          apontamento = response.data[0];

        if (batidaDireta)
          registro(pagePath, defaultSize);

      }, function errorCallback(response){

        $scope.errorMsg = response.data.message;
        console.log("Erro na obtenção do apontamento diário: " + response.data.message);
      });
    }

    function init() {
      
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position){
          //$scope.$apply(function(){
          position.lat = position.coords.latitude;
          position.lon = position.coords.longitude;
          console.log("LAT: ", position.lat);
          console.log("LONG: ", position.lon);
          //});
        });
      }

      if ($scope.funcionario)
        getApontamentoDiarioFromFuncionario();
      else
        alert('Erro ao recuperar o funcionário cadastrado do Ponto');
            
    
      tick();
      $interval(tick, 1000);
    }

    //INICIALIZA O CONTROLLER COM ALGUMAS VARIÁVEIS
    init();
    
  }

  function ModalRegisterCtrl($uibModalInstance, $scope, objApontamento){
    
    console.log('test: ', objApontamento);
    $scope.batidaInfo = objApontamento;

    $scope.save = function() {

      console.log('Salvar Comprovante!');
      // download the PDF
      var docDefinition = {
        content: [
          'COMPROVANTE DE REGISTRO DE PONTO DO TRABALHADOR',
          'SISTEMA ALTERNATIVO DE BATIDA DE PONTO: RHPONTO',
          'CNPJ: '+'00.000.000/0000-00',
          'LOCAL: '+'UNIVASF',
          'NOME: ' + $scope.batidaInfo.funcionario.nome + ' ' + $scope.batidaInfo.funcionario.sobrenome, 
          'PIS: ' + $scope.batidaInfo.funcionario.PIS,
          'DATA: ' + $scope.batidaInfo.date + ',    HORA: ' + $scope.batidaInfo.hora+':'+$scope.batidaInfo.minuto,
          'NSR: '+'0000000044'
        ]
      };
      pdfMake.createPdf(docDefinition).download('comprovante_ponto.pdf');
    }

  }

})();
