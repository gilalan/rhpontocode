/**
 * @author v.lugovsky
 * created on 16.12.2015
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.dashboard', [])
      .config(routeConfig).config(amChartConfig).controller('DashboardCtrl', dashboardCtrl);

  /** @ngInject */
  function routeConfig($stateProvider) {
    $stateProvider
        .state('dashboard', {
          url: '/dashboard',
          templateUrl: 'app/pages/dashboard/dashboard.html',
          title: 'Indicadores',
          sidebarMeta: {
            icon: 'ion-android-home',
            order: 0,
          },
          access: 'gestor',
          accessLevel: 3,
          resolve: {
            setores: function(sectorAPI){
              return sectorAPI.get();
            },          
            usuario: function(usersAPI, Auth){
              return usersAPI.getUsuario(Auth.getCurrentUser()._id);
            },
            feriados: function(feriadoAPI){
              return feriadoAPI.get();
            },
            currentDate: function(appointmentAPI) {
              return appointmentAPI.getCurrentDate();
            }
          },
          controller: 'DashboardCtrl'
        });
  }

  function dashboardCtrl($scope, $filter, setores, usuario, feriados, currentDate, teamAPI, appointmentAPI){
    
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
      
      //escala semanal
      //if (codigoEscala == 1) {

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

    function setPretty(funcionario) {
    
      var expedienteObj = {};
      var funcionarioAlocacao = funcionario.alocacao;    
      var apontamento = funcionario.apontamentoDiario;
      var totalBHDia = null;

      //console.log("funcionario NOME: ", funcionario.nome);

      //se tiver marcações
      if (apontamento.marcacoes) {          
        
        //pode não ter expediente iniciado, estar atrasado ou faltante mesmo
        if (apontamento.marcacoes.length == 0){

          
          expedienteObj = checkExpediente(funcionarioAlocacao, false, false);
          apontamento.statusCodeString = expedienteObj.code;
          apontamento.statusString = expedienteObj.string;
          apontamento.statusImgUrl = expedienteObj.imgUrl;

          //se o func estiver ausente
          if (expedienteObj.code == "AUS") {

          }

        } //aqui podemos contabilizar o saldo de BH tb           
        else if (apontamento.marcacoes.length > 0){
          
          apontamento.marcacoesStringObj = createStringMarcacoes(apontamento);
          //checar a primeira batida -> ent1
          var _ent1ObjMarcacao = apontamento.marcacoes[0];
          var minutosTotaisMarcacao = converteParaMinutosTotais(_ent1ObjMarcacao.hora, 
            _ent1ObjMarcacao.minuto);
          //apontamento.statusString = "Em andamento";
          //Verificar a falta de flexibilidade, pois utiliza a tolerancia
          if(!funcionario.alocacao.turno.isFlexivel){

            expedienteObj = checkExpediente(funcionarioAlocacao, minutosTotaisMarcacao, funcionarioAlocacao.turno.tolerancia);
            apontamento.statusCodeString = expedienteObj.code;
            apontamento.statusString = expedienteObj.string;
            apontamento.statusImgUrl = expedienteObj.imgUrl;

            //É Dia de Folga e o cara tá trabalhando
            if (expedienteObj.code == "DSR") {
              apontamento.observacoes = "Funcionário trabalhando em dia de folga";
            }

          }
          else {
            //////console.log("horário flexível, não dá pra dizer se há atraso");
            apontamento.statusCodeString = "FLE";
            apontamento.statusString = "Horário Flexível";
            apontamento.statusImgUrl = "assets/img/app/todo/bullet-black.png";
          }               
          
          //salvar no apontamento de cada funcionario
          totalBHDia = calcularBancoHorasDia(funcionarioAlocacao.turno.escala.codigo, 
            funcionarioAlocacao, apontamento);        

          //console.log("********* MapBancoHoras: ", totalBHDia);
        }
       
      }
      //se não tiver apontamento ou marcações -> 
      else {
        expedienteObj = checkExpediente(funcionarioAlocacao, false, false);
        apontamento.statusCodeString = expedienteObj.code;
        apontamento.statusString = expedienteObj.string;
        apontamento.statusImgUrl = expedienteObj.imgUrl;

        //se o func estiver ausente
        if (expedienteObj.code == "AUS") {

        }
      }

      //inclui uma property para o total calculado de banco horas do dia (registro em minutos)
      if (totalBHDia != null){
        apontamento.bancoHorasDia = totalBHDia;
        apontamento.objBHDiario = getBancoHorasDiarioFtd(totalBHDia);
      }
      else {
        
      } 

      //Atualiza o funcionario.apontamento.
      funcionario.apontamentoDiario = apontamento;
    };

    function createPrettyStringResults(apontamentoDiariosPorFuncionario) {

      var hasAppoint = false;

      $scope.equipe.componentes.forEach(function(componente){
        
        hasAppoint = false;
        sortArrayJornadaAsc(componente);

        apontamentoDiariosPorFuncionario.forEach(function(apontamentoDiarioPorFuncionario){
          
          //se encontrar, é pq o funcionario tem apontamentos
          if (componente._id == apontamentoDiarioPorFuncionario.funcionario._id){
            componente.apontamentoDiario = apontamentoDiarioPorFuncionario;
            setPretty(componente);
            hasAppoint = true;
            return hasAppoint;
          }

        });

        if (!hasAppoint) {
          //aí verificamos os casos possíveis (feriados, DSR, AUSENCIA)
          //////console.log("################Desve estar caindo aqui , sem apontamento...")
          componente.apontamentoDiario = {};
          setPretty(componente);
          //////console.log("componente modificado: ", componente);
        }

        createSeriesGraphic(componente.apontamentoDiario);

      });
    };

    function compareOnlyDates(date1, date2) {

      //como a passagem é por referência, devemos criar uma cópia do objeto
      var d1 = angular.copy(date1); 
      var d2 = angular.copy(date2);
      d1.setHours(0,0,0,0);
      d2.setHours(0,0,0,0);

      if (d1.getTime() < d2.getTime())
        return -1;
      else if (d1.getTime() === d2.getTime())
        return 0;
      else
        return 1; 
    };

    /*
    * Essa função obtém os apontamentos 
    */
    function getOnlyApontDiarios(apontamentosSemanais) {

      return apontamentosSemanais.filter(function(apontamento){
        //////console.log("apontamento.data: ", new Date(apontamento.data));
        //////console.log("currentDate: ", $scope.currentDate);
        //////console.log("são iguais? ", compareOnlyDates(new Date(apontamento.data), $scope.currentDate))
        return (compareOnlyDates(new Date(apontamento.data), 
          $scope.currentDate) === 0);
      });
    };

    //Esse meu intervalo está sendo para apenas 1 dia, esse código não funcionará
    //caso a gnt altere esse comportamento! Cuidado!
    function getApontamentosByDateRangeAndEquipe(beginDate, intervaloDias, componentes, updateDiario) {

      //var objDateEquipe = {date: $scope.currentDate, dias: intervaloDias, equipe: componentes};
      var objDateEquipe = {
        date: beginDate, 
        dias: intervaloDias, 
        equipe: componentes
      };

      if (firstRun) {   

        console.log("Objeto Date Equipe Enviado: ", objDateEquipe);

        appointmentAPI.getApontamentosByDateRangeAndEquipe(objDateEquipe).then(function successCallback(response){

          var apontamentosSemanais = response.data;
          console.log("#$%@$#@%#$@#%$@%#$@ Apontamentos Semanais: ", apontamentosSemanais);
          var apontamentosDiarios = getOnlyApontDiarios(apontamentosSemanais);
          
          createPrettyStringResults(apontamentosDiarios);
          //buildGraphBar(apontamentosSemanais); //TEM QUE DESCOMENTAR QQ COISA SOBRE O GRAFICO
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

          if (updateDiario) {
            
            createPrettyStringResults(apontamentosResponse);
            console.log("#$!#$$$$$$$$ APONTAMENTOS DIARIOS ", apontamentosResponse);

          } else {

            //buildGraphBar(apontamentosResponse); ////TEM QUE DESCOMENTAR QQ COISA SOBRE O GRAFICO
            console.log("#$!@!$@!$!@$@! TESTE !@#!%!@%!%% apontamentos SEMANAIS: ", response.data);
          }

        }, function errorCallback(response){
          
          $errorMsg = response.data.message;
          //////console.log("Erro ao obter apontamentos por um range de data e equipe");

        });
      }
    };

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

    function createSeriesGraphic(apontamento) {

      //////console.log("apontamento: ", apontamento);
    };

    function addOrSubtractDays(date, value) {
          
      date = angular.copy(date);
      date.setHours(0,0,0,0);

      return new Date(date.getTime() + (value*864e5));
    }

    function buildGraphBar(apontamentosSemanais) {
      buildBarGraphLabels();
      //console.log("$scope.weekLabels", $scope.weekLabels);
      buildBarGraphData(apontamentosSemanais);
    }

    function buildBarGraphLabels() {

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

    function init(){
    
      $scope.currentWeek = {//fica variando a medida que o usuario navega
        begin: addOrSubtractDays($scope.currentDate, -7),
        end: addOrSubtractDays($scope.currentDate, -1)
      };
      $scope.currentWeekFtd = {
        begin: $filter('date')($scope.currentWeek.begin, 'abvFullDate1'),
        end: $filter('date')($scope.currentWeek.end, 'abvFullDate1')
      };
      //////console.log("current date ficou assim: ", $scope.currentDate);
     
      // $scope.weekSeries = ['Saldo'];
      // $scope.weekOptions = {
      //   scales: {
      //     xAxes: [{
      //       position: 'top'
      //     }]        
      //   }
      // };

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
            $scope.liberado =true;
          }
      }
    };

    init();
  }

  function amChartConfig(baConfigProvider) {
    var layoutColors = baConfigProvider.colors;
    AmCharts.themes.blur = {

      themeName: "blur",

      AmChart: {
        color: layoutColors.defaultText,
        backgroundColor: "#FFFFFF"
      },

      AmCoordinateChart: {
        colors: [layoutColors.primary, layoutColors.danger, layoutColors.warning, layoutColors.success, layoutColors.info, layoutColors.primaryDark, layoutColors.warningLight, layoutColors.successDark, layoutColors.successLight, layoutColors.primaryLight, layoutColors.warningDark]
      },

      AmStockChart: {
        colors: [layoutColors.primary, layoutColors.danger, layoutColors.warning, layoutColors.success, layoutColors.info, layoutColors.primaryDark, layoutColors.warningLight, layoutColors.successDark, layoutColors.successLight, layoutColors.primaryLight, layoutColors.warningDark]
      },

      AmSlicedChart: {
        colors: [layoutColors.primary, layoutColors.danger, layoutColors.warning, layoutColors.success, layoutColors.info, layoutColors.primaryDark, layoutColors.warningLight, layoutColors.successDark, layoutColors.successLight, layoutColors.primaryLight, layoutColors.warningDark],
        labelTickColor: "#FFFFFF",
        labelTickAlpha: 0.3
      },

      AmRectangularChart: {
        zoomOutButtonColor: '#FFFFFF',
        zoomOutButtonRollOverAlpha: 0.15,
        zoomOutButtonImage: "lens.png"
      },

      AxisBase: {
        axisColor: "#FFFFFF",
        axisAlpha: 0.3,
        gridAlpha: 0.1,
        gridColor: "#FFFFFF"
      },

      ChartScrollbar: {
        backgroundColor: "#FFFFFF",
        backgroundAlpha: 0.12,
        graphFillAlpha: 0.5,
        graphLineAlpha: 0,
        selectedBackgroundColor: "#FFFFFF",
        selectedBackgroundAlpha: 0.4,
        gridAlpha: 0.15
      },

      ChartCursor: {
        cursorColor: layoutColors.primary,
        color: "#FFFFFF",
        cursorAlpha: 0.5
      },

      AmLegend: {
        color: "#FFFFFF"
      },

      AmGraph: {
        lineAlpha: 0.9
      },
      GaugeArrow: {
        color: "#FFFFFF",
        alpha: 0.8,
        nailAlpha: 0,
        innerRadius: "40%",
        nailRadius: 15,
        startWidth: 15,
        borderAlpha: 0.8,
        nailBorderAlpha: 0
      },

      GaugeAxis: {
        tickColor: "#FFFFFF",
        tickAlpha: 1,
        tickLength: 15,
        minorTickLength: 8,
        axisThickness: 3,
        axisColor: '#FFFFFF',
        axisAlpha: 1,
        bandAlpha: 0.8
      },

      TrendLine: {
        lineColor: layoutColors.danger,
        lineAlpha: 0.8
      },

      // ammap
      AreasSettings: {
        alpha: 0.8,
        color: layoutColors.info,
        colorSolid: layoutColors.primaryDark,
        unlistedAreasAlpha: 0.4,
        unlistedAreasColor: "#FFFFFF",
        outlineColor: "#FFFFFF",
        outlineAlpha: 0.5,
        outlineThickness: 0.5,
        rollOverColor: layoutColors.primary,
        rollOverOutlineColor: "#FFFFFF",
        selectedOutlineColor: "#FFFFFF",
        selectedColor: "#f15135",
        unlistedAreasOutlineColor: "#FFFFFF",
        unlistedAreasOutlineAlpha: 0.5
      },

      LinesSettings: {
        color: "#FFFFFF",
        alpha: 0.8
      },

      ImagesSettings: {
        alpha: 0.8,
        labelColor: "#FFFFFF",
        color: "#FFFFFF",
        labelRollOverColor: layoutColors.primaryDark
      },

      ZoomControl: {
        buttonFillAlpha: 0.8,
        buttonIconColor: layoutColors.defaultText,
        buttonRollOverColor: layoutColors.danger,
        buttonFillColor: layoutColors.primaryDark,
        buttonBorderColor: layoutColors.primaryDark,
        buttonBorderAlpha: 0,
        buttonCornerRadius: 0,
        gridColor: "#FFFFFF",
        gridBackgroundColor: "#FFFFFF",
        buttonIconAlpha: 0.6,
        gridAlpha: 0.6,
        buttonSize: 20
      },

      SmallMap: {
        mapColor: "#000000",
        rectangleColor: layoutColors.danger,
        backgroundColor: "#FFFFFF",
        backgroundAlpha: 0.7,
        borderThickness: 1,
        borderAlpha: 0.8
      },

      // the defaults below are set using CSS syntax, you can use any existing css property
      // if you don't use Stock chart, you can delete lines below
      PeriodSelector: {
        color: "#FFFFFF"
      },

      PeriodButton: {
        color: "#FFFFFF",
        background: "transparent",
        opacity: 0.7,
        border: "1px solid rgba(0, 0, 0, .3)",
        MozBorderRadius: "5px",
        borderRadius: "5px",
        margin: "1px",
        outline: "none",
        boxSizing: "border-box"
      },

      PeriodButtonSelected: {
        color: "#FFFFFF",
        backgroundColor: "#b9cdf5",
        border: "1px solid rgba(0, 0, 0, .3)",
        MozBorderRadius: "5px",
        borderRadius: "5px",
        margin: "1px",
        outline: "none",
        opacity: 1,
        boxSizing: "border-box"
      },

      PeriodInputField: {
        color: "#FFFFFF",
        background: "transparent",
        border: "1px solid rgba(0, 0, 0, .3)",
        outline: "none"
      },

      DataSetSelector: {
        color: "#FFFFFF",
        selectedBackgroundColor: "#b9cdf5",
        rollOverBackgroundColor: "#a8b0e4"
      },

      DataSetCompareList: {
        color: "#FFFFFF",
        lineHeight: "100%",
        boxSizing: "initial",
        webkitBoxSizing: "initial",
        border: "1px solid rgba(0, 0, 0, .3)"
      },

      DataSetSelect: {
        border: "1px solid rgba(0, 0, 0, .3)",
        outline: "none"
      }

    };
  }

})();
