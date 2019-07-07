/**
 * @author Gilliard Lopes
 * created on 03.06.2019
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.abono')
      .controller('AbonoMgmtCtrl', AbonoMgmtCtrl)
      .controller('ConfirmationExclusaoAbonoCtrl', ConfirmationExclusaoAbonoCtrl);

  /** @ngInject */
  function AbonoMgmtCtrl($scope, $filter, $state, $uibModal, $timeout, util, Auth, employeeAPI, appointmentAPI, teamAPI, usuario, allEquipes) {

    var Usuario = usuario.data;
    var currentUser = Auth.getCurrentUser();
    var equipe = {};

    $scope.employees = [];
    $scope.employeesNames = [];
    $scope.saveFlag = false; 

    $scope.funcionario = {};
    $scope.funcionarioOficial = {};
    
    var pageConfirmationPath = 'app/pages/ajuste_abono/modals/confirmationExclusaoModal.html';
    var defaultSize = 'md'; //representa o tamanho da Modal

    $scope.meses = [{_id: 0, nome: 'Janeiro'}, {_id: 1, nome: 'Fevereiro'},
      {_id: 2, nome: 'Março'},{_id: 3,nome: 'Abril'},{_id: 4,nome: 'Maio'},
      {_id: 5,nome: 'Junho'},{_id: 6,nome: 'Julho'},{_id: 7,nome: 'Agosto'},
      {_id: 8,nome: 'Setembro'},{_id: 9,nome: 'Outubro'},{_id: 10,nome: 'Novembro'},
      {_id: 11,nome: 'Dezembro'}];

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
      _getAbonosFromFunc($scope.funcionarioOficial);
    };

    $scope.isEmptyFunc = function(){
      
      //console.log('is Empty func?');
      if (!$scope.funcionario.selected || $scope.funcionario.selected == ""){
        $scope.infoHorario = "";
        return true;
      }
      return false;
    };

    $scope.delete = function(index, ano, mes){

      if (!ano && !mes) {//deleção de array
        console.log($scope.apontamentosArray[index]);
        //$scope.apontamentosArray.splice(index, 1); //remove de fato do array...
        $scope.apontamentosArray[index].removed = true;
      } else {
        //console.log($scope.apontamentosArray[index]);
        //$scope.yearMonthMap[ano][mes].splice(index, 1); //remove de fato do array...
        $scope.yearMonthMap[ano][mes][index].removed = true;
      }
    };    

    $scope.readd = function(index, ano, mes){

      if (!ano && !mes) {//deleção de array
        console.log($scope.apontamentosArray[index]);
        //$scope.apontamentosArray.splice(index, 1); //remove de fato do array...
        $scope.apontamentosArray[index].removed = false;
      } else {
        //console.log($scope.yearMonthMap[ano][mes]);
        //$scope.yearMonthMap[ano][mes].splice(index, 1); //remove de fato do array...
        $scope.yearMonthMap[ano][mes][index].removed = false;
      }
    };

    $scope.salvar = function(){

      var apontamentosToSend = [];
      if ($scope.apontamentosArray && !$scope.yearMonthMap){
        for(var i=0; i<$scope.apontamentosArray.length; i++){
          if($scope.apontamentosArray[i].removed)
            apontamentosToSend.push($scope.apontamentosArray[i]);
        }
      }

      if ($scope.yearMonthMap && !$scope.apontamentosArray){
        for (var year in $scope.yearMonthMap){
          for (var month in $scope.yearMonthMap[year]){
            for(var i=0; i<$scope.yearMonthMap[year][month].length; i++){
              if($scope.yearMonthMap[year][month][i].removed)
                apontamentosToSend.push($scope.yearMonthMap[year][month][i]);
            }
          }
        }
      }

      console.log("Apontamentos enviados: ", apontamentosToSend);

      appointmentAPI.deleteMany(apontamentosToSend).then(function successCallback(response){
        
        var resp = response.data.message;
        $state.reload();

      }, function errorCallback(response){
        
        $errorMsg = response.data.message;
        console.log("Erro ao salvar alterações no servidor: ", response.data.message);
      });
    };
    
    function _getAbonosFromFunc(funcionario){

      appointmentAPI.getAbonosFromFunc(funcionario).then(function successCallback(response){
        
        var apontamentosResponse = response.data;
        console.log("!@# Apontamentos Recebidos: ", apontamentosResponse);
        if (apontamentosResponse.length){ //veio um array
          
          _navigateArray(apontamentosResponse);

        } else { //veio um objeto KeyMap

          _navigateMap(apontamentosResponse);
        }

      }, function errorCallback(response){
        
        $errorMsg = response.data.message;
        ////console.log("Erro ao obter apontamentos por um range de data e equipe");
      });

    };

    function _navigateArray(apontamentosArray){

      $scope.yearMonthMap = undefined;
      $scope.apontamentosArray = apontamentosArray;
      $scope.saveFlag = true;      
    };

    function _navigateMap(apontamentosMap){

      $scope.apontamentosArray = undefined;
      $scope.yearMonthMap = apontamentosMap;
      $scope.saveFlag = true;
    };
    
    function hideAppointErrorMsg(seconds){
      $scope.invalidAppointMsg = null;
    };

    //seria bom mostrar telinha confirmando as alterações...
    function openConfirmaExclusao(solicitacaoAjuste) {
      
      var modalInstance = $uibModal.open({
        animation: true,
        templateUrl: pageConfirmationPath,
        size: defaultSize,
        controller: 'ConfirmationExclusaoAbonoCtrl',
        resolve: {
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

  function ConfirmationExclusaoAbonoCtrl($uibModalInstance, $scope, $state, $filter, util, employeeAPI){
    
    
    

  };


})();
