/**
 * @author Gilliard Lopes
 * created on 17.05.2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.myhitpoint')
      .controller('PointAdjustCtrl', PointAdjustCtrl);

  /** @ngInject */
  function PointAdjustCtrl($scope, $filter, $state, myhitpointAPI, apontamento, dataSolicitada, funcionario, arrayES) {

    $scope.apontamento = apontamento.data;
    $scope.dataSolicitada = new Date(dataSolicitada);
    $scope.dataSolicitadaFtd = $filter('date')($scope.dataSolicitada, 'abvFullDate');
    var arrayESOriginal = angular.copy(arrayES);
    $scope.arrayES = arrayES;
    $scope.batidaError = (arrayES.length % 2 == 0) ? false : true;
    $scope.numerosErro = false;
    $scope.horaErro = false;
    $scope.minutoErro = false;
    var funcionario = funcionario;

    console.log("dentro do PointAdjustCtrl! Apontamento: ", apontamento.data);
    console.log("dentro do PointAdjustCtrl! dataSolicitada: ", dataSolicitada);
    console.log("dentro do PointAdjustCtrl! funcionario: ", funcionario);
    console.log('arrayES ? ', $scope.arrayES);


    if (apontamento.data){
      console.log('tem apontamento!');
    } else {
      console.log('Não possui apontamento!');
    }

    Array.prototype.insert = function ( index, item ) {
      console.log('item? ', item);
      console.log('index? ', index);
      this.splice( index, 0, item );
    };

    $scope.adicionarAntes = function(){
      
      reordenarBatidas(0, true);
      $scope.arrayES.insert(0, {descricao: "Entrada 1", horario: "08:00"});
      checkErrors();
      console.log('arrayES Original: ', arrayESOriginal);
      console.log('arrayES Modificado: ', $scope.arrayES);
    };

    $scope.desfazer = function() {
      
      console.log('desfazer normal');
      $scope.arrayES = angular.copy(arrayESOriginal);
      checkErrors();
    };

    $scope.addDepois = function(index){
      
      console.log('add depois desse índice: ', index);
      console.log('descricao atual: ', $scope.arrayES[index].descricao);
      var descricaoProximaBatida = getProximaBatida($scope.arrayES[index].descricao);
      var horarioProximaBatida = $scope.arrayES[index].horario;
      console.log('próxima batida a ser adicionada: ', descricaoProximaBatida);
      
      if (index == $scope.arrayES.length - 1)
        $scope.arrayES.push({descricao: descricaoProximaBatida, horario: horarioProximaBatida});      
      else {
        reordenarBatidas(index+1, true);
        $scope.arrayES.insert(index+1, {descricao: descricaoProximaBatida, horario: horarioProximaBatida});
      }

      checkErrors();
    };

    $scope.delete = function(index){
      console.log('desconsiderar esse item: ', $scope.arrayES[index].descricao);
      reordenarBatidas(index, false);
      $scope.arrayES.splice(index, 1);
      checkErrors();
    };

    /*
    ** Os novos itens apenas terão 'descricao' e 'horario' como atributos
    ** os horários originais que aqui chegaram terão atributos como rDescricao, hora, minuto, tzOffset, RHWeb, REP
    */
    $scope.propor = function(ajuste){
      
      console.log('motivo da solicitação: ', ajuste.motivo);
      var marcacoesAnteriores = [];
      var marcacoesPropostas = [];

      for (var j=0; j<arrayESOriginal.length; j++){

        marcacoesAnteriores.push(arrayESOriginal[j]);
        marcacoesAnteriores[j].descricao = arrayESOriginal[j].rDescricao;
      }

      for (var i=0; i<$scope.arrayES.length; i++){

        marcacoesPropostas.push(ajustarItemMarcacao(i, $scope.arrayES[i]));
      }

      var solicitacaoAjuste = {
        data: $scope.dataSolicitada,
        funcionario: funcionario._id,
        status: 0, //pendente (-1 é reprovada) e (1 é aprovada)
        motivo: ajuste.motivo,
        anterior: {
          marcacoes: marcacoesAnteriores
        },
        proposto: {
          marcacoes: marcacoesPropostas
        }
      };
      
      createSolicitacaoAjuste(solicitacaoAjuste);      
    };

    function checkErrors(){

      $scope.batidaError = ($scope.arrayES.length % 2 == 0) ? false : true;
      checkHorariosErrors();
    }

    /*
    ** Reordena as batidas a partir de um determinado índice
    ** flag = true (adição de item) , false (remoção de item)
    */
    function reordenarBatidas(index, flag){

      var strDescricao = "";
      if (flag){
        
        for (var i=index; i<$scope.arrayES.length; i++){
          strDescricao = "";
          strDescricao = $scope.arrayES[i].descricao;
          $scope.arrayES[i].descricao = getProximaBatida(strDescricao, flag);
        }

      } else {

        for (var i=$scope.arrayES.length-1; i>index; i--){

          $scope.arrayES[i].descricao = $scope.arrayES[i-1].descricao;
        }
      }
      console.log('terminou o reordenarBatidas');
    };

    /*
    ** Retorna a próxima batida em relação ao índice passado no argumento
    */
    function getProximaBatida(descricaoItemAtual) {
      
      var mapObj = {
        Entrada: "Saída ",
        Saída: "Entrada "
      };      
      var arrayTextoNumero = descricaoItemAtual.split(" ");
      var texto = arrayTextoNumero[0];
      var numero = arrayTextoNumero[1];
      return texto.replace(/Entrada|Saída/gi, function(matched){return mapObj[matched]}) + (texto=="Entrada" ? numero : ++numero);
    };

    /*
    ** Verifica se há erros nos horários
    */
    function checkHorariosErrors(){

      var strHorario = "";
      var arraySplitHorario = [];
      var flagNumbersQty = false; //as 3 flags indicam erro em cada categoria
      var flagHorasFtd = false;
      var flagMinutesFtd = false;
      var auxHora = null;
      var auxMnt = null;

      for (var i=0; i<$scope.arrayES.length; i++){
        strHorario = "";
        strHorario = $scope.arrayES[i].horario;
        if (strHorario.length < 4){
          
          flagNumbersQty = true;

        } else {
          
          arraySplitHorario = strHorario.split(':');
          if (arraySplitHorario.length > 1){ //caso que a string vem no formato correto "08:00"
            
            auxHora = parseInt(arraySplitHorario[0]);
            auxMnt = parseInt(arraySplitHorario[1]);

          } else { //caso que a string vem no formato "0800" por conta da UI-MASK

            auxHora = parseInt(arraySplitHorario[0].charAt(0).concat(arraySplitHorario[0].charAt(1)));
            auxMnt = parseInt(arraySplitHorario[0].charAt(2).concat(arraySplitHorario[0].charAt(3)));
          }
          if (!auxHora || (auxHora < 0 || auxHora > 23))              
            $scope.flagHorasFtd = true;//horas incorretas
          if (!auxMnt || (auxMnt < 0 || auxMnt > 59))
            $scope.flagMinutesFtd = true;//minutos incorretos
        }
      }

      $scope.numerosErro = flagNumbersQty;
      $scope.horaErro = flagHorasFtd;
      $scope.minutoErro = flagMinutesFtd;

    };

    function ajustarItemMarcacao(index, item){

      var original = false;
      var mudou = false;
      if (item.id && item.hora && item.minuto) {
        original = true;
        mudou = mudouHorario(item);
      }

      var newDate = new Date();
      var objHoraMinuto = getHoraMinItem(item.horario);
      var newItem = {
        id: index+1,
        descricao: getRawDescription(item.descricao),
        hora: objHoraMinuto.hora,
        minuto: objHoraMinuto.minuto
      };

      if (!original) {        
        
        newItem.segundo = 0;
        newItem.tzOffset = newDate.getTimezoneOffset();
        newItem.RHWeb = false;
        newItem.REP = false;
        newItem.gerada = {
          created_at: newDate
        };

      } else {

        newItem.segundo = item.segundo;
        newItem.tzOffset = item.tzOffset;

        if (mudou) { //original e mudou
          
          newItem.RHWeb = false;
          newItem.REP = false;
          newItem.gerada = {
            created_at: newDate
          };
        } else { //original mas não mudou

          newItem.RHWeb = item.RHWeb;
          newItem.REP = item.REP;
          newItem.gerada = {};
        }
      }

      return newItem;
    };

    //Nos primeiros testes ele não retornou os dados corretos, tem q avaliar melhor...
    function mudouHorario(item){

      var mudou = false;
      for (var i=0; i < arrayESOriginal.length; i++){
        if (item.id == arrayESOriginal[i].id){
          if(item.hora != arrayESOriginal[i].hora || item.minuto != arrayESOriginal[i].minuto){
            mudou = true;
            return mudou;
          }
        }
      }

      return mudou;
    };

    function getRawDescription(description){

      var mapObj = {
        Entrada: "ent",
        Saída: "sai"
      };
      var arraySplit = description.split(" ");
      var strTexto = arraySplit[0];
      var strPosicao = arraySplit[1];
      var rawDescription = strTexto.replace(/Entrada|Saída/gi, function(matched){return mapObj[matched]});
      rawDescription.concat(strPosicao);
      return rawDescription;
    };

    function getHoraMinItem(horario){

      var auxHora = null;
      var auxMnt = null;
      var arraySplitHorario = horario.split(':');
      if (arraySplitHorario.length > 1){ //caso que a string vem no formato correto "08:00"
        
        auxHora = parseInt(arraySplitHorario[0]);
        auxMnt = parseInt(arraySplitHorario[1]);

      } else { //caso que a string vem no formato "0800" por conta da UI-MASK

        auxHora = parseInt(arraySplitHorario[0].charAt(0).concat(arraySplitHorario[0].charAt(1)));
        auxMnt = parseInt(arraySplitHorario[0].charAt(2).concat(arraySplitHorario[0].charAt(3)));
      }
      
      var objHoraMinuto = {
        hora: auxHora,
        minuto: auxMnt
      };

      return objHoraMinuto;
    };

    function createSolicitacaoAjuste(solicitacaoAjuste) {

      myhitpointAPI.create(solicitacaoAjuste).then(function successCallback(response){

        var retorno = response.data;
        console.log("retorno: ", retorno);

      }, function errorCallback(response){
        
        $scope.errorMsg = response.data.message;
        console.log("Erro ao criar solicitação de ajuste.");
      });

    };

  }

})();
