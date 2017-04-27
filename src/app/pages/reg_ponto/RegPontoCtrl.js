/**
 * @author Gilliard Lopes
 * created on 26/04/2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.regponto')
      .controller('RegPontoCtrl', RegPontoCtrl);

  /** @ngInject */
  function RegPontoCtrl($scope, $filter, $location, $state, $interval, appointmentAPI, employeeAPI, Auth, usuario, currentDate, batidaDireta) {

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
    var tick = function() {
      //$scope.clock = Date.now();//atualiza os segundos manualmente
      var clock = new Date($scope.currentDate);
      clock.setSeconds(clock.getSeconds() + secsControl);
      $scope.clock = clock;
      secsControl++;
    };

    $scope.registro = function(ev) {
      
      apontamentosAPI.getCurrentDate().then(function sucessCallback(response){

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

        if (apontamento) {
          
          apontamento.marcacoes.push(marcacao);
          setStatus(apontamento);
          update(apontamento._id, apontamento, ev);

        } else {

          apontamento = {
            data: getOnlyDate(newDate),
            status: {id: 1, descricao: 'Incompleto'},
            funcionario: $scope.funcionario._id,
            marcacoes: [marcacao],
            justificativa: ''
          };
          create(apontamento, ev);
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

    function create (apontamento, ev) {

      apontamentosAPI.create(apontamento).then(function sucessCallback(response){

        console.log("dados recebidos: ", response.data);
        var dateStr = $filter('date')(response.data.obj.date, "dd/MM/yyyy");
        var hora = $filter('zpad')(marcacao.hora);
        var minuto = $filter('zpad')(marcacao.minuto);
        $scope.successMsg = response.data.obj.message + dateStr + ", às " + hora + ":" + minuto;
        confirmDialogRegister(ev, dateStr, hora, minuto);

      }, function errorCallback(response){
        
        $scope.errorMsg = response.data.message;
        console.log("Erro de registro: " + response.data.message);
        
      }); 
    }

    function update (id, apontamento, ev) {

      apontamentosAPI.update(id, apontamento).then(function sucessCallback(response){

        console.log("dados recebidos: ", response.data);
        var dateStr = $filter('date')(response.data.obj.date, "dd/MM/yyyy");
        var hora = $filter('number')(marcacao.hora);
        var minuto = $filter('number')(marcacao.minuto);
        $scope.successMsg = response.data.obj.message + dateStr + ", às " + hora + ":" + minuto;
        confirmDialogRegister(ev, dateStr, hora, minuto);

      }, function errorCallback(response){
        
        $scope.errorMsg = response.data.message;
        console.log("Erro de update: " + response.data.message);
        
      }); 
    }

    function confirmDialogRegister (ev, date, hora, minuto) {

      var objectDlg = {
        funcionario: $scope.funcionario,
        successMsg: $scope.successMsg,
        date: date,
        hora: hora,
        minuto: minuto,
        batidaDireta: batidaDireta
      }

      $mdDialog.show({
          controller: DialogController,
          templateUrl: 'view/dialog/batidaPonto.tmpl.html', //se passar caminho errado, ele buga dizendo que tentou carregar o angular mais de uma vez
          locals: {
            objectDlg: objectDlg
          },
          parent: angular.element(document.body),
          //parent: angular.element(document.querySelector('#popupContainer')),
          targetEvent: ev,
          clickOutsideToClose:true,
          fullscreen: $scope.customFullscreen // Only for -xs, -sm breakpoints.
        })
        .then(function(answer) {
          $scope.status = 'You said the information was "' + answer + '".';
          console.log("$scope.status: ", $scope.status);
          if(answer.toLowerCase() == "Sair".toLowerCase()){
            if (batidaDireta){
              console.log("sair da app pois veio de uma batida direta, era só logar e bater o ponto");
              $scope.$emit('logout');
          $location.path("/");
            }
          }
        }, function() {
          $scope.status = 'You cancelled the dialog.';
          console.log("$scope.status: ", $scope.status);
          if (batidaDireta){
            console.log("sair da app pois veio de uma batida direta, era só logar e bater o ponto");
            $scope.$emit('logout');
        $location.path("/");
            }
        });
    }    
    
    function getApontamentoDiarioFromFuncionario() {
    
      var date = {dataInicial: $scope.currentDate};

      employeeAPI.getPeriodoApontamentoByFuncionario($scope.funcionario._id, date).then(function sucessCallback(response){

        console.log('apontamento diário:', response.data);
        if (response.data.length > 0)
          apontamento = response.data[0];

        if (batidaDireta)
          $scope.registro();

      }, function errorCallback(response){

        $scope.errorMsg = response.data.message;
        console.log("Erro na obtenção do apontamento diário: " + response.data.message);

      });
    }

    function init() {
      
    // if ($scope.funcionario)
    //   getApontamentoDiarioFromFuncionario();
    // else
    //   $scope.usuario = usuario.data;    
  
    tick();
    $interval(tick, 1000);
    console.log('secsControl', secsControl);
    }

    //INICIALIZA O CONTROLLER COM ALGUMAS VARIÁVEIS
    init();
    
  }

})();
