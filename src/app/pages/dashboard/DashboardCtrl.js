/**
 * @author Gilliard Lopes
 * created on 25/04/2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.dashboard')
      .controller('DashboardCtrl', DashboardCtrl);

  /** @ngInject */
  function DashboardCtrl($scope, $filter, $sce, setores, usuario, feriados, currentDate, util, teamAPI, appointmentAPI, baConfig, dashboardDataFactory) {
    
    //console.log('setore resolve: ', setores);
    //console.log('dashboardFactory from controller', dashboardDataFactory);
    
    var layoutColors = baConfig.colors;
    var graphColor = baConfig.theme.blur ? '#000000' : layoutColors.primary;
    var toleranciaInternaRH = 10; //Fixada em 10 min, permite o cálculo correto de horas extras pelo RH.

    $scope.setores = setores.data;
    $scope.usuario = usuario.data;
    $scope.feriados = feriados.data;
    //console.log('USUÁRIO: ', $scope.usuario);
    $scope.currentDate = new Date(currentDate.data.date);//usado aqui - fica variando a medida que o usuario navega
    $scope.currentDateFtd = $filter('date')($scope.currentDate, 'abvFullDate');
    $scope.equipe = {};
    $scope.gestor = $scope.usuario.funcionario;
    //console.log('GESTOR: ', $scope.gestor);
    $scope.baloon = {}; // para o popover dos funcionários com mais de 4 batidas...
    $scope.liberado = false;
    
    //Inicializadas no init
    $scope.currentWeek = {};
    $scope.currentWeekFtd = {};

    var defaultButtonSelected = 7;
    $scope.barButtonSelected = defaultButtonSelected;
    $scope.lineButtonSelected = defaultButtonSelected;

    var weekDays = ["Dom","Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    var objMapDataLabel = {0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6};
    var dataHoje = new Date(currentDate.data.date);//data de hoje mesmo para comparações com as datas que ele vai navegando
    $scope.dataHojeFtd = $filter('date')(dataHoje, 'abvFullDate');
    var firstRun = true;

    
    $scope.datepic = {
      dt: new Date()
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
      //console.log("open function", $scope.something.opened);
      $scope.something.opened = true;
    }

    $scope.changeDate = function(date) {
      $scope.currentDate = new Date(date);
      $scope.currentDateFtd = $filter('date')($scope.currentDate, 'abvFullDate');
      //console.log("current date: ", $scope.currentDate);
      getApontamentosByDateRangeAndEquipe($scope.currentDate, {dias: 1}, $scope.equipe.componentes, true, false, false);//pegando o diário
    };
    
    
    /*
     *
     * Navegação nos dias dos registros diários
     *
    **/    
    $scope.subtractOneDay = function () {

      $scope.currentDate.setDate($scope.currentDate.getDate() - 1);
      $scope.currentDateFtd = $filter('date')($scope.currentDate, 'abvFullDate');

      //console.log("current date: ", $scope.currentDate);
      getApontamentosByDateRangeAndEquipe($scope.currentDate, {dias: 1}, $scope.equipe.componentes, true, false, false);//pegando o diário
    }

    $scope.addOneDay = function () {

      $scope.currentDate.setDate($scope.currentDate.getDate() + 1);
      $scope.currentDateFtd = $filter('date')($scope.currentDate, 'abvFullDate');

      //console.log("current date: ", $scope.currentDate);
      getApontamentosByDateRangeAndEquipe($scope.currentDate, {dias: 1}, $scope.equipe.componentes, true, false, false);//pegando o diário
    }

    $scope.barChartDias = function (button) {

      var antigoSelected = $scope.barButtonSelected;
      if (!button.selecionado) {
        $scope.barButtonSelected = button.value;
        button.selecionado = !button.selecionado;
        $scope.btnBarChartArray.forEach(function(otherBtn){
          //console.log('otherBtn: ', otherBtn);
          if(otherBtn.value != button.value)
            otherBtn.selecionado = false;
        });
      }

      if (antigoSelected != button.value) {
        //console.log('entrou no IF de buttons');
        if (button.value == 7 || button.value == 15 || button.value == 30) {
          
          //a data inicial é a de hoje menos o número de dias que deseja 'voltar' no gráfico
          var dataInicial = new Date(addOrSubtractDays(dataHoje, -button.value));                    
          getApontamentosByDateRangeAndEquipe(dataInicial, {dias: button.value+1, barInterval: button.value+1}, $scope.equipe.componentes, false, true, false);//atualiza só o barData
        }
        else {

          $scope.errorMsg = "Não há essa opção disponível";
        }
      }
    };

    $scope.lineChartDias = function (button) {

      //console.log('Direto do lineChart: ', button.value);
      var antigoSelected = $scope.lineButtonSelected;
      if (!button.selecionado) {
        $scope.lineButtonSelected = button.value;
        button.selecionado = !button.selecionado;
        $scope.btnLineChartArray.forEach(function(otherBtn){
          //console.log('otherBtn: ', otherBtn);
          if(otherBtn.value != button.value)
            otherBtn.selecionado = false;
        });
      }

      if (antigoSelected != button.value) {

        //console.log('entrou no IF de buttons');
        if (button.value == 7 || button.value == 15 || button.value == 30) {
          //a data inicial é a de hoje menos o número de dias que deseja 'voltar' no gráfico
          var dataInicial = new Date(addOrSubtractDays(dataHoje, -button.value));                    
          getApontamentosByDateRangeAndEquipe(dataInicial, {dias: button.value+1, lineInterval: button.value+1}, $scope.equipe.componentes, false, false, true);//atualiza só o lineData
        }
      }
       
      else {

        $scope.errorMsg = "Não há essa opção disponível";
      }
    };

    /*
     *
     * Escolha das equipes força uma nova solicitação ao servidor e carrega tudo novamente no showIndicators()
     *
    **/
    $scope.checkUncheckEquipe = function(equipe) {

      //console.log("clicked equipe: ", equipe.nome);
      //Não pode simplesmente deselecionar uma equipe, ele tem q manter 1 ativa sempre
      if (!equipe.selecionada) {
        
        equipe.selecionada = !equipe.selecionada;
        $scope.equipes.forEach(function(otherEquipe){
          if(otherEquipe._id != equipe._id)
            otherEquipe.selecionada = false;
        });

        showIndicators(equipe, $scope.barButtonSelected, $scope.lineButtonSelected);
      }
    }

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
            
            for (var i=0; i < $scope.equipes.length; i++) {
            
              $scope.equipes[i].componentes = $scope.equipes[i].componentes.filter(function( obj ) {
                return obj.active === true;
              });

            }
            console.log("equipes trazidas pelo gestor: ", $scope.equipes);
            $scope.equipes[0].selecionada = true;            
            showIndicators($scope.equipes[0], $scope.barButtonSelected, $scope.lineButtonSelected);
          } 
        } 

        //console.log('Equipes do gestor: ', response.data);

      }, 
      function errorCallback(response){
        $errorMsg = response.data.message;
        //console.log("houve um erro ao carregar as equipes do gestor");
      });
    };

    /*
     *
     * Carrega a tela de acordo com a equipe escolhida/chamado só quando varia a equipe/início da tela
     * Solicita ao servidor um objeto com os apontamentos dos componentes da equipe
     *
    **/
    function showIndicators(equipe, barIntervaloDias, lineIntervaloDias) {

      $scope.equipe = equipe;
      console.log('passando no showIndicators: ', equipe);
      
      if (!equipe.componentes){

        $scope.equipe.componentes = [];

      } else {

        //Atualiza junto com o intervalo dias selecionado no gráfico...
        var intervaloDias = {
          dias: (barIntervaloDias >= lineIntervaloDias) ? barIntervaloDias+1 : lineIntervaloDias+1,
          barInterval: barIntervaloDias,
          lineInterval: lineIntervaloDias
        };
        //pegando o semanal (passa 8 mas traz 7, não inclui a última data)
        //Se quiser o do dia, basta passar 1.
        //a data inicial é a de hoje menos o número de dias que deseja 'voltar' no gráfico
        var dataInicial = new Date(addOrSubtractDays(dataHoje, -(intervaloDias.dias-1)));
        getApontamentosByDateRangeAndEquipe(dataInicial, intervaloDias, $scope.equipe.componentes, true, true, true);
      }
    };

    /*
     *
     * Solicita ao servidor um objeto com os apontamentos dos componentes da equipe
     *
    **/
    function getApontamentosByDateRangeAndEquipe(beginDate, intervaloDias, componentes, updateDiario, updateBarData, updateLineData) {

      //console.log('beginDate? ', beginDate);
      //console.log('intervaloDias? ', intervaloDias);
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

      //console.log("Objeto Date Equipe Enviado: ", objDateEquipe);

      appointmentAPI.getApontamentosByDateRangeAndEquipe(objDateEquipe).then(function successCallback(response){

        var apontamentosResponse = response.data;
        //console.log("!@# Apontamentos Semanais: ", apontamentosResponse);

        if (updateDiario) {
          var apontamentosDiarios = getOnlyApontDiarios(apontamentosResponse); //serve apenas para a tabela 
          //console.log('apontamento diário trazido:', apontamentosDiarios);
          createPrettyStringResults(apontamentosDiarios);
          //console.log(" APONTAMENTOS DIARIOS ", apontamentosDiarios);
        }

        if (updateBarData) {
          var chartDataEx = buildWeeklyBarChartData(dateAux, intervaloDias.barInterval, apontamentosResponse);
          //console.log('chart data após chamar o gŕafico: ', chartDataEx);
          dashboardDataFactory.setBarData(chartDataEx);
        }

        if (updateLineData) {
          var chartLineData = buildLineChartData(dateAux, intervaloDias.lineInterval, apontamentosResponse);
          //console.log('chart data após chamar o gŕafico: ', chartDataEx);
          dashboardDataFactory.setLineData(chartLineData);
        }

      }, function errorCallback(response){
        
        $errorMsg = response.data.message;
        //console.log("Erro ao obter apontamentos por um range de data e equipe");
      });
    };

    /*
    * Essa função obtém apenas os apontamentos de currentDate, dentro de um objeto semanal
    */
    function getOnlyApontDiarios(apontamentosSemanais) {

      //console.log('apontamentosSemanais.length: ', apontamentosSemanais.length);

      return apontamentosSemanais.filter(function(apontamento){
        //console.log("apontamento.data: ", new Date(apontamento.data));
        //console.log("currentDate: ", $scope.currentDate);
        //console.log("são iguais? ", compareOnlyDates(new Date(apontamento.data), $scope.currentDate))

        return (compareOnlyDates(new Date(apontamento.data), //se a data for idêntica, traz ela no filter
          $scope.currentDate) === 0);
      });
    };

    /*
     *
     * Cria uma propriedade chamada 'apontamentoDiario' no objeto do funcionário que alimentará o preenchimento da tabela
     * Essa propriedade traz as informações apuradas nos métodos abaixo
     *
    **/    
    function createPrettyStringResults(apontamentoDiariosPorFuncionario) {

      var hasAppoint = false;
      var isActive = false; //Flag para saber se ele estava admitido na data para mostrar no indicador
      //console.log('apontamentos diários por funcionário! ', apontamentoDiariosPorFuncionario);

      $scope.equipe.componentes.forEach(function(componente){//vai criar as informações para cada componente, mesmo que ele não tenha apontamento
        
        hasAppoint = false;
        sortArrayJornadaAsc(componente);
        //console.log('componente: ', componente.nome);

        //verifica para cada apontamento diário se há um pertencente ao atual componente no laço forEach
        apontamentoDiariosPorFuncionario.forEach(function(apontamentoDiarioPorFuncionario){
          
          //if (isActiveWorker(componente)); se não for ativo, já poderia setar aqui o apontamento inválido... 
          //para não levar ele em consideração melhor dizer
          if (componente._id == apontamentoDiarioPorFuncionario.funcionario._id){
            preencherBatidasTabela(apontamentoDiarioPorFuncionario, componente.PIS);
            //console.log('te m apontamento!');
            componente.apontamentoDiario = apontamentoDiarioPorFuncionario;
            //setPretty(componente);
            hasAppoint = true;
            return hasAppoint;
          }

        });

        if (!hasAppoint ) {
          //aí verificamos os casos possíveis (ENI, feriados, DSR, AUSENCIA)
          //console.log(componente.nome + 'NÃO tem apontamento!');
          componente.apontamentoDiario = {};
          preencherBatidasVazias(componente.apontamentoDiario);
        }

        isActive = isActiveWorker(componente);//verifica se ele está admitido nessa data
        if (isActive)
          setPretty(componente);
        else
          setDisabledWorker(componente);

      });
    };

    /*
     * Método que injeta no apontamento as informações que serão mostradas na tabela
     * Destaque maior para as informações de Status com a bullet que representa cada um
    */
    function setPretty(funcionario) {
    
      var expedienteObj = {};
      var funcionarioAlocacao = funcionario.alocacao;
      var turno = funcionarioAlocacao.turno;
      var escala = turno.escala;
      var apontamento = funcionario.apontamentoDiario;
      var saldoFlag = false;
      var sinalFlag = '-';
      var saldoDia = 0;//em minutos
      var saldoDiarioFormatado = {};
      var tolerancia = 10; //10 minutos, serve para verificar o somatório das batidas e comparar com ele

      //console.log("apontamento de " + funcionario.nome + ": ");
      //console.log(apontamento);

      //se tiver marcações/infoTrabalho - funcionário está presente
      if (apontamento.marcacoes || apontamento.infoTrabalho) {          
        
        expedienteObj = updatePresenceStatus(apontamento.infoTrabalho.trabalha, turno, apontamento); //true -> trabalha
        apontamento.statusCodeString = expedienteObj.code;
        apontamento.statusString = expedienteObj.string;
        apontamento.statusImgUrl = expedienteObj.imgUrl;
        saldoDia = calcularHorasTrabalhoRegraSoll(apontamento.infoTrabalho.trabalhados, apontamento.infoTrabalho.aTrabalhar, tolerancia);
        
        if (saldoDia >= 0){
          saldoFlag = true;
          sinalFlag = '';
        }

        saldoDiarioFormatado = converteParaHoraMinutoSeparados(Math.abs(saldoDia));

        apontamento.objBHDiario = {
          horasFtd: sinalFlag + saldoDiarioFormatado.hora + ':' + saldoDiarioFormatado.minuto,
          horasPosit: saldoFlag,
          horasNegat: !saldoFlag
        };
        
      } else {

        //pode não ter expediente iniciado, ser feriado, estar atrasado, de folga ou faltante mesmo
        expedienteObj = updateAbsenceStatus(funcionarioAlocacao);
        apontamento.statusCodeString = expedienteObj.code;
        apontamento.statusString = expedienteObj.string;
        apontamento.statusImgUrl = expedienteObj.imgUrl;
        //console.log('expedienteObj returned: ', expedienteObj);
        if (expedienteObj.code == "FRD"){
          saldoFlag = true;
          sinalFlag = '';
          saldoDiarioFormatado = converteParaHoraMinutoSeparados(Math.abs(expedienteObj.saldoDia));

        } else if (expedienteObj.code == "ENI") {

          saldoFlag = true;
          sinalFlag = '';
          saldoDiarioFormatado = {hora: '-', minuto: '-'};

        } else if (expedienteObj.code == "DSR") {

          saldoFlag = true;
          sinalFlag = '';
          saldoDiarioFormatado = {hora: '-', minuto: '-'};          

        } else if (expedienteObj.code == "AUS") {
          
          saldoDiarioFormatado = converteParaHoraMinutoSeparados(Math.abs(expedienteObj.saldoDia));
        }

        apontamento.objBHDiario = {
          horasFtd: sinalFlag + saldoDiarioFormatado.hora + ':' + saldoDiarioFormatado.minuto,
          horasPosit: saldoFlag,
          horasNegat: !saldoFlag
        };
      }

      //Atualiza o funcionario.apontamento.
      funcionario.apontamentoDiario = apontamento;
    };

    /*
    * A regra de tolerancia que Josias passou é a de 10 min , somando-se todos os registros
    * saldo entre -10 e 10 não devem sem considerados
    * se o saldo for além deste intervalo acima, então todos os minutos devem ser computados
    */
    function calcularHorasTrabalhoRegraSoll(trabalhadas, aTrabalhar, tolerancia) {

      var saldo = trabalhadas - aTrabalhar;
      if ( (saldo < -tolerancia) || (saldo > tolerancia) ) {

        return saldo;

      }

      return 0;
    };

    /*
     * Preenche as batidas através do array formatado que vem no Apontamento
    */

    function preencherBatidasTabela(apontamento, pis) {

      var entSaidas = ['ent1', 'sai1', 'ent2', 'sai2'];//só mostro as 4 primeiras nessa tabela
      var strMarcacoesHtml = '';
      //console.log('[antes] - apontamento marcacaoes ftd: ', apontamento.marcacoesFtd);
      apontamento.marcacoesFtd.sort(function(a, b){//ordena o array de marcaçõesFtd
        return a > b;
      });
      //console.log('[depois] - apontamento marcacaoes ftd: ', apontamento.marcacoesFtd);
      apontamento.marcacoesStringObj = {};
      apontamento.marcacoesType = {};
      apontamento.moreThanFour = false;

      for (var i = 0; i < apontamento.marcacoesFtd.length; i++) {
        apontamento.marcacoesStringObj[entSaidas[i]] = apontamento.marcacoesFtd[i];
        strMarcacoesHtml += apontamento.marcacoesFtd[i]+" | ";
      }

      if (strMarcacoesHtml.length > 1)
        strMarcacoesHtml = strMarcacoesHtml.substring(0, strMarcacoesHtml.length-2);

      for (var k=0; k < apontamento.marcacoes.length; k++) {
        if (!apontamento.marcacoes[k].REP && apontamento.marcacoes[k].RHWeb){
          apontamento.marcacoesType[apontamento.marcacoes[k].descricao] = true;
          // //console.log('apontamento WEB!', apontamento.marcacoes[k].descricao);
          // //console.log('apontamento WEB!', apontamento.marcacoes[k].strHorario);
        }
        else
          apontamento.marcacoesType[apontamento.marcacoes[k].descricao] = false;
      }

      if (apontamento.marcacoes.length > 4) {
        apontamento.moreThanFour = true;
        //precisa ser com o $SCOPE p/ o popover funcionar!
        //SE tiver mais de uma linha com mais de 4 batidas ele vai sempre pegar a do último!
        //Tem que ajeitar isso de alguma maneira!
        $scope.baloon = {htmlPopover: $sce.trustAsHtml('<b>'+strMarcacoesHtml+'</b>')};
        // apontamento.htmlPopover = $sce.trustAsHtml('<b>Teste</b> todo');
      }

      for (var j = apontamento.marcacoesFtd.length; j < entSaidas.length; j++){
        apontamento.marcacoesStringObj[entSaidas[j]] = '-';
      }
      //console.log('scope. baloon: ', $scope.baloon);
      // //console.log("apontamento após preencherTabela: ", apontamento);
    };

    /*
     * Preenche com um '-' o local das batidas na tabela.
    */
    function preencherBatidasVazias(apontamento) {

      var entSaidas = ['ent1', 'sai1', 'ent2', 'sai2'];//só mostro as 4 primeiras nessa tabela
      apontamento.marcacoesStringObj = {};
      for (var i = 0; i < entSaidas.length; i++) {
        apontamento.marcacoesStringObj[entSaidas[i]] = '-';
      }
    };

    /*
    ** Verifica se o colaborador já estava admitido na data passada por parâmetro.
    */
    function isActiveWorker(componente, dataP) {

      var dataAux = $scope.currentDate;
      if (dataP)
        dataAux = dataP;

      var result = compareOnlyDates(new Date(componente.alocacao.dataAdmissao), dataAux);
      if (result == -1 || result == 0) {
        return true;
      } else {
        return false;
      }
    };

    /*
    ** Seta as características para um funcionário desabilitado do banco de horas naquela data específica
    */
    function setDisabledWorker(componente) {

      var apontamento = componente.apontamentoDiario;
      apontamento.statusCodeString = "INE";
      apontamento.statusString = "Inelegível - Ainda não era admitido nesta data";
      apontamento.statusImgUrl = "assets/img/app/todo/bullet-pink.png";

    };

    /*
     *
     * O colaborador está presente, resta saber se ele chegou dentro da tolerância estabelecida
     * Também deve-se levar em consideração que há uma tolerância interna (10 minutos) de acordo com as regras passadas pelo RH da SOLL
     * trabalha -> informa se é dia de trabalho ou não 
     *
    */
    function updatePresenceStatus (trabalha, turno, apontamento) {

      //var tolerancia = turno.tolerancia ? turno.tolerancia : 0;
      var tolerancia = 10; //Usando tolerancia fixada pelo RH da SOLL (tolerancia para o somatório entre todas as batidas)
      var toleranciaBatida = 5; //Essa tolerancia é a estabelecida na CLT para as batidas isoladas.
      var madrugou = false; //flag que indica se o funcionário chegou antes do horário + toleranciaBatida estabelecidos. Ex.: deveria bater de 8h e bateu de 7:53.
      var atrasou = false; //similar a anterior só que indica que ele chegou depois do horário estabelecido naquele registro.
      var minutosMarcacao;
      var diaComparacao = {};
      var today = $scope.currentDate.getDay(); //dia (número) atual
      var jornadaArray = turno.jornada.array; //array da jornada desse funcionário

      if (trabalha){ //se é dia de trabalho normal - presença normal
        if (turno.escala.codigo == 1) {
          diaComparacao = getDayInArrayJornadaSemanal(today, jornadaArray);
        } else if (turno.escala.codigo == 2) {
          if (jornadaArray.length > 0)
            diaComparacao = jornadaArray[0];
        }

        //console.log('dia comparação: ', diaComparacao);

        var marcacao;
        var minutosComparacao;
        for (var i=0; i<apontamento.marcacoes.length; i++){

          marcacao = apontamento.marcacoes[i];
          minutosMarcacao = (marcacao.hora * 60) + marcacao.minuto;
          //console.log('minutos marcação: ', minutosMarcacao);      
          //console.log('marcacao.descricao: ', marcacao.descricao);
          // //console.log('dia comparacao access object: ', diaComparacao.horarios["ent1"]);
          minutosComparacao = diaComparacao.horarios[marcacao.descricao];
          //console.log('minutosComparacao: ', minutosComparacao);
          //console.log('tolerancia ', tolerancia);
          if (minutosMarcacao < (minutosComparacao - toleranciaBatida)){
            //chegou mto cedo
            madrugou = true;
          } 
          if (minutosMarcacao > (minutosComparacao + toleranciaBatida)) {
            atrasou = true;
          }
        }

        if(!atrasou && !madrugou){
          //console.log("Está dentro dos limites tolerados no horário rígido!");
          return {code: "PRE", string: "Presente", imgUrl: "assets/img/app/todo/bullet-green.png"};
        } else if (atrasou){
          //console.log("Está fora dos limites - bateu atrasado!");
          return {code: "ATR", string: "Presente com observação (alguma batida ultrapassou o limite de tolerância estabelecida)", imgUrl: "assets/img/app/todo/bullet-green2.png"};
        } else if (madrugou) {
          return {code: "ATR", string: "Presente com observação (em alguma batida o funcionário entrou mais cedo que a tolerância estabelecida)", imgUrl: "assets/img/app/todo/bullet-green2.png"};        
        }

      } else { //não é dia de trabalho, mas esteve presente

        return {code: "EXT", string: "Presente extraordinariamente", imgUrl: "assets/img/app/todo/bullet-black.png"};
      }
    };

    /*
     * São 5 possíveis casos para ausência:
     * 1- Feriado
     * 2- ENI - Expediente Não Iniciado
     * 3- Folga solicitada e aceita / Licença
     * 4- DSR - Descanso Semanal Remunerado 
     * 5- Ausência de fato
    */
    function updateAbsenceStatus(funcionarioAlocacao, dataDesejada) {
      
      var codigoEscala = funcionarioAlocacao.turno.escala.codigo; 
      var ignoraFeriados =  funcionarioAlocacao.turno.ignoraFeriados;

      if (isFeriado(dataDesejada) && !ignoraFeriados){//Caso 1 - feriado
        
        return {code: "FRD", string: "Feriado!", imgUrl: "assets/img/app/todo/bullet-emoji.png", saldoDia: 0};//getSaldoDiaFrd(funcionarioAlocacao)};

      } else if (hasFolgaSolicitada() || hasLicenca()){ //Caso 3 - Folgas/Licenças

        //console.log('Caso 3 - checar');

      } else { //Caso 2, 4 ou 5
        
        if (codigoEscala == 1) {
          return checkJornadaSemanal(funcionarioAlocacao, dataDesejada);
        }

        else if (codigoEscala == 2)
          return checkJornadaRevezamento(funcionarioAlocacao, dataDesejada);
      }
    };

    //Saldo do feriado, essas horas são normalmente abonadas para o funcionário
    function getSaldoDiaFrd(funcionarioAlocacao) {

      var jornada = funcionarioAlocacao.turno.jornada;

      if (funcionarioAlocacao.turno.escala.codigo == 1) {

        var today = $scope.currentDate.getDay();
        var objDay = getDayInArrayJornadaSemanal(today, jornada.array);
        return objDay.minutosTrabalho;

      } else if (funcionarioAlocacao.turno.escala.codigo == 2) {

        return jornada.minutosTrabalho;
      }

      return {};
    };

    function hasFolgaSolicitada() {

    };

    function hasLicenca() {

    };

    function checkJornadaSemanal(funcionarioAlocacao, dataDesejada) {

      var dataAtual = $scope.currentDate;//dia da semana correspondente à navegação do usuário (numérico 0 (dom) - 6 (sáb))
      if (dataDesejada)
        dataAtual = dataDesejada;

      //console.log('hasDataDesejada? ', dataDesejada);

      var jornadaArray = funcionarioAlocacao.turno.jornada.array; //para ambas as escalas
      //console.log('Dentro de Jornada Semanal: funcionarioAlocacao', funcionarioAlocacao);
      var objDay = getDayInArrayJornadaSemanal(dataAtual.getDay(), jornadaArray);
      //console.log('objDay', objDay);
      
      if (!objDay || !objDay.minutosTrabalho || objDay.minutosTrabalho <= 0) { //Caso 4 - DSR
        
        return {code: "DSR", string: "Descanso Semanal Remunerado", imgUrl: "assets/img/app/todo/bullet-grey.png"};

      } else { //Chegando aqui, só pode ser ENI ou Ausente de fato

        var codDate = compareOnlyDates(dataAtual, dataHoje);

        if (codDate === 0) { //é o próprio dia de hoje
          //console.log("Olhando para o dia de hoje! Pode estar Ausente ou ENI");
          //HORA ATUAL é menor que ENT1 ? caso sim, sua jornada ainda não começou
          var totalMinutesAtual = converteParaMinutosTotais(dataHoje.getHours(), 
          dataHoje.getMinutes());
          var ENT1 = objDay.horarios.ent1;
          //console.log("Total de minutos da hora atual: ", totalMinutesAtual);
          //console.log("Entrada 1: ", ENT1);

          if (totalMinutesAtual < ENT1) {
          
            //console.log("Ainda não iniciou o expediente");
            return {code: "ENI", string: "Expediente Não Iniciado", imgUrl: "assets/img/app/todo/bullet-blue.png"};

          } else {
            //console.log("Já passou o tempo da batida dele , então está ausente, ainda não bateu!");
            return {code: "AUS", string: "Ausente", imgUrl: "assets/img/app/todo/bullet-red.png", saldoDia: objDay.minutosTrabalho};
          }

        } else if (codDate === -1) {//Navegando em dia passado 

          //console.log("Navegando em dias anteriores e sem valor de apontamento, ou seja, faltante");
          return {code: "AUS", string: "Ausente", imgUrl: "assets/img/app/todo/bullet-red.png", saldoDia: objDay.minutosTrabalho};

        } else { //Navegando em dias futuros

          //console.log("Navegando em dias futuros, expediente não iniciado!");
          return {code: "ENI", string: "Expediente Não Iniciado", imgUrl: "assets/img/app/todo/bullet-blue.png"};
        }
      } 
    };

    /*
     * Na Jornada 12x36h não adianta pegar os minutosTrabalho feito na semanal, pois temos que checar se o dia é de trabalho ou folga
     * ELes trabalham dia sim / dia não na prática, temos que saber se esse é o dia SIM ou NÃO...
    */
    function checkJornadaRevezamento(funcionarioAlocacao, dataDesejada) {

      var jornadaArray = funcionarioAlocacao.turno.jornada.array;
      var dataComparacao = $scope.currentDate;
      if (dataDesejada)
        dataComparacao = dataDesejada;

      //console.log('dataComparacao: ', dataComparacao);
      var trabalha = isWorkingDay(dataComparacao, 
        new Date(funcionarioAlocacao.dataInicioEfetivo));
      
      if (trabalha && jornadaArray.length > 0) { //ele deveria ter trabalhado, ou é ENI ou AUSENCIA

        var ENT1 = jornadaArray[0].horarios.ent1;
        var codDate = compareOnlyDates(dataComparacao, dataHoje);

        if (codDate === 0) { //é o próprio dia de hoje
          //console.log("Olhando para o dia de hoje! Pode estar Ausente ou ENI");
          //HORA ATUAL é menor que ENT1 ? caso sim, sua jornada ainda não começou
          var totalMinutesAtual = converteParaMinutosTotais(dataHoje.getHours(), 
          dataHoje.getMinutes());
          //console.log("Total de minutos da hora atual: ", totalMinutesAtual);

          if (totalMinutesAtual < ENT1) {
          
            //console.log("Ainda não iniciou o expediente");
            return {code: "ENI", string: "Expediente Não Iniciado", imgUrl: "assets/img/app/todo/bullet-blue.png"};

          } else {
            //console.log("Já passou o tempo da batida dele , então está ausente, ainda não bateu!");
            return {code: "AUS", string: "Ausente", imgUrl: "assets/img/app/todo/bullet-red.png", saldoDia: funcionarioAlocacao.turno.jornada.minutosTrabalho};
          }
        } else if (codDate === -1) {//Navegando em dia passado 

          //console.log("Navegando em dias anteriores e sem valor de apontamento, ou seja, faltante");
          return {code: "AUS", string: "Ausente", imgUrl: "assets/img/app/todo/bullet-red.png", saldoDia: funcionarioAlocacao.turno.jornada.minutosTrabalho};
        } else { //Navegando em dias futuros

          //console.log("Navegando em dias futuros, expediente não iniciado!");
          return {code: "ENI", string: "Expediente Não Iniciado", imgUrl: "assets/img/app/todo/bullet-blue.png"};
        }

      } else {

        return {code: "DSR", string: "Descanso Semanal Remunerado", imgUrl: "assets/img/app/todo/bullet-grey.png"}; 
      }
    };

    function getDayInArrayJornadaSemanal(dayToCompare, arrayJornadaSemanal) {
      
      var diaRetorno = {};
      arrayJornadaSemanal.forEach(function(objJornadaSemanal){
        if(dayToCompare == objJornadaSemanal.dia){
          diaRetorno = objJornadaSemanal;
          return diaRetorno;
        }
      });
      //console.log("DIA RETORNO NO getDayInArrayJornadaSemanal: ", diaRetorno);
      return diaRetorno;
    };

    //12x36h
    function getDayInJornadaDiferenciada(dateToCompare, dataInicioEfetivo) {
      
      return {
        isWorkingDay: isWorkingDay(dateToCompare, dataInicioEfetivo)      
      };
    };

    //Método auxiliar para identificar se é dia de trabalho na escala de revezamento
    function isWorkingDay(dateToCompare, dataInicioEfetivo) {

      var oneDay = 24*60*60*1000; // hours*minutes*seconds*milliseconds
      
      var d1 = angular.copy(dateToCompare); 
      var d2 = angular.copy(dataInicioEfetivo);
      d1.setHours(0,0,0,0);
      d2.setHours(0,0,0,0);

      var diffDays = Math.round(Math.abs((d1.getTime() - d2.getTime())/(oneDay)));
      //console.log("diffDays: ", diffDays);
      
      return (diffDays % 2 == 0) ? true : false;
    };

    function converteParaHorasTotais(totalMinutos) {
      return (totalMinutos/60);
    };

    function converteParaMinutosTotais(hours, mins) {
      return (hours * 60) + mins;
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

    function createStringMarcacoes(apontamento) {

      var marcacaoStringObj = {};
      //console.log('craindo marcações string!');

      apontamento.marcacoes.forEach(function(objMarcacao){
        if (objMarcacao.descricao == "ent1")
          marcacaoStringObj.ent1 = converteParaMarcacaoString(objMarcacao.hora, objMarcacao.minuto, ":");
        else if (objMarcacao.descricao == "sai1")
          marcacaoStringObj.sai1 = converteParaMarcacaoString(objMarcacao.hora, objMarcacao.minuto, ":");
        else if (objMarcacao.descricao == "ent2")
          marcacaoStringObj.ent2 = converteParaMarcacaoString(objMarcacao.hora, objMarcacao.minuto, ":");
        else if (objMarcacao.descricao == "sai2")
          marcacaoStringObj.sai2 = converteParaMarcacaoString(objMarcacao.hora, objMarcacao.minuto, ":");
      });
      //console.log('retornando marcações string: ', marcacaoStringObj);
      return marcacaoStringObj;
    };

    function calcularMarcacoesAusente(horariosObj) {

      if (horariosObj.ent1 && horariosObj.sai1 && horariosObj.ent2 && horariosObj.sai2){//full

        return (horariosObj.sai2 - horariosObj.ent2) + (horariosObj.sai1 - horariosObj.ent1);

      } else if (horariosObj.ent1 && horariosObj.sai1){ //parcial

        return (horariosObj.sai1 - horariosObj.ent1);
      }
    };

    function calcularMarcacoes(apontamento) {

      var ent1 = 0;
      var sai1 = 0;
      var ent2 = 0;
      var sai2 = 0;

      var size = apontamento.marcacoes.length;

      if (size % 2 == 0){ //se estive em número par, dá pra calcular, se não, será taxada de incorreta

        apontamento.marcacoes.forEach(function(objMarcacao){
          if (objMarcacao.descricao == "ent1")
            ent1 = (objMarcacao.hora * 60) + objMarcacao.minuto;
          else if (objMarcacao.descricao == "sai1")
            sai1 = (objMarcacao.hora * 60) + objMarcacao.minuto;
          else if (objMarcacao.descricao == "ent2")
            ent2 = (objMarcacao.hora * 60) + objMarcacao.minuto;
          else if (objMarcacao.descricao == "sai2")
            sai2 = (objMarcacao.hora * 60) + objMarcacao.minuto;
        });

        return (sai2 - ent2) + (sai1 - ent1);
        
      } else {

        return null;
      }
    };  

    function getBancoHorasDiarioFtd(qtdMinutosTrabalhados) {

      //console.log("###FTD - qtdMinutosTrabalhados: ", qtdMinutosTrabalhados);

      var flagPosit, flagNegat = false;
      
      if (qtdMinutosTrabalhados > 0) 
        flagPosit = true;
      else if (qtdMinutosTrabalhados < 0)
        flagNegat = true;

      var horasFormat = converteParaHoraMinutoSeparados(Math.abs(qtdMinutosTrabalhados));

      return {
        horasPosit: flagPosit,
        horasNegat: flagNegat,
        horasFtd: horasFormat.hora + ":" + horasFormat.minuto
      };

    };

    function converteParaMarcacaoString(hours, minutes, separator) {

      var hoursStr = "";
      var minutesStr = "";

      hoursStr = (hours >= 0 && hours <= 9) ? "0"+hours : ""+hours;           
      minutesStr = (minutes >= 0 && minutes <= 9) ? "0"+minutes : ""+minutes;

      return (separator) ? hoursStr+separator+minutesStr : hoursStr+minutesStr;
    };

    function isFeriado(dataDesejada) {
      
      var data = $scope.currentDate;

      if (dataDesejada)
        data = dataDesejada;

      console.log('Data Desejada: ', data);
      //console.log('Setor.local: ', $scope.equipe);

      var date = data.getDate();//1 a 31
      var month = data.getMonth();//0 a 11
      var year = data.getFullYear();//
      var flagFeriado = false;
      var tempDate;      

      $scope.feriados.forEach(function(feriado){
        
        //console.log('feriado atual: ', feriado);        

        for (var i = 0; i < feriado.array.length; i++) {
          
          tempDate = new Date(feriado.array[i]);
          if (feriado.fixo){
          
            if (tempDate.getMonth() === month && tempDate.getDate() === date){
              console.log("É Feriado (fixo)!", tempDate);
              flagFeriado = checkFeriadoSchema(feriado);
              return feriado;
            }

          } else {//se não é fixo

            if ( (tempDate.getFullYear() === year) && (tempDate.getMonth() === month) && (tempDate.getDate() === date) ){
              console.log("É Feriado (variável)!", tempDate);
              flagFeriado = checkFeriadoSchema(feriado);
              return feriado;
            }
          }
        }
      });
      console.log('FlagFeriado: ', flagFeriado);
      return flagFeriado;//no futuro retornar o flag de Feriado e a descrição do mesmo!
    };

    function checkFeriadoSchema(feriado){

      var abrangencias = ["Nacional", "Estadual", "Municipal"];
      var flagFeriado = false;

      if (feriado.abrangencia == abrangencias[0]){

        console.log('Feriado Nacional!');
        flagFeriado = true;

      } else  if (feriado.abrangencia == abrangencias[1]){
        
        console.log('Feriado Estadual!');
        if ($scope.equipe.setor.local.estado == feriado.local.estado._id){
          console.log('Feriado Estadual no Estado correto!');
          flagFeriado = true;
        }

      } else if (feriado.abrangencia == abrangencias[2]){
        
        console.log('Feriado Municipal!');
        if ($scope.equipe.setor.local.municipio == feriado.local.municipio._id){
          console.log('No municipio correto!');
          flagFeriado = true;
        }
      }

      return flagFeriado;
    };

    function sortArrayJornadaAsc(componente) {

      if (componente.alocacao.turno)
        if (componente.alocacao.turno.jornada)
          if (componente.alocacao.turno.jornada.array)
            if (componente.alocacao.turno.jornada.array.length > 0) {
              var arrayJornada = componente.alocacao.turno.jornada.array;
              if (arrayJornada.length > 1){
                arrayJornada.sort(function (a, b) {
                  if (a.dia > b.dia) {
                    return 1;
                  }
                  if (a.dia < b.dia) {
                    return -1;
                  }
                  // a must be equal to b
                  return 0;
                });
              }
            }
    };

    function compareOnlyDates(date1, date2) {

      //como a passagem é por referência, devemos criar uma cópia do objeto
      var d1 = angular.copy(date1); 
      var d2 = angular.copy(date2);
      //console.log('date1', d1);
      //console.log('date2', d2);
      d1.setHours(0,0,0,0);
      d2.setHours(0,0,0,0);

      //console.log('date1 time', d1.getTime());
      //console.log('date2 time', d2.getTime());

      if (d1.getTime() < d2.getTime())
        return -1;
      else if (d1.getTime() === d2.getTime())
        return 0;
      else
        return 1; 
    };

    function addOrSubtractDays(date, value) {
          
      date = angular.copy(date);
      date.setHours(0,0,0,0);

      return new Date(date.getTime() + (value*864e5));
    }


    function getApontamentosFromSpecificDate(apontamentosSemanais, dataAtual){

      var apontamentosEquipeByDate = [];

      for (var i=0; i<apontamentosSemanais.length; i++){

        if (compareOnlyDates(dataAtual, new Date(apontamentosSemanais[i].data)) == 0) {

          apontamentosEquipeByDate.push(apontamentosSemanais[i]);
        }
      }

      return apontamentosEquipeByDate;
      // j = 0;
      //   while( apontamentosSemanais[j] && (compareOnlyDates(dataAtualLaco, new Date(apontamentosSemanais[j].data)) == 0)){//enquanto for a mesma

      //     //console.log("apontamento pego: ", apontamentosSemanais[j]); 
      //     j++;
      //   }
      //   //qtde 'j' indica numero de funcionários com apontamentos nessa data...
    };
    
    /*
    ** Constrói os dados do gráfico de barras em formato semanal
    ** Categoria (eixo X): semana anterior a data de hoje (dataHoje) ex.: hoje é quarta, 20/05/2017, traz de 13 a 19 (qua até ter)
    ** Eixo Y é o valor de saldo de horas da equipe nesse dia
    */
    function buildWeeklyBarChartData (dataInicial, intervaloDias, apontamentosSemanais) {

      var chartData = [];
      var itemChartData = {
        //order: 0, //para ordenar , se precisar
        //axisX: '',//categoria
        //value: 0, //minutos trabalhados reais
        //ideal: 0, //minutos trabalhados ideais para esse dia
        //color: 'red' //depende do value, se >0 fica verde, se não vermelha
      };

      var dataAtualLaco = dataInicial;
      var saldosCalculados = {};
      var searchedElements = [];
      //console.log('dataInicial ', dataInicial);
      //console.log('intervaloDias ', intervaloDias);

      for (var i=0; i<intervaloDias; i++){ //passar em cada dia do intervalo e preencher o item do gráfico

        //console.log('id', i);
        //console.log('data atual', dataAtualLaco);
        //console.log('dia da semana', weekDays[dataAtualLaco.getDay()]);
        itemChartData.axisX = dataAtualLaco.getDate() + "(" + weekDays[dataAtualLaco.getDay()] + ")";
        //traz os apontamentos disponíveis neste dia
        searchedElements = getApontamentosFromSpecificDate(apontamentosSemanais, dataAtualLaco);
        //console.log("elementos recuperados deste dia: ", searchedElements);
        
        var saldosCalculados = calcularSaldos(searchedElements, dataAtualLaco);
        itemChartData.value = saldosCalculados.saldoTrabalhado;
        itemChartData.aTrabalhar = saldosCalculados.aTrabalhar;

        if (itemChartData.value && (itemChartData.value >= 0))
          itemChartData.color = layoutColors.primary;
        else
          itemChartData.color = layoutColors.danger;

        //console.log('objeto: ', itemChartData);
        chartData.push(itemChartData);
        dataAtualLaco = addOrSubtractDays(dataAtualLaco, 1);
        itemChartData = {};
      }
      return chartData;
    };

    /*
    ** Constrói os dados do gráfico de linhas - absenteísmo
    ** O Absenteísmo é um indicativo referente aos atrasos, faltas e saídas antecipadas dos funcionários, 
    ** durante seu horário de trabalho. Estas faltas podem ser justificadas, injustificadas ou justificáveis, 
    ** demonstrando o comportamento dos funcionários e possíveis reduções na carga-horária de trabalho. 
    ** Categoria (eixo X): são os meses do ano corrente até o mês atual
    ** Eixo Y é o valor de horas "desperdiçadas" com ausências/faltas/atestados
    */
    function buildLineChartData(dataInicial, intervaloDias, apontamentosSemanais){

      //console.log("construir dados do gráfico de absenteísmo");
    };

    function calcularSaldos(searchedElements, dataDesejada) {
      
      //console.log('teste de cálculo dos saldos!');
      var hasAppoint = false;
      var isActive = false;
      var expedienteObj = null;
      var aTrabalhar = 0;
      var saldoDiaTrab = 0;
      var retorno = {};
      
      $scope.equipe.componentes.forEach(function (componente){
          
        sortArrayJornadaAsc(componente);
        //console.log('componente: ', componente.nome);
        hasAppoint = false;
        isActive = isActiveWorker(componente, dataDesejada);
        
        if (isActive) {
          searchedElements.forEach(function(apontamentoDiario){

            if (componente._id == apontamentoDiario.funcionario._id){
              //console.log(' TEM APONTAMENTO!!');
              saldoDiaTrab += calcularHorasTrabalhoRegraSoll(apontamentoDiario.infoTrabalho.trabalhados, apontamentoDiario.infoTrabalho.aTrabalhar, 10);
              aTrabalhar += apontamentoDiario.infoTrabalho.aTrabalhar;
              hasAppoint = true;
              return hasAppoint;
            }
          });
        

          if (!hasAppoint) {
            //console.log(' Não Tem Apontamento!');
            expedienteObj = calcularSaldoSemApontamento(componente.alocacao, dataDesejada);
            //console.log('objeto sem apontamento calculado: ', expedienteObj);
            if (expedienteObj.saldoDia) {
              if (expedienteObj.code == "FRD"){ //feriado as horas contam como trabalho
                saldoDiaTrab += expedienteObj.saldoDia;
                aTrabalhar += Math.abs(expedienteObj.saldoDia);
              } else if (expedienteObj.code == "AUS"){//ausência não!
                saldoDiaTrab -= expedienteObj.saldoDia;
                aTrabalhar += Math.abs(expedienteObj.saldoDia);
              }
            }
          }
        } else { //usuário não ativo...

          //console.log('componente ' + componente.nome + ' não estava admitido em ' + dataDesejada);
        }
        //console.log('Saldo ideal até o momento: ', aTrabalhar);
        //console.log('Saldo trabalhado até o momento: ', saldoDiaTrab);
      });

      retorno = {
        aTrabalhar: aTrabalhar,
        saldoTrabalhado: saldoDiaTrab
      };

      return retorno;
    };

    /*
    ** Na ausência, só possui saldoDiário se for uma falta ou feriado
    ** Não dá para calcular saldo em DSR. ou ENI
    ** Lembrar de calcular também para FOLGAS/LICENÇAS qnd implementar
    */
    function calcularSaldoSemApontamento(funcionarioAlocacao, dataDesejada){

      var expedienteObj = updateAbsenceStatus(funcionarioAlocacao, dataDesejada);
      //console.log('expedienteObj returned: ', expedienteObj);
      
      //if (expedienteObj.code == "FRD" || expedienteObj.code == "AUS"){      
      return expedienteObj;
      //} 

      return null;
    };

    /*
    * Inicializando algumas variáveis básicas e obtendo as equipes do Gestor em questão.
    */
    function init(){
    
      $scope.currentWeek = {//fica variando a medida que o usuario navega
        begin: addOrSubtractDays($scope.currentDate, -7),
        end: addOrSubtractDays($scope.currentDate, -1)
      };
      $scope.currentWeekFtd = {
        begin: $filter('date')($scope.currentWeek.begin, 'abvFullDate1'),
        end: $filter('date')($scope.currentWeek.end, 'abvFullDate1')
      };

      $scope.btnBarChartArray = [
        {
          selecionado: true,
          value: 7
        },
        {
          selecionado: false,
          value: 15
        },
        {
          selecionado: false,
          value: 30
        }
      ]; 

      $scope.btnLineChartArray = [
        {
          selecionado: true,
          value: 7
        },
        {
          selecionado: false,
          value: 15
        },
        {
          selecionado: false,
          value: 30
        }
      ]; 

      //updateBarGraph();
      if ($scope.gestor) {
        if ($scope.gestor.alocacao.gestor) {//se realmente for um gestor
          $scope.liberado = true;
          //carregar equipes do gestor
          getEquipesByGestor();

        } else {
          $scope.errorMsg = "Este funcionário não é Gestor e portanto não pode visualizar estas informações";
        }
      } else {
          if ($scope.usuario.perfil.accessLevel >= 4) {
            //é um admin vendo a página, pode liberar
            $scope.isAdmin = true;
            $scope.liberado =true;
          }
      }
    };

    init();

  }
})();