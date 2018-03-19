/**
 * @author Gilliard Lopes
 * created on 22.04.2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.solicitations')
    .controller('SolicitationListCtrl', SolicitationListCtrl)
    .controller('ModalShowSolicitationCtrl', ModalShowSolicitationCtrl)
    .controller('ModalAproveSolicitationCtrl', ModalAproveSolicitationCtrl)
    .controller('ModalReproveSolicitationCtrl', ModalReproveSolicitationCtrl);

  /** @ngInject */
  function SolicitationListCtrl($scope, $state, $stateParams, $filter, $uibModal, Auth, solicitationAPI, usuario, solicitacoes) {
    
    $scope.smartTablePageSize = 15;
    $scope.solicitacoes = solicitacoes.data;
    $scope.qtdeSolicitacoes = solicitacoes.data.length;
    // console.log('List Ctrl - SolicitationListCtrl');
    // console.log('solicitacoes: ', solicitacoes.data);
    var Usuario = usuario.data;
    var pageShowSolicitationPath = 'app/pages/solicitations/modals/verSolicitacaoModal.html';
    var pageReproveSolicitationPath = 'app/pages/solicitations/modals/reproveSolicitacaoModal.html';
    var pageAproveSolicitationPath = 'app/pages/solicitations/modals/aproveSolicitacaoModal.html';
    var defaultSize = 'md'; //representa o tamanho da Modal

    $scope.ver = function (solicitation) {
      
      console.log('solicitation parameter: ', solicitation);
      showSolicitation(pageShowSolicitationPath, defaultSize, solicitation);
    };

    $scope.aprove = function (solicitation) {

      console.log('aprovar solicitacao', solicitation);
      confirmAprove(pageAproveSolicitationPath, defaultSize, solicitation);
    };

    $scope.reprove = function(solicitation){

      confirmReprove(pageReproveSolicitationPath, defaultSize, solicitation);
    };

    function confirmAprove(page, size, solicitation) {
      
      var modalInstance = $uibModal.open({
        animation: true,
        templateUrl: page,
        size: size,
        controller: 'ModalAproveSolicitationCtrl',
        backdrop: 'static',
        resolve: {
          solicitacao: function () {
            return solicitation;
          },
          gestor: function(){
            return Usuario.funcionario;
          },
          feriados: function(feriadoAPI){
            return feriadoAPI.get();
          },
          equipe: function(employeeAPI){
            return employeeAPI.getEquipe(solicitation.funcionario._id);
          }
        }
      });

      modalInstance.result.then(function (sucesso){
        
        if (sucesso){
          $state.reload();
        }

      }, function () {
        console.log('modal is dismissed or close.');
      });
    
    };

    function confirmReprove(page, size, solicitation) {
      
      var modalInstance = $uibModal.open({
        animation: true,
        templateUrl: page,
        size: size,
        controller: 'ModalReproveSolicitationCtrl',
        backdrop: 'static',
        resolve: {
          solicitacao: function () {
            return solicitation;
          },
          gestor: function(){
            return Usuario.funcionario;
          }
        }
      });

      modalInstance.result.then(function (sucesso){
        
        if (sucesso){
          $state.reload();
        }

      }, function () {
        console.log('modal is dismissed or close.');
      });
    
    };

    function showSolicitation(page, size, solicitation) {
      
      var objBatidasDiaria = {
        solicitacao: solicitation
      };

      console.log('solicitation: ', solicitation);

      var modalInstance = $uibModal.open({
        animation: true,
        templateUrl: page,
        size: size,
        controller: 'ModalShowSolicitationCtrl',
        resolve: {
          objBatidasDiaria: function () {
            return objBatidasDiaria;
          }
        }
      });

      modalInstance.result.then(function (){
        
      }, function () {
        console.log('modal is dismissed or close.');
      });
    
    };
  };

  function ModalShowSolicitationCtrl($uibModalInstance, $scope, util, objBatidasDiaria){

    $scope.solicitacao = objBatidasDiaria.solicitacao;

    var resultArray = util.getInfoSolicitacaoAjuste(objBatidasDiaria.solicitacao);      
    $scope.solicitacaoObtida = {
      anterior: resultArray.arrayESAnterior,
      proposto: resultArray.arrayESProposto      
    };

  };

  function ModalAproveSolicitationCtrl($uibModalInstance, $scope, employeeAPI, myhitpointAPI, util, solicitacao, gestor, feriados, equipe){

    $scope.solicitacao = solicitacao;
    $scope.dataProcess = false;

    console.log('equipe encontrada: ', equipe);
    console.log('feriados: ', feriados);

    var equipe = equipe.data;
    var feriados = feriados.data;

    console.log('gestor para aprovação: ', gestor);

    var resultArray = util.getInfoSolicitacaoAjuste(solicitacao);
    $scope.solicitacaoObtida = {
      anterior: resultArray.arrayESAnterior,
      proposto: resultArray.arrayESProposto      
    };

    $scope.confirma = function(){
      //preparativos para confirmação da aprovação da solicitação
      $scope.dataProcess = true;
      getApontamentoDiarioFromFuncionario();
    };

    function getApontamentoDiarioFromFuncionario() {
      
      var dataSol = new Date(solicitacao.data);

      var date = {
        raw: dataSol,
        year: dataSol.getFullYear(),
        month: dataSol.getMonth(),
        day: dataSol.getDate(),
        hour: dataSol.getHours(),
        minute: dataSol.getMinutes()
        //dataFinal {}// => com o mesmo formato acima se quiser pegar para um range de datas...
      };

      employeeAPI.getPeriodoApontamentoByFuncionario(solicitacao.funcionario._id, date).then(function sucessCallback(response){

        console.log('apontamento diário:', response.data);
        var apontamento = null;
        var isNewApontamento = false;

        if (response.data.length > 0){
          apontamento = response.data[0];
        }
        
        if (apontamento) {

          console.log('tem apontamento, fazer as coisas...');
          coletarHistorico(apontamento);
          modificarApontamento(apontamento);
          console.log('apontamento final:', apontamento);
          //tentar salvar a solicitacao e o apontamento

        } else {

          apontamento = criarNovoApontamento(solicitacao);
          isNewApontamento = true;
        }

        modificarSolicitacao(solicitacao);

        saveSolicitacaoApontamento({solicitacao: solicitacao, apontamento: apontamento, isNew: isNewApontamento});

      }, function errorCallback(response){

        $scope.errorMsg = response.data.message;
        console.log("Erro na obtenção do apontamento diário: " + response.data.message);
        $scope.dataProcess = false;
      });
    };    

    function coletarHistorico(apontamento){

      var historicoArray = apontamento.historico;
      var itemId = 1;
      if (historicoArray.length > 0){
        
        historicoArray.sort(compareHist);
        itemId = historicoArray[historicoArray.length-1] + 1;

      }
      var nextItemHistorico = {
        id: itemId,
        infoTrabalho: angular.copy(apontamento.infoTrabalho),
        marcacoes: angular.copy(solicitacao.anterior.marcacoes),
        marcacoesFtd: angular.copy(apontamento.marcacoesFtd),
        justificativa: "Aceita pelo Gestor",
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

    function modificarApontamento(apontamento){

      apontamento.status = {
        id: 3,
        descricao: "Justificado"
      };

      apontamento.marcacoesFtd = resultArray.arrayESProposto;
      apontamento.marcacoes = solicitacao.proposto.marcacoes;      
      apontamento.infoTrabalho.trabalhados = calcularHorasMarcacoesPropostas(apontamento.marcacoes);
    };

    function calcularHorasMarcacoesPropostas(marcacoesArray){

      var minutosTrabalhados = 0;
      var lengthMarcacoes = marcacoesArray.length;
      var parcial1 = 0;
      var parcial2 = 0;

      if (lengthMarcacoes >= 2){
        for (var i=0; i < lengthMarcacoes-1; i=i+2){
          parcial1 = marcacoesArray[i+1].hora*60 + marcacoesArray[i+1].minuto;
          parcial2 = marcacoesArray[i].hora*60 + marcacoesArray[i].minuto;
          minutosTrabalhados += parcial1 - parcial2;
        }  
      }
      
      return minutosTrabalhados;
    };

    function criarNovoApontamento(solicitacao){

      var data = util.getOnlyDate(new Date(solicitacao.data));
      var infoTrabalho = util.getInfoTrabalho(solicitacao.funcionario, equipe, data, feriados);
      infoTrabalho.trabalhados = calcularHorasMarcacoesPropostas(solicitacao.proposto.marcacoes);

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
      
      myhitpointAPI.saveSolicitationAndApontamento(objSolApont).then(function sucessCallback(response){

        console.log("salvos com sucesso!");
        $scope.dataProcess = false;
        $uibModalInstance.close(response.data.success);

      }, function errorCallback(response){

        $scope.errorMsg = response.data.message;
        console.log("Erro no SAVE do apontamento + solicitacao: ", response.data.message);
        $scope.dataProcess = false;
      });
    };

    //Compara dois itens de historico e retorna crescentemente pelo Id
    function compareHist(a, b){
    
      if (a.id < b.id)
        return -1;
      if (a.id > b.id)
        return 1;
      return 0;
    };

  };

  function ModalReproveSolicitationCtrl($uibModalInstance, $scope, myhitpointAPI, util, solicitacao, gestor){

    $scope.solicitacao = solicitacao;
    $scope.algo = {};

    var resultArray = util.getInfoSolicitacaoAjuste(solicitacao);
    $scope.solicitacaoObtida = {
      anterior: resultArray.arrayESAnterior,
      proposto: resultArray.arrayESProposto      
    };

    $scope.reprova = function(){
      //preparativos para confirmação da rejeição da solicitação
      $scope.dataProcess = true;
      solicitacao.resposta = {
        aprovada: false,
        data: util.getOnlyDate(new Date()),
        gestor: gestor._id,
        motivo: $scope.algo.motivo
      };

      solicitacao.status = -1;
      saveReprovacaoSolicitacao(solicitacao);
    };

    function saveReprovacaoSolicitacao(solicitacao){
      
      console.log('solicitacao para rejeição: ', solicitacao);
      myhitpointAPI.update(solicitacao).then(function sucessCallback(response){

        console.log("atualizado com sucesso!");
        $scope.dataProcess = false;
        $uibModalInstance.close(response.data.success);

      }, function errorCallback(response){

        $scope.errorMsg = response.data.message;
        console.log("Erro no SAVE da solicitacao: ", response.data.message);
        $scope.dataProcess = false;
      });
    };
  };

})();
