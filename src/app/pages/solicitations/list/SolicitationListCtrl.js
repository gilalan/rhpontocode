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
  function SolicitationListCtrl($scope, $state, $stateParams, $filter, $uibModal, Auth, solicitationAPI, teamAPI, myhitpointAPI, usuario, solicitacoes){//, solicitacoes) {
    
    $scope.smartTablePageSize = 15;
    $scope.gestor = usuario.data.funcionario;
    $scope.solicitacoes = solicitacoes.data;
    
    var allEmployees = [];
    // //console.log('List Ctrl - SolicitationListCtrl');
    ////console.log('solicitacoes: ', solicitacoes.data);
    var Usuario = usuario.data;
    var pageShowSolicitationPath = 'app/pages/solicitations/modals/verSolicitacaoModal.html';
    var pageReproveSolicitationPath = 'app/pages/solicitations/modals/reproveSolicitacaoModal.html';
    var pageAproveSolicitationPath = 'app/pages/solicitations/modals/aproveSolicitacaoModal.html';
    var defaultSize = 'md'; //representa o tamanho da Modal    

    //init();

    //Nomear os tipos das Solicitações
    for (var i = 0; i < $scope.solicitacoes.length; i++) {
      if ($scope.solicitacoes[i].tipo == 0){
        $scope.solicitacoes[i].tipoStr = "Ajuste";
        $scope.solicitacoes[i].classAjuste = true;
      }
      if ($scope.solicitacoes[i].tipo == 1){
        $scope.solicitacoes[i].tipoStr = "Abono";
        $scope.solicitacoes[i].classAjuste = false;
      }
    }
    console.log("Scope.Solicitações: ", $scope.solicitacoes);

    $scope.ver = function (solicitation) {
      
      //console.log('solicitation parameter: ', solicitation);
      showSolicitation(pageShowSolicitationPath, defaultSize, solicitation);
    };

    $scope.aprove = function (solicitation) {

      //console.log('aprovar solicitacao', solicitation);
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
        //console.log('modal is dismissed or close.');
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
        //console.log('modal is dismissed or close.');
      });
    
    };

    function showSolicitation(page, size, solicitation) {
      
      var objBatidasDiaria = {
        solicitacao: solicitation
      };

      //console.log('solicitation: ', solicitation);

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
        //console.log('modal is dismissed or close.');
      });
    
    };

    /*
     *
     * Função chamada no início do carregamento, traz as equipes do gestor atual
     *
    **/
    function getEquipesByGestor() {

      teamAPI.getEquipesByGestor($scope.gestor).then(function successCallback(response){

        $scope.equipes = response.data;
        //console.log('testando equipes para fiscal: ', response.data);
        if($scope.equipes){
          if($scope.equipes.length > 0){
            
            for (var i=0; i < $scope.equipes.length; i++) {
              for (var j=0; j < $scope.equipes[i].componentes.length; j++) {
                if ($scope.equipes[i].componentes[j].active === true){
                  allEmployees.push($scope.equipes[i].componentes[j]);  
                }
              }
            }
            //console.log("equipes trazidas pelo gestor: ", $scope.equipes);
            //console.log("allEmployees: ", allEmployees);
            getSolicitationsByTeams(allEmployees);
          } 
        } 

        ////console.log('Equipes do gestor: ', response.data);

      }, 
      function errorCallback(response){
        $errorMsg = response.data.message;
        ////console.log("houve um erro ao carregar as equipes do gestor");
      });
    };

    function getSolicitationsByTeams (employees) {

      var obj = {
        status: 0,
        employees: employees
      };

      myhitpointAPI.getByTeams(obj).then(function successCallback(response){

        $scope.solicitacoes = response.data;
        $scope.qtdeSolicitacoes = $scope.solicitacoes.length;
        //console.log('testando solicitações: ', response.data);

      }, 
      function errorCallback(response){
        $errorMsg = response.data.message;
        ////console.log("houve um erro ao carregar as equipes do gestor");
      });
    };

    function init() {

      getEquipesByGestor();
    };
  };

  function ModalShowSolicitationCtrl($uibModalInstance, $scope, $filter, util, objBatidasDiaria){

    $scope.solicitacao = objBatidasDiaria.solicitacao;
    $scope.solicitacao.isAbono = $scope.solicitacao.tipo === 0 ? false : true;
    var resultArray = util.getInfoSolicitacaoAjuste(objBatidasDiaria.solicitacao);      
    $scope.solicitacaoObtida = {
      anterior: resultArray.arrayESAnterior,
      proposto: resultArray.arrayESProposto      
    };

    if ($scope.solicitacao.tipo == 1) { //abono
      setAbonoSolicit();
    }

    function setAbonoSolicit(){

      $scope.solicitacao.message = false;
      $scope.solicitacao.tipoZero = false;
      $scope.solicitacao.tipoUm = false;
      $scope.solicitacao.tipoDois = false;

      var data1 = $filter('date')($scope.solicitacao.data, 'dd/MM/yyyy');
      $scope.solicitacao.dataAbonoStr = data1;

      if (!$scope.solicitacao.dataFinal){
        $scope.solicitacao.message = "Ausência de Justificativa para dia único";
        if ($scope.solicitacao.horarioEnviado) {
          $scope.solicitacao.message += " e período de tempo limitado";
          $scope.solicitacao.tipoUm = true;
        }
        $scope.solicitacao.tipoZero = !$scope.solicitacao.tipoUm;
      } else {
        $scope.solicitacao.message = "Ausência de Justificativa para um período de dias";
        var data2 = $filter('date')($scope.solicitacao.dataFinal, 'dd/MM/yyyy');
        $scope.solicitacao.dataAbonoStr += " até " + data2;
        $scope.solicitacao.tipoDois = true;
      }
    };

  };

  function ModalAproveSolicitationCtrl($uibModalInstance, $scope, $filter, employeeAPI, myhitpointAPI, util, solicitacao, gestor, feriados, equipe){

    $scope.solicitacao = solicitacao;
    $scope.dataProcess = false;

    $scope.solicitacao.isAbono = $scope.solicitacao.tipo === 0 ? false : true;

    if ($scope.solicitacao.tipo == 1) { //abono
      setAbonoSolicit();
    }    

    var equipe = equipe.data;
    var feriados = feriados.data;

    //console.log('gestor para aprovação: ', gestor);

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

    function setAbonoSolicit(){

      $scope.solicitacao.message = false;
      $scope.solicitacao.tipoZero = false;
      $scope.solicitacao.tipoUm = false;
      $scope.solicitacao.tipoDois = false;

      var data1 = $filter('date')($scope.solicitacao.data, 'dd/MM/yyyy');
      $scope.solicitacao.dataAbonoStr = data1;

      if (!$scope.solicitacao.dataFinal){
        $scope.solicitacao.message = "Ausência de Justificativa para dia único";
        if ($scope.solicitacao.horarioEnviado) {
          $scope.solicitacao.message += " e período de tempo limitado";
          $scope.solicitacao.tipoUm = true;
        }
        $scope.solicitacao.tipoZero = !$scope.solicitacao.tipoUm;
      } else {
        $scope.solicitacao.message = "Ausência de Justificativa para um período de dias";
        var data2 = $filter('date')($scope.solicitacao.dataFinal, 'dd/MM/yyyy');
        $scope.solicitacao.dataAbonoStr += " até " + data2;
        $scope.solicitacao.tipoDois = true;
      }
    };

    function getApontamentoDiarioFromFuncionario() {
      
      var multiDatas = false;
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

      if (solicitacao.tipo == 1) {
        
        if (!solicitacao.dataFinal){
          $scope.solicitacao.message = "Abono para dia único";
          if (solicitacao.horarioEnviado) {
            $scope.solicitacao.message += " e período de tempo limitado";
            //$scope.tipoUm = true;
          }
          //$scope.tipoZero = !$scope.tipoUm;
        } else {
          $scope.solicitacao.message = "Abono para um período de dias";
          //coloca uma data a mais na busca pois o argumento da pesquisa no mongoose é MENOR QUE (não inclui)
          var dataEnd = new Date(solicitacao.dataFinal);
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
      }

      employeeAPI.getPeriodoApontamentoByFuncionario(solicitacao.funcionario._id, date).then(function sucessCallback(response){

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
              modificarSolicitacao(solicitacao); 
              //console.log("Enviaria o seguinte apontamento: ", apontamento);
              //console.log("enviaria a seguinte solicitacao: ", solicitacao);     
              saveSolicitacaoApontamento({solicitacao: solicitacao, apontamento: apontamento, isNew: isNewApontamento, uploaded: true});

            } else { //caso de período de dias para abono...
              console.log("Modificiar apontamento com período de itens");  
              //modificarSolicitacao(solicitacao);
              //saveSolicitacaoApontamento({solicitacao: solicitacao, apontamento: apontamento, isNew: isNewApontamento});
            }

          } else {
            console.log("Criar Apontamento, pois veio vazio");
            apontamento = criarNovoApontamento(solicitacao);
            isNewApontamento = true;
            modificarSolicitacao(solicitacao);      
            saveSolicitacaoApontamento({solicitacao: solicitacao, apontamento: apontamento, isNew: isNewApontamento, uploaded: true});
          }
        } else { //Caso de mais um dia para o (somente para o Abono)

          var apontamentosToSend = _navigateDates(dataSol, solicitacao.dataFinal, apontamentoArray, solicitacao);
          modificarSolicitacao(solicitacao);
          console.log("Array de apontamentos para envio: ", apontamentosToSend);
          saveSolicitacaoAndPeriodoApontamentos({
            solicitacao: solicitacao, 
            apontamentos: apontamentosToSend,
            uploaded: true
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
        marcacoes: angular.copy(solicitacao.anterior.marcacoes),
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
      var statusObj = {
        id: 3,
        descricao: "Justificado"
      };      

      if ($scope.solicitacao.tipo === 0) {//Ajuste
        apontamento.infoTrabalho.trabalhados = util.calcularHorasMarcacoesPropostas(apontamento.marcacoes);
        apontamento.marcacoesFtd = resultArray.arrayESProposto;
        apontamento.marcacoes = solicitacao.proposto.marcacoes;      
      }
      else {//abono
        if ($scope.solicitacao.horarioEnviado) {
          //Abona o total de minutos enviado do que tem a trabalhar.
          apontamento.infoTrabalho.aTrabalhar = apontamento.infoTrabalho.aTrabalhar - $scope.solicitacao.horarioEnviado.diff; 
        } else {
          apontamento.infoTrabalho.trabalhados = apontamento.infoTrabalho.aTrabalhar;
        }
        statusObj.id = 4;
        statusObj.descricao = "Abonado";
      } 

      apontamento.status = statusObj;
    };    

    function criarNovoApontamento(solicitacao, anotherDate){

      var data = util.getOnlyDate(new Date(solicitacao.data));
      if (anotherDate) 
        data = util.getOnlyDate(new Date(anotherDate));

      var statusObj = {
        id: 3,
        descricao: "Justificado"
      };
      var infoTrabalho = util.getInfoTrabalho(solicitacao.funcionario, equipe, data, feriados);
      
      if (solicitacao.tipo === 0) {//Ajuste
        infoTrabalho.trabalhados = util.calcularHorasMarcacoesPropostas(solicitacao.proposto.marcacoes);
      }
      else {//abono
        if (solicitacao.horarioEnviado) {
          infoTrabalho.trabalhados = 0;
          infoTrabalho.aTrabalhar = infoTrabalho.aTrabalhar - solicitacao.horarioEnviado.diff; //Abona o total de minutos enviado do que tem a trabalhar.
        } else {
          infoTrabalho.trabalhados = infoTrabalho.aTrabalhar;
        }
        statusObj.id = 4;
        statusObj.descricao = "Abonado";
      } 
        
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

        //console.log("salvos com sucesso!");
        $scope.dataProcess = false;
        $uibModalInstance.close(response.data.success);

      }, function errorCallback(response){

        $scope.errorMsg = response.data.message;
        //console.log("Erro no SAVE do apontamento + solicitacao: ", response.data.message);
        $scope.dataProcess = false;
      });
    };

    function saveSolicitacaoAndPeriodoApontamentos(objSolicitacaoArrayApontamentos){

      console.log("Objeto enviado para atualização: ", objSolicitacaoArrayApontamentos);
      myhitpointAPI.insertAndUpdateManyApontamentos(objSolicitacaoArrayApontamentos).then(function sucessCallback(response){

        //console.log("salvos com sucesso!");
        $scope.dataProcess = false;
        $uibModalInstance.close(response.data.success);

      }, function errorCallback(response){

        $scope.errorMsg = response.data.message;
        //console.log("Erro no SAVE do apontamento + solicitacao: ", response.data.message);
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

    //Compara dois itens de historico e retorna crescentemente pelo Id
    function compareHist(a, b){
    
      if (a.id < b.id)
        return -1;
      if (a.id > b.id)
        return 1;
      return 0;
    };

  };

  function ModalReproveSolicitationCtrl($uibModalInstance, $scope, $filter, myhitpointAPI, util, solicitacao, gestor){

    $scope.solicitacao = solicitacao;
    $scope.algo = {};

    $scope.solicitacao.isAbono = $scope.solicitacao.tipo === 0 ? false : true;

    if ($scope.solicitacao.tipo == 1) { //abono
      setAbonoSolicit();
    }

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

    function setAbonoSolicit(){

      $scope.solicitacao.message = false;
      $scope.solicitacao.tipoZero = false;
      $scope.solicitacao.tipoUm = false;
      $scope.solicitacao.tipoDois = false;

      var data1 = $filter('date')($scope.solicitacao.data, 'dd/MM/yyyy');
      $scope.solicitacao.dataAbonoStr = data1;

      if (!$scope.solicitacao.dataFinal){
        $scope.solicitacao.message = "Ausência de Justificativa para dia único";
        if ($scope.solicitacao.horarioEnviado) {
          $scope.solicitacao.message += " e período de tempo limitado";
          $scope.solicitacao.tipoUm = true;
        }
        $scope.solicitacao.tipoZero = !$scope.solicitacao.tipoUm;
      } else {
        $scope.solicitacao.message = "Ausência de Justificativa para um período de dias";
        var data2 = $filter('date')($scope.solicitacao.dataFinal, 'dd/MM/yyyy');
        $scope.solicitacao.dataAbonoStr += " até " + data2;
        $scope.solicitacao.tipoDois = true;
      }
    };

    function saveReprovacaoSolicitacao(solicitacao){
      
      //console.log('solicitacao para rejeição: ', solicitacao);
      myhitpointAPI.update(solicitacao).then(function sucessCallback(response){

        //console.log("atualizado com sucesso!");
        $scope.dataProcess = false;
        $uibModalInstance.close(response.data.success);

      }, function errorCallback(response){

        $scope.errorMsg = response.data.message;
        //console.log("Erro no SAVE da solicitacao: ", response.data.message);
        $scope.dataProcess = false;
      });
    };
  };

})();
