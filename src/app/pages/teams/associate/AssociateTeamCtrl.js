/**
 * @author Gilliard Lopes
 * created on 01/05/2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.teams')
      .controller('AssociateTeamCtrl', AssociateTeamCtrl);

  /** @ngInject */
  function AssociateTeamCtrl($scope, $filter, $state, $window, teamAPI, equipe, funcionarios) {

    console.log("dentro do AssociateTeamCtrl!");
    var funcSel = {};
    $scope.arrayComponentes = angular.copy(equipe.data.componentes);
    $scope.equipe = equipe.data;
    $scope.employees = funcionarios.data;
    $scope.funcionario = {};
    $scope.employeesNames = []; //Auxiliar para o AutoComplete do Input do nome do funcionario
    $scope.smartTablePageSize = 10;


    Array.prototype.diff = function (a) {
      return this.filter(function (i) {
          return a.indexOf(i) === -1;
      });
     };

    console.log('$scope.equipe', $scope.equipe);
    //console.log('$scope.employees ', $scope.employees.length);

    $scope.search = function() {

      if (!$scope.funcionario.selected){
        
        alert('Por favor, preencha o campo com o nome do funcionário.');

      } else {
        
        funcSel = searchEmployee($scope.funcionario.selected.id, $scope.employees);
        console.log ("apenas carregar as informações do funcionário...");
      }
    };

    $scope.localAssociate = function(){
      var hasFunc = false;
      console.log("Faz o tratamento local para dizer que o funcionário vai ser associado", $scope.funcionario.selected);
      if ($scope.funcionario.selected){
        for (var i = 0; i < $scope.arrayComponentes.length; i++) {
          if ($scope.funcionario.selected.matricula == $scope.arrayComponentes[i].matricula){
            hasFunc = true;
            break;
          }
        }
        if (!hasFunc) {
          $scope.arrayComponentes.push($scope.funcionario.selected);
        }
      }
    };

    $scope.deletar = function(index){
      console.log("elemento: " , $scope.arrayComponentes[index]);      
      $scope.arrayComponentes.splice(index, 1);
    }; 

    $scope.associar = function () {

      // Obtendo funcionários selecionados
      // var selectedWorkers = $scope.employees.filter(function(funcionario){
      //   return funcionario.selected;
      // });

      // console.log("selectedWorkers", selectedWorkers);
      // var _componentes = selectedWorkers.map(function(componente){
      //   return componente._id;
      // });

      // var _PISes = selectedWorkers.map(function(componente){
      //   return componente.PIS;
      // });

      // var _oldPISes = $scope.equipe.componentes.map(function(worker){
      //   return worker.PIS;
      // });

      //console.log("Componentes antes do envio: ", _oldPISes);
      console.log("Componentes para envio: ", $scope.arrayComponentes);
      //var diffComps = _PISes.diff(_oldPISes);
      //console.log('vai enviar: ', diffComps);
      teamAPI.atualizarComponentes($scope.equipe._id, $scope.arrayComponentes).then(function sucessCallback(response){

        $scope.successMsg = response.data.message;
        console.log(response.data);
        // if (diffComps.length > 0){
        //   var objToSend = {empIds: _componentes, arrayPIS: diffComps};
        //   // console.log('vai enviar esses pra buscar: ', notAssociatedsPrev);
        //   teamAPI.searchAndUpdateApps($scope.equipe._id, objToSend).then(function sucessCallback(response){

        //     console.log('cadastro assincrono dos apontamentos anteriores dos funcionários efetuado com sucesso!');

        //   }, function errorCallback(response){

        //     console.log('falhou a atualização dos componentes em seus apontamentos anteriores');

        //   });
        // }

        $state.go('teams.list');
      
      }, function errorCallback(response){
          
        $scope.errorMsg = response.data.message;
        $window.scrollTo(0,0);
        console.log("Erro de registro: " + response.data.message);
          
      });     
    };

    $scope.setSelected = function (funcionario) {
        console.log("setSelected ", funcionario.nome);
        funcionario.selected = !funcionario.selected;
    };

    function searchEmployee(nameKey, myArray){
      for (var i=0; i < myArray.length; i++) {
        if (myArray[i]._id === nameKey) {
            return myArray[i];
        }
      }
    };

    function fillEmployees() {

      var cargoTemp;
      var activeTemp;
      for (var j=0; j<$scope.employees.length; j++) {
        //console.log('C: ', $scope.equipes);
        cargoTemp = $scope.employees[j].sexoMasculino ? $scope.employees[j].alocacao.cargo.especificacao : $scope.employees[j].alocacao.cargo.nomeFeminino;                
        activeTemp = $scope.employees[j].active ? "ATIVO" : "DEMITIDO";
        $scope.employeesNames.push( { 
          _id: $scope.employees[j]._id, 
          nome: $scope.employees[j].nome,
          sobrenome: $scope.employees[j].sobrenome,
          alocacao: {
            cargo: {especificacao: cargoTemp},
            turno: {descricao: $scope.employees[j].alocacao.turno.descricao}
          },
          name: $scope.employees[j].nome + ' ' + $scope.employees[j].sobrenome,
          matricula: $scope.employees[j].matricula,
          PIS: $scope.employees[j].PIS,
          ativo: $scope.employees[j].active,
          cbNameMatr: $scope.employees[j].nome + ' ' + $scope.employees[j].sobrenome + ', ' + 
          $scope.employees[j].matricula + '(' + $scope.equipe.nome + ' - '+ cargoTemp +')' + '; Status: ' + activeTemp,
          cargo: cargoTemp
        });
      }

    };

    function checkAssociation () {

      console.log("verificando os componentes da equipe...");
      $scope.equipe.componentes.forEach(function(componente){
         
        $scope.employees.some(function(funcionario){

          if (funcionario._id === componente._id){
            funcionario.selected = true;
          }

          return funcionario._id === componente._id;
        });
      });
    };

    function init(){
      fillEmployees();
      //checkAssociation();
    };

    init();
        
  }

})();
