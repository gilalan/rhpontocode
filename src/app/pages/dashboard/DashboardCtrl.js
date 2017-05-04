/**
 * @author Gilliard Lopes
 * created on 25/04/2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.dashboard')
      .controller('DashboardCtrl', DashboardCtrl);

  /** @ngInject */
  function DashboardCtrl($scope, $filter, setores, usuario, feriados, currentDate, teamAPI, appointmentAPI, baConfig, dashboardDataFactory) {
    
    console.log('setore resolve: ', setores);
    console.log('dashboardFactory from controller', dashboardDataFactory);
    
    var layoutColors = baConfig.colors;
    var graphColor = baConfig.theme.blur ? '#000000' : layoutColors.primary;

    var chartData = [
    {
        country: 'USA',
        visits: 50,
        color: layoutColors.primary
      },
      {
        country: 'China',
        visits: 31,
        color: layoutColors.danger

      },
      {
        country: 'Japan',
        visits: 18,
        color: layoutColors.info
      },
      {
        country: 'Germany',
        visits: -5,
        color: layoutColors.success
      },
      {
        country: 'UK',
        visits: -11,
        color: layoutColors.warning
      },
      {
        country: 'France',
        visits: 0,
        color: layoutColors.primaryLight
      }
    ];

    dashboardDataFactory.setData(chartData);

    $scope.setores = setores.data;
    $scope.usuario = usuario.data;
    $scope.feriados = feriados.data;
    console.log('USUÁRIO: ', $scope.usuario);
    $scope.currdate = currentDate.data;//passado pelo atributo html
    $scope.currentDate = new Date(currentDate.data.date);//usado aqui - fica variando a medida que o usuario navega
    $scope.currentDateFtd = $filter('date')($scope.currentDate, 'abvFullDate');
    $scope.gestor = $scope.usuario.funcionario;
    console.log('GESTOR: ', $scope.gestor);
    $scope.liberado = false;
    
    //Inicializadas no init
    $scope.currentWeek = {};
    $scope.currentWeekFtd = {};

    var weekDays = ["Dom","Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    var objMapDataLabel = {0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6};
    var dataHoje = new Date(currentDate.data.date);//data de hoje mesmo para comparações com as datas que ele vai navegando
    var firstRun = true;
    
    /*
     *
     * Navegação nos dias dos registros diários
     *
    **/    
    $scope.subtractOneDay = function () {

      $scope.currentDate.setDate($scope.currentDate.getDate() - 1);
      $scope.currentDateFtd = $filter('date')($scope.currentDate, 'abvFullDate');

      console.log("current date: ", $scope.currentDate);
      getApontamentosByDateRangeAndEquipe(addOrSubtractDays($scope.currentDate, 0), 1, $scope.equipe.componentes, true);//pegando o diário
    }

    $scope.addOneDay = function () {

      $scope.currentDate.setDate($scope.currentDate.getDate() + 1);
      $scope.currentDateFtd = $filter('date')($scope.currentDate, 'abvFullDate');

      console.log("current date: ", $scope.currentDate);
      getApontamentosByDateRangeAndEquipe(addOrSubtractDays($scope.currentDate, 0), 1, $scope.equipe.componentes, true);//pegando o diário
    }

    $scope.subtractOneWeek = function () {
      
      var currentBegin = new Date($scope.currentWeek.begin);
      var novoBegin = new Date(addOrSubtractDays(currentBegin, -7));
      var novoEnd = new Date(addOrSubtractDays(currentBegin, -1));
      //////console.log("currentBegin? ", currentBegin);
      //////console.log("Novo Begin? ", novoBegin);
      //////console.log("Novo End? ", novoEnd);

      $scope.currentWeek = {//fica variando a medida que o usuario navega
        begin: novoBegin,
        end: novoEnd
      };

      $scope.currentWeekFtd = {
        begin: $filter('date')($scope.currentWeek.begin, 'abvFullDate1'),
        end: $filter('date')($scope.currentWeek.end, 'abvFullDate1')
      };

      getApontamentosByDateRangeAndEquipe($scope.currentWeek.begin, 8, $scope.equipe.componentes, false);//pegando semanal
    }

    $scope.addOneWeek = function () {
      
      var currentEnd = new Date($scope.currentWeek.end);
      var novoBegin = new Date(addOrSubtractDays(currentEnd, 1));
      var novoEnd = new Date(addOrSubtractDays(currentEnd, 7));
      //////console.log("currentEnd? ", currentEnd);
      //////console.log("Novo Begin? ", novoBegin);
      //////console.log("Novo End? ", novoEnd);

      $scope.currentWeek = {//fica variando a medida que o usuario navega
        begin: novoBegin,
        end: novoEnd
      };

      $scope.currentWeekFtd = {
        begin: $filter('date')($scope.currentWeek.begin, 'abvFullDate1'),
        end: $filter('date')($scope.currentWeek.end, 'abvFullDate1')
      };

      getApontamentosByDateRangeAndEquipe($scope.currentWeek.begin, 8, $scope.equipe.componentes, false);//pegando semanal    
    }

    /*
     *
     * Escolha das equipes força uma nova solicitação ao servidor e carrega tudo novamente no showIndicators()
     *
    **/
    $scope.checkUncheckEquipe = function(equipe) {

      console.log("clicked equipe: ", equipe.nome);
      //Não pode simplesmente deselecionar uma equipe, ele tem q manter 1 ativa sempre
      if (!equipe.selecionada) {
        
        equipe.selecionada = !equipe.selecionada;
        $scope.equipes.forEach(function(otherEquipe){
          if(otherEquipe._id != equipe._id)
            otherEquipe.selecionada = false;
        });

        showIndicators(equipe);
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
            $scope.equipes[0].selecionada = true;
            showIndicators($scope.equipes[0]);
          } 
        } 

        //console.log('Equipes do gestor: ', response.data);

      }, 
      function errorCallback(response){
        $errorMsg = response.data.message;
        //////console.log("houve um erro ao carregar as equipes do gestor");
      });
    };

    /*
     *
     * Carrega a tela de acordo com a equipe escolhida/chamado só quando varia a equipe/início da tela
     * Solicita ao servidor um objeto com os apontamentos dos componentes da equipe
     *
    **/
    function showIndicators(equipe) {

      $scope.equipe = equipe;
      
      if (!equipe.componentes){

        $scope.equipe.componentes = [];

      } else {

        //pegando o semanal (passa 8 mas traz 7, não inclui a última data)
        //Se quiser o do dia, basta passar 1.
        getApontamentosByDateRangeAndEquipe($scope.currentWeek.begin, 8, $scope.equipe.componentes, true);
      }
    };

    /*
     *
     * Solicita ao servidor um objeto com os apontamentos dos componentes da equipe
     *
    **/
    function getApontamentosByDateRangeAndEquipe(beginDate, intervaloDias, componentes, updateDiario) {

      var objDateEquipe = {
        date: beginDate, 
        dias: intervaloDias, 
        equipe: componentes
      };

      //Se for a primeira execução deste método traz um semanal para servir tanto pra tabela quanto pro gráfico
      if (firstRun) {   

        console.log("Objeto Date Equipe Enviado: ", objDateEquipe);

        appointmentAPI.getApontamentosByDateRangeAndEquipe(objDateEquipe).then(function successCallback(response){

          var apontamentosSemanais = response.data; //serve para o gráfico
          console.log("#$%@$#@%#$@#%$@%#$@ Apontamentos Semanais: ", apontamentosSemanais);
          var apontamentosDiarios = getOnlyApontDiarios(apontamentosSemanais); //serve para a tabela
          
          createPrettyStringResults(apontamentosDiarios);
          //buildGraphBar(apontamentosSemanais); //TEM QUE DESCOMENTAR QQ COISA SOBRE O GRAFICO
          
          var chartData = buildArrayDataBarGraph(beginDate, intervaloDias, apontamentosSemanais);
          console.log('chartData após chaamar o gráfico: ', chartData);

          console.log("#$!#$$$$$$$$ APONTAMENTOS DIARIOS ", apontamentosDiarios);
          firstRun = false;
          
        }, function errorCallback(response){
          
          $errorMsg = response.data.message;
          //////console.log("Erro ao obter apontamentos por um range de data e equipe");

        });

      } else {

        console.log("Objeto Date Equipe Enviado: ", objDateEquipe);

        appointmentAPI.getApontamentosByDateRangeAndEquipe(objDateEquipe).then(function successCallback(response){

          var apontamentosResponse = response.data;
          console.log("!@# Apontamentos Semanais: ", apontamentosResponse);

          if (updateDiario) {
            
            var apontamentosDiarios = getOnlyApontDiarios(apontamentosResponse); //serve para a tabela  
            createPrettyStringResults(apontamentosDiarios);
            console.log(" APONTAMENTOS DIARIOS ", apontamentosDiarios);

          } else {

            //buildGraphBar(apontamentosResponse); ////TEM QUE DESCOMENTAR QQ COISA SOBRE O GRAFICO
            var chartData = buildArrayDataBarGraph(beginDate, intervaloDias, apontamentosResponse);
            console.log('chart data após chamar o gŕafico: ', chartData);

            console.log("#$!@!$@!$!@$@! TESTE !@#!%!@%!%% apontamentos SEMANAIS: ", response.data);
          }

        }, function errorCallback(response){
          
          $errorMsg = response.data.message;
          //////console.log("Erro ao obter apontamentos por um range de data e equipe");

        });
      }
    };

    /*
    * Essa função obtém apenas os apontamentos de currentDate, dentro de um objeto semanal
    */
    function getOnlyApontDiarios(apontamentosSemanais) {

      return apontamentosSemanais.filter(function(apontamento){
        //////console.log("apontamento.data: ", new Date(apontamento.data));
        //////console.log("currentDate: ", $scope.currentDate);
        //////console.log("são iguais? ", compareOnlyDates(new Date(apontamento.data), $scope.currentDate))
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
      console.log('apontamentos diários por funcionário! ', apontamentoDiariosPorFuncionario);

      $scope.equipe.componentes.forEach(function(componente){//vai criar as informações para cada componentes, mesmo que ele não tenha apontamento
        
        hasAppoint = false;
        sortArrayJornadaAsc(componente);
        console.log('componente: ', componente.nome);

        apontamentoDiariosPorFuncionario.forEach(function(apontamentoDiarioPorFuncionario){
          
          preencherBatidasTabela(apontamentoDiarioPorFuncionario);

          if (componente._id == apontamentoDiarioPorFuncionario.funcionario._id){
            console.log('te m apontamento!');
            componente.apontamentoDiario = apontamentoDiarioPorFuncionario;
            setPretty(componente);
            hasAppoint = true;
            return hasAppoint;
          }

        });

        if (!hasAppoint) {
          //aí verificamos os casos possíveis (ENI, feriados, DSR, AUSENCIA)
          //////console.log("################Desve estar caindo aqui , sem apontamento...")
          console.log(componente.nome + 'NÃO tem apontamento!');
          componente.apontamentoDiario = {};
          preencherBatidasVazias(componente.apontamentoDiario);
          setPretty(componente);
          //////console.log("componente modificado: ", componente);
        }

        createSeriesGraphic(componente.apontamentoDiario);

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

      console.log("apontamento de " + funcionario.nome + ": ");
      console.log(apontamento);

      //se tiver marcações/infoTrabalho - funcionário está presente
      if (apontamento.marcacoes || apontamento.infoTrabalho) {          
        
        expedienteObj = updatePresenceStatus(apontamento.infoTrabalho.trabalha, turno, apontamento); //true -> trabalha
        apontamento.statusCodeString = expedienteObj.code;
        apontamento.statusString = expedienteObj.string;
        apontamento.statusImgUrl = expedienteObj.imgUrl;
        saldoDia = apontamento.infoTrabalho.trabalhados - apontamento.infoTrabalho.aTrabalhar;
        
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

        //console.log('SetPretty, ELSE - Não Tem Apontamento!');
        //pode não ter expediente iniciado, ser feriado, estar atrasado, de folga ou faltante mesmo
        expedienteObj = updateAbsenceStatus(funcionarioAlocacao);
        apontamento.statusCodeString = expedienteObj.code;
        apontamento.statusString = expedienteObj.string;
        apontamento.statusImgUrl = expedienteObj.imgUrl;
        
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

      //   //pode não ter expediente iniciado, estar atrasado ou faltante mesmo
      //   if (apontamento.marcacoes.length == 0){

          
      //     expedienteObj = checkExpediente(funcionarioAlocacao, false, false);
      //     apontamento.statusCodeString = expedienteObj.code;
      //     apontamento.statusString = expedienteObj.string;
      //     apontamento.statusImgUrl = expedienteObj.imgUrl;

      //     //se o func estiver ausente
      //     if (expedienteObj.code == "AUS") {

      //     }

      //   } //aqui podemos contabilizar o saldo de BH tb           
      //   else if (apontamento.marcacoes.length > 0){
          
      //     apontamento.marcacoesStringObj = createStringMarcacoes(apontamento);
      //     //checar a primeira batida -> ent1
      //     var _ent1ObjMarcacao = apontamento.marcacoes[0];
      //     var minutosTotaisMarcacao = converteParaMinutosTotais(_ent1ObjMarcacao.hora, 
      //       _ent1ObjMarcacao.minuto);
      //     //apontamento.statusString = "Em andamento";
      //     //Verificar a falta de flexibilidade, pois utiliza a tolerancia
      //     if(!funcionario.alocacao.turno.isFlexivel){

      //       expedienteObj = checkExpediente(funcionarioAlocacao, minutosTotaisMarcacao, funcionarioAlocacao.turno.tolerancia);
      //       apontamento.statusCodeString = expedienteObj.code;
      //       apontamento.statusString = expedienteObj.string;
      //       apontamento.statusImgUrl = expedienteObj.imgUrl;

      //       //É Dia de Folga e o cara tá trabalhando
      //       if (expedienteObj.code == "DSR") {
      //         apontamento.observacoes = "Funcionário trabalhando em dia de folga";
      //       }

      //     }
      //     else {
      //       //////console.log("horário flexível, não dá pra dizer se há atraso");
      //       apontamento.statusCodeString = "FLE";
      //       apontamento.statusString = "Horário Flexível";
      //       apontamento.statusImgUrl = "assets/img/app/todo/bullet-black.png";
      //     }               
          
      //     //salvar no apontamento de cada funcionario
      //     totalBHDia = calcularBancoHorasDia(funcionarioAlocacao.turno.escala.codigo, 
      //       funcionarioAlocacao, apontamento);        

      //     //console.log("********* MapBancoHoras: ", totalBHDia);
      //   }
       
      // }
      // //se não tiver apontamento ou marcações -> 
      // else {
      //   expedienteObj = checkExpediente(funcionarioAlocacao, false, false);
      //   apontamento.statusCodeString = expedienteObj.code;
      //   apontamento.statusString = expedienteObj.string;
      //   apontamento.statusImgUrl = expedienteObj.imgUrl;

      //   //se o func estiver ausente
      //   if (expedienteObj.code == "AUS") {

      //   }
      // }

      // //inclui uma property para o total calculado de banco horas do dia (registro em minutos)
      // if (totalBHDia != null){
      //   apontamento.bancoHorasDia = totalBHDia;
      //   apontamento.objBHDiario = getBancoHorasDiarioFtd(totalBHDia);
      // }
      // else {
        
      // } 

      //Atualiza o funcionario.apontamento.
      funcionario.apontamentoDiario = apontamento;
    };

    /*
     * Preenche as batidas através do array formatado que vem no Apontamento
    */

    function preencherBatidasTabela(apontamento) {

      var entSaidas = ['ent1', 'sai1', 'ent2', 'sai2'];//só mostro as 4 primeiras nessa tabela
      //console.log('[antes] - apontamento marcacaoes ftd: ', apontamento.marcacoesFtd);
      apontamento.marcacoesFtd.sort(function(a, b){//ordena o array de marcaçõesFtd
        return a > b;
      });
      //console.log('[depois] - apontamento marcacaoes ftd: ', apontamento.marcacoesFtd);
      apontamento.marcacoesStringObj = {};
      for (var i = 0; i < apontamento.marcacoesFtd.length; i++) {
        apontamento.marcacoesStringObj[entSaidas[i]] = apontamento.marcacoesFtd[i];
      }

      for (var j = apontamento.marcacoesFtd.length; j < entSaidas.length; j++){
        apontamento.marcacoesStringObj[entSaidas[j]] = '-';
      }
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
     *
     * O colaborador está presente, resta saber se ele chegou dentro da tolerância estabelecida
     * trabalha -> informa se é dia de trabalho ou não 
     *
    */
    function updatePresenceStatus (trabalha, turno, apontamento) {

      var tolerancia = turno.tolerancia ? turno.tolerancia : 0;
      var madrugou = false;
      var atrasou = false;
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

        console.log('dia comparação: ', diaComparacao);

        var marcacao;
        var minutosComparacao;
        for (var i=0; i<apontamento.marcacoes.length; i++){

          marcacao = apontamento.marcacoes[i];
          minutosMarcacao = (marcacao.hora * 60) + marcacao.minuto;
          console.log('minutos marcação: ', minutosMarcacao);      
          console.log('marcacao.descricao: ', marcacao.descricao);
          // console.log('dia comparacao access object: ', diaComparacao.horarios["ent1"]);
          minutosComparacao = diaComparacao.horarios[marcacao.descricao];
          console.log('minutosComparacao: ', minutosComparacao);
          console.log('tolerancia ', tolerancia);
          if (minutosMarcacao < (minutosComparacao - tolerancia)){
            //chegou mto cedo
            madrugou = true;
          } 
          if (minutosMarcacao > (minutosComparacao + tolerancia)) {
            atrasou = true;
          }
        }

        if(!atrasou && !madrugou){
          //////console.log("Está dentro dos limites tolerados no horário rígido!");
          return {code: "PRE", string: "Presente", imgUrl: "assets/img/app/todo/bullet-green.png"};
        } else if (atrasou){
          //////console.log("Está fora dos limites - bateu atrasado!");
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
    function updateAbsenceStatus(funcionarioAlocacao) {
      
      var codigoEscala = funcionarioAlocacao.turno.escala.codigo; 
      var ignoraFeriados =  funcionarioAlocacao.turno.ignoraFeriados;

      if (isFeriado() && !ignoraFeriados){//Caso 1 - feriado
        
        return {code: "FRD", string: "Feriado!", imgUrl: "assets/img/app/todo/bullet-emoji.png", saldoDia: getSaldoDiaFrd(funcionarioAlocacao)};

      } else if (hasFolgaSolicitada() || hasLicenca()){ //Caso 3 - Folgas/Licenças

        //console.log('Caso 3 - checar');

      } else { //Caso 2, 4 ou 5
        
        if (codigoEscala == 1) {
          return checkJornadaSemanal(funcionarioAlocacao);
        }

        else if (codigoEscala == 2)
          return checkJornadaRevezamento(funcionarioAlocacao);
      }
    };

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

    function checkJornadaSemanal(funcionarioAlocacao) {

      var today = $scope.currentDate.getDay(); //dia da semana correspondente à navegação do usuário (numérico 0 (dom) - 6 (sáb))
      var jornadaArray = funcionarioAlocacao.turno.jornada.array; //para ambas as escalas

      var objDay = getDayInArrayJornadaSemanal(today, jornadaArray);
      
      if (objDay.minutosTrabalho <= 0) { //Caso 4 - DSR
        
        return {code: "DSR", string: "Descanso Semanal Remunerado", imgUrl: "assets/img/app/todo/bullet-grey.png"};

      } else { //Chegando aqui, só pode ser ENI ou Ausente de fato

        var codDate = compareOnlyDates($scope.currentDate, dataHoje);

        if (codDate === 0) { //é o próprio dia de hoje
          //////console.log("Olhando para o dia de hoje! Pode estar Ausente ou ENI");
          //HORA ATUAL é menor que ENT1 ? caso sim, sua jornada ainda não começou
          var totalMinutesAtual = converteParaMinutosTotais(dataHoje.getHours(), 
          dataHoje.getMinutes());
          var ENT1 = objDay.horarios.ent1;
          console.log("Total de minutos da hora atual: ", totalMinutesAtual);
          console.log("Entrada 1: ", ENT1);

          if (totalMinutesAtual < ENT1) {
          
            //////console.log("Ainda não iniciou o expediente");
            return {code: "ENI", string: "Expediente Não Iniciado", imgUrl: "assets/img/app/todo/bullet-blue.png"};

          } else {
            //////console.log("Já passou o tempo da batida dele , então está ausente, ainda não bateu!");
            return {code: "AUS", string: "Ausente", imgUrl: "assets/img/app/todo/bullet-red.png", saldoDia: objDay.minutosTrabalho};
          }

        } else if (codDate === -1) {//Navegando em dia passado 

          //////console.log("Navegando em dias anteriores e sem valor de apontamento, ou seja, faltante");
          return {code: "AUS", string: "Ausente", imgUrl: "assets/img/app/todo/bullet-red.png", saldoDia: objDay.minutosTrabalho};

        } else { //Navegando em dias futuros

          //////console.log("Navegando em dias futuros, expediente não iniciado!");
          return {code: "ENI", string: "Expediente Não Iniciado", imgUrl: "assets/img/app/todo/bullet-blue.png"};
        }
      } 
    };

    /*
     * Na Jornada 12x36h não adianta pegar os minutosTrabalho feito na semanal, pois temos que checar se o dia é de trabalho ou folga
     * ELes trabalham dia sim / dia não na prática, temos que saber se esse é o dia SIM ou NÃO...
    */
    function checkJornadaRevezamento(funcionarioAlocacao) {

      var jornadaArray = funcionarioAlocacao.turno.jornada.array;

      var trabalha = isWorkingDay($scope.currentDate, 
        new Date(funcionarioAlocacao.dataInicioEfetivo));
      
      if (trabalha && jornadaArray.length > 0) { //ele deveria ter trabalhado, ou é ENI ou AUSENCIA

        var ENT1 = jornadaArray[0].horarios.ent1;
        var codDate = compareOnlyDates($scope.currentDate, dataHoje);

        if (codDate === 0) { //é o próprio dia de hoje
          //////console.log("Olhando para o dia de hoje! Pode estar Ausente ou ENI");
          //HORA ATUAL é menor que ENT1 ? caso sim, sua jornada ainda não começou
          var totalMinutesAtual = converteParaMinutosTotais(dataHoje.getHours(), 
          dataHoje.getMinutes());
          //////console.log("Total de minutos da hora atual: ", totalMinutesAtual);

          if (totalMinutesAtual < ENT1) {
          
            //////console.log("Ainda não iniciou o expediente");
            return {code: "ENI", string: "Expediente Não Iniciado", imgUrl: "assets/img/app/todo/bullet-blue.png"};

          } else {
            //////console.log("Já passou o tempo da batida dele , então está ausente, ainda não bateu!");
            return {code: "AUS", string: "Ausente", imgUrl: "assets/img/app/todo/bullet-red.png", saldoDia: funcionarioAlocacao.turno.jornada.minutosTrabalho};
          }
        } else if (codDate === -1) {//Navegando em dia passado 

          //////console.log("Navegando em dias anteriores e sem valor de apontamento, ou seja, faltante");
          return {code: "AUS", string: "Ausente", imgUrl: "assets/img/app/todo/bullet-red.png", saldoDia: funcionarioAlocacao.turno.jornada.minutosTrabalho};
        } else { //Navegando em dias futuros

          //////console.log("Navegando em dias futuros, expediente não iniciado!");
          return {code: "ENI", string: "Expediente Não Iniciado", imgUrl: "assets/img/app/todo/bullet-blue.png"};
        }

      } else {

        return {code: "DSR", string: "Descanso Semanal Remunerado", imgUrl: "assets/img/app/todo/bullet-grey.png"}; 
      }
    };

    function checkExpediente(funcionarioAlocacao, valorComparacao, tolerancia) {
      
      var today = $scope.currentDate.getDay();
      var codigoEscala = funcionarioAlocacao.turno.escala.codigo; 
      var jornadaArray = funcionarioAlocacao.turno.jornada.array; //para ambas as escalas
      var ignoraFeriados =  funcionarioAlocacao.turno.ignoraFeriados;

      //////console.log("################## CHECK EXPEDIENTE");
      //////console.log("today ", today);//dia da semana apenas de 0 a 6
      //////console.log("codigoEscala ", codigoEscala);
      //////console.log("jornadaArray", jornadaArray);
      //////console.log("Ignora Feriados? ", ignoraFeriados);
      //////console.log("valorComparacao", valorComparacao);
      //////console.log("tolerancia", tolerancia);
      
      if (isFeriado() && !ignoraFeriados){
        
        return {code: "FRD", string: "Feriado!", imgUrl: "assets/img/app/todo/bullet-emoji.png"};

      } else {
          
          //Obtém a informação do DIA ATUAL na jornada do trabalhador
          var objDay;

          if (codigoEscala == 1) {// jornada semanal
            
            objDay = getDayInArrayJornadaSemanal(today, jornadaArray);
            //////console.log("ObjDay ", objDay);
            if (objDay.horarios) {

            //ENTRADA 1 para o DIA ATUAL
            var ENT1 = objDay.horarios.ent1;
            //////console.log("ENT 1: ", ENT1);
            
            if (!valorComparacao){ //é o caso de saber se é o início do expediente
              
              //Verificar se o dia navegado é antes ou depois comparado ao dia de HOJE
              //////console.log('$scope.currentDate: ', $scope.currentDate);
              //////console.log('Data Hoje: ', dataHoje);
              var codDate = compareOnlyDates($scope.currentDate, dataHoje);
              //////console.log('$scope.currentDate: ', $scope.currentDate);
              //////console.log('Data Hoje: ', dataHoje);

              if (codDate === 0) { //é o próprio dia de hoje
                //////console.log("Olhando para o dia de hoje! Pode estar Ausente ou ENI");
                //HORA ATUAL é menor que ENT1 ? caso sim, sua jornada ainda não começou
                var totalMinutesAtual = converteParaMinutosTotais(dataHoje.getHours(), 
                dataHoje.getMinutes());
                //////console.log("Total de minutos da hora atual: ", totalMinutesAtual);

                if (totalMinutesAtual < ENT1) {
                
                  //////console.log("Ainda não iniciou o expediente");
                  return {code: "ENI", string: "Expediente Não Iniciado", imgUrl: "assets/img/app/todo/bullet-blue.png"};

                } else {
                  //////console.log("Já passou o tempo da batida dele , então está ausente, ainda não bateu!");
                  return {code: "AUS", string: "Ausente", imgUrl: "assets/img/app/todo/bullet-red.png"};
                }
              } else if (codDate === -1) {//Navegando em dia passado 

                  //////console.log("Navegando em dias anteriores e sem valor de apontamento, ou seja, faltante");
                  return {code: "AUS", string: "Ausente", imgUrl: "assets/img/app/todo/bullet-red.png"};
                } else { //Navegando em dias futuros

                  //////console.log("Navegando em dias futuros, expediente não iniciado!");
                  return {code: "ENI", string: "Expediente Não Iniciado", imgUrl: "assets/img/app/todo/bullet-blue.png"};
                }

              } else { //Você compara com o valor fornecido por parametro (q normalmente é o valor do apontamento)

                if((valorComparacao >= (ENT1 - tolerancia)) && (valorComparacao <= (ENT1 + tolerancia))){
                  //////console.log("Está dentro dos limites tolerados no horário rígido!");
                  return {code: "PRE", string: "Presente", imgUrl: "assets/img/app/todo/bullet-green.png"};
                } else {
                  //////console.log("Está fora dos limites - bateu atrasado!");
                  return {code: "ATR", string: "Presente com observação (primeira batida aquém ou além da tolerância estabelecida)", imgUrl: 'assets/img/app/todo/bullet-green2.png'};
                }

              }

            } else { //Não tem a property "horarios", significa que não é dia de trabalho!

              //////console.log("Dia de descanso na escala semanal");
              return {code: "DSR", string: "Descanso Semanal Remunerado", imgUrl: "assets/img/app/todo/bullet-grey.png"};
            }

          } else if (codigoEscala == 2) {

            //////console.log("ObjDay ", objDay);
            objDay = getDayInJornadaDiferenciada($scope.currentDate, 
              new Date(funcionarioAlocacao.dataInicioEfetivo));
            

            if (objDay.isWorkingDay && jornadaArray.length > 0) {

              //ENTRADA 1 para o DIA ATUAL
              var ENT1 = jornadaArray[0].horarios.ent1;
              //////console.log("ENT 1: ", ENT1);

              //Não tem apontamentos
              if (!valorComparacao){ //verificar se é pq não iniciou o expediente ou se é pq faltou
              
                //Verificar se o dia navegado é antes ou depois comparado ao dia de HOJE
                //////console.log('$scope.currentDate: ', $scope.currentDate);
                //////console.log('Data Hoje: ', dataHoje);
                var codDate = compareOnlyDates($scope.currentDate, dataHoje);
                //////console.log('$scope.currentDate: ', $scope.currentDate);
                //////console.log('Data Hoje: ', dataHoje);

                if (codDate === 0) { //é o próprio dia de hoje
                  //////console.log("Olhando para o dia de hoje! Pode estar Ausente ou ENI");
                  //HORA ATUAL é menor que ENT1 ? caso sim, sua jornada ainda não começou
                  var totalMinutesAtual = converteParaMinutosTotais(dataHoje.getHours(), 
                  dataHoje.getMinutes());
                  //////console.log("Total de minutos da hora atual: ", totalMinutesAtual);

                  if (totalMinutesAtual < ENT1) {
                  
                    //////console.log("Ainda não iniciou o expediente");
                    return {code: "ENI", string: "Expediente Não Iniciado", imgUrl: "assets/img/app/todo/bullet-blue.png"};

                  } else {
                    //////console.log("Já passou o tempo da batida dele , então está ausente, ainda não bateu!");
                    return {code: "AUS", string: "Ausente", imgUrl: "assets/img/app/todo/bullet-red.png"};
                  }
                } else if (codDate === -1) {//Navegando em dia passado 

                  //////console.log("Navegando em dias anteriores e sem valor de apontamento, ou seja, faltante");
                  return {code: "AUS", string: "Ausente", imgUrl: "assets/img/app/todo/bullet-red.png"};
                } else { //Navegando em dias futuros

                  //////console.log("Navegando em dias futuros, expediente não iniciado!");
                  return {code: "ENI", string: "Expediente Não Iniciado", imgUrl: "assets/img/app/todo/bullet-blue.png"};
                }

              } else { //Você compara com o valor fornecido por parametro (q normalmente é o valor do apontamento)

                if((valorComparacao >= (ENT1 - tolerancia)) && (valorComparacao <= (ENT1 + tolerancia))){
                  //////console.log("Está dentro dos limites tolerados no horário rígido!");
                  return {code: "PRE", string: "Presente", imgUrl: "assets/img/app/todo/bullet-green.png"};
                } else {
                  //////console.log("Está fora dos limites - bateu atrasado!");
                  return {code: "ATR", string: "Presente com observação (primeira batida aquém ou além da tolerância estabelecida)", imgUrl: "assets/img/app/todo/bullet-green2.png"};
                }

              }

            } else {

              //////console.log("Dia de descanso na escala semanal");
              return {code: "DSR", string: "Descanso Semanal Remunerado", imgUrl: "assets/img/app/todo/bullet-grey.png"}; 
            }
          }        
          
      } //fim do não-feriado
    };

    function getDayInArrayJornadaSemanal(dayToCompare, arrayJornadaSemanal) {
      
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

    //12x36h
    function getDayInJornadaDiferenciada(dateToCompare, dataInicioEfetivo) {
      
      return {
        isWorkingDay: isWorkingDay(dateToCompare, dataInicioEfetivo)      
      };
    };

    function isWorkingDay(dateToCompare, dataInicioEfetivo) {

      var oneDay = 24*60*60*1000; // hours*minutes*seconds*milliseconds
      
      var d1 = angular.copy(dateToCompare); 
      var d2 = angular.copy(dataInicioEfetivo);
      d1.setHours(0,0,0,0);
      d2.setHours(0,0,0,0);

      var diffDays = Math.round(Math.abs((d1.getTime() - d2.getTime())/(oneDay)));
      //////console.log("diffDays: ", diffDays);
      
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
      console.log('craindo marcações string!');

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
      console.log('retornando marcações string: ', marcacaoStringObj);
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

    //Calcula o banco de horas desse dia e retorna um inteiro indicando a quantidade de minutos 
    //(positivo -> saldo de horas, negativo -> fez horas a menos que o desejado)
    function calcularBancoHorasDia(codigoEscala, funcionarioAlocacao, apontamento) {

      ////console.log('**codigoEscala', codigoEscala);
      ////console.log('**funcionarioAlocacao', funcionarioAlocacao);
      ////console.log('**apontamento', apontamento);
      
      //var diaSemanaCorrente = (dateParam) ? dateParam.getDay() : $scope.currentDate.getDay();

      var horasTrabalhadas = calcularMarcacoes(apontamento);
      ////console.log("**horasTrabalhadas: ", horasTrabalhadas);
      var horasDesejadas = 0;

      //semanal
      if (codigoEscala == 1) {

        horasDesejadas = getDayInArrayJornadaSemanal((new Date(apontamento.data)).getDay(), funcionarioAlocacao.turno.jornada.array).minutosTrabalho;

      } else if (codigoEscala == 2) {

        if (isWorkingDay(new Date(apontamento.data), 
            new Date(funcionarioAlocacao.dataInicioEfetivo))){
          
          horasDesejadas = funcionarioAlocacao.turno.jornada.minutosTrabalho;
        }
      }

      ////console.log('** Horas Desejadas: ', horasDesejadas);
      return horasTrabalhadas ? (horasTrabalhadas - horasDesejadas) : null;
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

    function isFeriado() {
       
      var date = $scope.currentDate.getDate();//1 a 31
      var month = $scope.currentDate.getMonth();//0 a 11
      var year = $scope.currentDate.getFullYear();//
      var flagFeriado = false;
      var tempDate;

      $scope.feriados.forEach(function(feriado){
        
        tempDate = new Date(feriado.data);
        if (feriado.fixo){
          
          if (tempDate.getMonth() === month && tempDate.getDate() === date){
            //////console.log("É Feriado (fixo)!");
            flagFeriado = true;
            return feriado;
          }

        } else {//se não é fixo

          if ( (tempDate.getFullYear() === year) && (tempDate.getMonth() === month) && (tempDate.getDate() === date) ){
            //////console.log("É Feriado (variável)!");
            flagFeriado = true;
            return feriado;
          }

        }
      });

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

    function createSeriesGraphic(apontamento) {

      //////console.log("apontamento: ", apontamento);
    };

    function addOrSubtractDays(date, value) {
          
      date = angular.copy(date);
      date.setHours(0,0,0,0);

      return new Date(date.getTime() + (value*864e5));
    }

    function buildGraphBar(apontamentosSemanais) {
      
      buildBarGraphLabelsLastWeek();
      console.log("$scope.weekLabels", $scope.weekLabels);
      //buildBarGraphData(apontamentosSemanais);
    }

    /*
    ** No eixo-x construíremos as categorias, atualmente podem ser 1 semana (7 dias), 
    ** 1 mês (4 a 5 semanas) e 3 meses;
    */
    function buildArrayDataBarGraph(dataInicial, intervaloDias, apontamentosSemanais) {

      var chartData = [];
      var itemChartData = {
        // id: 0, //id para controle
        // date: new Date(), //data do item (ex.: 19/04/2017)
        // day: 0, //dia referente a essa data (ex.: 'qua')
        // workedMinutes: 5 //minutos trabalhados nessa data
      };

      var countId = 0;
      var dataAtualLaco = dataInicial;
      var totalHorasDiaEquipe = 0;
      var searchedElements = [];

      for (var i=0; i<intervaloDias-1; i++){

        console.log('id', countId);
        console.log('data atual', dataAtualLaco);
        console.log('dia da semana', weekDays[dataAtualLaco.getDay()]);

        searchedElements = getApontamentosFromSpecificDate(apontamentosSemanais, dataAtualLaco);
        console.log("elementos recuperados: ", searchedElements);

        if(searchedElements.length > 0)
          totalHorasDiaEquipe = calcularBancoHorasEquipe(searchedElements, dataAtualLaco);

        console.log('totalHorasDiaEquipe? ', totalHorasDiaEquipe);

        itemChartData = {
          id: countId,
          date: dataAtualLaco,
          day: weekDays[dataAtualLaco.getDay()], //0 (dom) - 6 (sáb)
          workedMinutes: totalHorasDiaEquipe
        }

        chartData.push(itemChartData);
        countId++;
        dataAtualLaco = addOrSubtractDays(dataAtualLaco, 1);
      }

      return chartData;
    };

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

      //     ////console.log("apontamento pego: ", apontamentosSemanais[j]); 
      //     j++;
      //   }
      //   //qtde 'j' indica numero de funcionários com apontamentos nessa data...
    };

    function buildBarGraphLabelsLastWeek() {

      $scope.weekLabels = [];
      var count = 0;

      //console.log("currentWeek begin: ", $scope.currentWeek.begin);
      var beginDay = (new Date($scope.currentWeek.begin)).getDay();
      //$scope.weekLabels.push(weekDays[beginDay]);
      
      for (var i=beginDay; i<=6; i++) {

        $scope.weekLabels.push(weekDays[i]);
        objMapDataLabel[i] = count;
        count++;
      }

      for (var i=0; i<beginDay; i++) {

        $scope.weekLabels.push(weekDays[i]);
        objMapDataLabel[i] = count;
        count++;
      }
    };

    function buildBarGraphData(apontamentosSemanais) {

      //$scope.weekData = [[5, -1, 2, 0, -2, -4, 8]];
      $scope.weekData = [];
      var arrayBancoHorasSemanal = [0, 0, 0, 0, 0, 0, 0];
      ////console.log("arrayBancoHorasSemanal: ", arrayBancoHorasSemanal);
      ////console.log("objMapDataLabel: ", objMapDataLabel);
      var dateSemana;
      var totalHorasDiaEquipe = 0;
      
      //console.log("Apontamento semanal length: ", apontamentosSemanais.length);
      //console.log("Apontamento semanais: ", apontamentosSemanais);
      var j;
      var removedElements;
      //For dos dias da semana (se for mensal, o valor seria 30 por ex... mes de 30 dias claro)
      for (var i=0; i<7; i++) {
        
        dateSemana = addOrSubtractDays($scope.currentWeek.begin, i);
        //console.log("## data atual do laço: ", dateSemana);
          
        //Tem que enviar um ARRAY de apontamentos ordenados pela data para FUNCIONAR esse laço, melhorando a performance
        j = 0;
        
        while( apontamentosSemanais[j] && (compareOnlyDates(dateSemana, new Date(apontamentosSemanais[j].data)) == 0)){//enquanto for a mesma

          ////console.log("apontamento pego: ", apontamentosSemanais[j]); 
          j++;
        }
        //qtde 'j' indica numero de funcionários com apontamentos nessa data...

        removedElements = apontamentosSemanais.splice(0, j);
        //console.log("elementos cortados: ", removedElements);
        // ////console.log("corta do array só as datas ordenadas encontradas a partir da data exposta acima, sobrou: ", apontamentosSemanais.length);

        totalHorasDiaEquipe = calcularBancoHorasEquipe(removedElements, dateSemana);

        arrayBancoHorasSemanal[objMapDataLabel[dateSemana.getDay()]] += totalHorasDiaEquipe;

      }

      $scope.weekData.push(arrayBancoHorasSemanal);
    };

    function calcularBancoHorasEquipe(apontamentosDiaFuncionario, currentDateNav){

      var tempHoras;
      var totalMntsTrabalhadosEquipe = 0;
      var totalHorasAusente = 0;

      $scope.equipe.componentes.forEach(function (componente){
          
        tempHoras = null;
        //console.log("#componente: ", componente);

        for (var i=0; i<apontamentosDiaFuncionario.length; i++) {
          if (componente._id == apontamentosDiaFuncionario[i].funcionario._id){
            tempHoras = calcularBancoHorasDia(apontamentosDiaFuncionario[i].funcionario.alocacao.turno.escala.codigo, 
                 apontamentosDiaFuncionario[i].funcionario.alocacao, apontamentosDiaFuncionario[i]);
            totalMntsTrabalhadosEquipe += tempHoras;
            break;
          }
        }
        ////console.log("#tempHoras do dia para esse funcionário: ", tempHoras);
        //O funcionário esteve ausente neste dia se chegar aqui [verificar se era FOLGA/FÉRIAS/FERIADO ou algo nesse sentido]
        if (tempHoras == null || tempHoras == undefined || tempHoras == NaN){//não usar !tempHoras pq as vezes o resultado é 0, e aí entraria aqui tb
          
          totalHorasAusente = calcularHorasAusente(componente, currentDateNav);//calcula as horas de acordo com a "ausência" do funcionário [verificar os casos acima]
          ////console.log("totalHorasAusente: ", totalHorasAusente);
          totalMntsTrabalhadosEquipe -= totalHorasAusente;
        }
      });

      return converteParaHorasTotais(totalMntsTrabalhadosEquipe);
    };

    function calcularHorasAusente(componente, currentDateNav) {

      var codigoEscala = componente.alocacao.turno.escala.codigo;
      var totalMntsAtrabalhar = 0;

      if (isFeriado() && !componente.alocacao.turno.ignoraFeriados){
        
        // if (codigo == 1) {
        //   var objDay = getDayInArrayJornadaSemanal(currentDateNav.getDay(), componente.alocacao.turno.jornada.array);
        //   if (objDay.horarios)
        //     totalMntsAtrabalhar = calcularMarcacoesAusente(objDay.horarios);
        // }

        // else if (codigoEscala == 2)
        //   totalMntsAtrabalhar = calcularMarcacoesAusente(componente.alocacao.turno.jornada.array[0].horarios)

        //return -totalMntsAtrabalhar;
        return totalMntsAtrabalhar;

      } else {

        //Obtém a informação do DIA ATUAL na jornada do trabalhador
        var objDay;

        if (codigoEscala == 1) {// jornada semanal

          ////console.log("escala semanal");
          objDay = getDayInArrayJornadaSemanal(currentDateNav.getDay(), componente.alocacao.turno.jornada.array);
          //////console.log("ObjDay ", objDay);
          if (!objDay.horarios) { //DSR -> Descanso Semanal Remunerado

            return totalMntsAtrabalhar;

          } else {//realmente esteve ausente, verificar quantas horas deveria ter feito.

            totalMntsAtrabalhar = calcularMarcacoesAusente(objDay.horarios);
            return totalMntsAtrabalhar;
          }

        } else if (codigoEscala == 2) {

          objDay = getDayInJornadaDiferenciada(currentDateNav, new Date(componente.alocacao.dataInicioEfetivo));
          ////console.log("escala 12x36h");
          if (objDay.isWorkingDay && componente.alocacao.turno.jornada.array.length > 0) { //realmente faltou

            totalMntsAtrabalhar = calcularMarcacoesAusente(componente.alocacao.turno.jornada.array[0].horarios);
            return totalMntsAtrabalhar;

          } else { //é DSR nessa escala
            return totalMntsAtrabalhar;
          }
        }
      }
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