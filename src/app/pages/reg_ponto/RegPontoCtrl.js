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
  function RegPontoCtrl($scope, $filter, $location, $state, $interval, $uibModal, appointmentAPI, employeeAPI, Auth, usuario, currentDate, batidaDireta) {

    console.log("dentro do RegPontoCtrl, USUARIO: ", usuario);
    $scope.funcionario = usuario.data.funcionario;
    $scope.currentDate = currentDate.data.date;
    $scope.currentDateFtd = $filter('date')($scope.currentDate, 'dd/MM/yyyy');

    console.log('Funcionário??', $scope.funcionario);
    console.log('Batida Direta?!??', batidaDireta);
    console.log('interval? ', $interval);
    var batidaDireta = batidaDireta;
    var secsControl = 0;
    var apontamento = null;
    var marcacao = null;
    var pagePath = 'app/pages/reg_ponto/modals/registroModal.html';
    var defaultSize = 'md';
    var tick = function() {
      //$scope.clock = Date.now();//atualiza os segundos manualmente
      var clock = new Date($scope.currentDate);
      clock.setSeconds(clock.getSeconds() + secsControl);
      $scope.clock = clock;
      secsControl++;
    };

    $scope.open = function () {

      registro(pagePath, defaultSize);

    };

    function registro (page, size) {
      
      appointmentAPI.getCurrentDate().then(function sucessCallback(response){

        var newDate = new Date(response.data.date);
        var gId = (apontamento) ? getId(apontamento.marcacoes) : 1;
        var descricao = (apontamento) ? getDescricao(apontamento.marcacoes) : "ent1";

        marcacao = {
          id: gId,
          descricao: descricao,
          hora: newDate.getHours(),
          minuto: newDate.getMinutes(),
          segundo: newDate.getSeconds(),
          gerada: {}
        };

        console.log('newDate, marcacao', newDate);
        console.log('newDate, marcacao', marcacao);
        console.log('apontamento: ', apontamento);

        if (apontamento) {
          
          apontamento.marcacoes.push(marcacao);
          console.log('vai dar push nas marcações');
          setStatus(apontamento);
          update(page, size, apontamento._id, apontamento);

        } else {

          apontamento = {
            data: getOnlyDate(newDate),
            status: {id: 1, descricao: 'Incompleto'},
            funcionario: $scope.funcionario._id,
            marcacoes: [marcacao],
            justificativa: ''
          };
          console.log('vai criar o apontamento');
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
      
    }

    function getOnlyDate (date) {
      console.log("date antes: ", date);
      var data = angular.copy(date);
      data.setHours(0,0,0,0); //essa data é importante zerar os segundos para que não tenha inconsistência na base
      console.log("date depois: ", data);
      return data;
    } 

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
    }

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
        }
      });
    };
    
    function getApontamentoDiarioFromFuncionario() {
    
      var date = {dataInicial: $scope.currentDate};

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
