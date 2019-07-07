/**
 * @author Gilliard Lopes
 * created on 04/12/2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.testes')
      .controller('TestesCtrl', TestesCtrl);

  /** @ngInject */
  function TestesCtrl($scope, $filter, $location, $state, $interval, appointmentAPI, employeeAPI, myhitpointAPI, util, utilReports, Auth, usuario, solicitacaoAjustes){//, rawAppoints) {

    //console.log("dentro do EstatisticasCtrl, USUARIO: ", usuario);
    //$scope.funcionario = usuario.data.funcionario;
    //console.log('Funcionário: ', $scope.funcionario);
    
    $scope.solicitacaoAjustes = solicitacaoAjustes.data;
    var count = 0;

    init();
    
    $scope.make = function(index){

      var dateAux = new Date();
      var endDateAux = new Date();      

      var objDateWorker = {};     

      // for (var i=0; i<$scope.solicitacaoAjustes.length; i++){
        
      var currentSAJ = $scope.solicitacaoAjustes[index];
      
      dateAux = new Date(currentSAJ.data);
      objDateWorker = {
        date: {
          year: dateAux.getFullYear(),
          month: dateAux.getMonth(),
          day: dateAux.getDate(),
          hour: dateAux.getHours(),
          minute: dateAux.getMinutes()            
        },
        funcionario: currentSAJ.funcionario,
        eventoAbono: currentSAJ.eventoAbono
      };

      if (currentSAJ.dataFinal){
        endDateAux = new Date(currentSAJ.dataFinal);
        objDateWorker.date.final = {
            year: endDateAux.getFullYear(),
            month: endDateAux.getMonth(),
            day: endDateAux.getDate(),
            hour: endDateAux.getHours(),
            minute: endDateAux.getMinutes()
          }
      }

      appointmentAPI.updateTestes(objDateWorker).then(function successCallback(response){
        
        console.log("Retorno do update: ", response.data.message);
        $scope.solicitacaoAjustes[index].destak = true;

      }, function errorCallback(response){
        
        console.log("Erro ao obter apontamentos por um range de data e equipe");
      });

      // }

    };

    function getId (array) {
      return (array.length + 1);
    };

    function init () {

    };
  }   

})();
