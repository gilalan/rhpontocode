/**
 * @author Gilliard Lopes
 * created on 22.04.2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.solicitations')
    .controller('SolicitationListCtrl', SolicitationListCtrl)
    .controller('ModalShowSolicitationCtrl', ModalShowSolicitationCtrl);
    //.controller('ModalDeleteSolicitationCtrl', ModalDeleteSolicitationCtrl)
    //.controller('ModalAssociateCtrl', ModalAssociateCtrl);

  /** @ngInject */
  function SolicitationListCtrl($scope, $state, $stateParams, $filter, $uibModal, Auth, solicitationAPI, solicitacoes) {
    
    $scope.smartTablePageSize = 10;
    $scope.solicitacoes = solicitacoes.data;
    // console.log('List Ctrl - SolicitationListCtrl');
    // console.log('solicitacoes: ', solicitacoes.data);
    var pageShowSolicitationPath = 'app/pages/solicitations/modals/verSolicitacaoModal.html';
    var defaultSize = 'md'; //representa o tamanho da Modal

    $scope.ver = function (solicitationId) {

      console.log('ID de Solicitação: ', solicitationId);
      var solicitation = getSolicitationFromId(solicitationId, $scope.solicitacoes);
      solicitation.dataFtd = $filter('date')(solicitation.data, 'abvFullDate');
      setPrettyHorario(solicitation);
      showSolicitation(pageShowSolicitationPath, defaultSize, solicitation);
    }

    function setPrettyHorario(solicitation) {

      var arrayAnterior = solicitation.anterior.marcacoes;
      var arrayProposto = solicitation.proposto.marcacoes;

      for (var i=0; i<arrayAnterior.length; i++){
        arrayAnterior[i].horarioFtd = adjustHorario(arrayAnterior[i].hora, arrayAnterior[i].minuto);
      }

      for (var i=0; i<arrayProposto.length; i++){
        arrayProposto[i].horarioFtd = adjustHorario(arrayProposto[i].hora, arrayProposto[i].minuto);
      }

    };

    function adjustHorario(hoursP, minutesP) {

      var hours = parseInt(hoursP);
      var minutes = parseInt(minutesP);
      var hoursStr = "";
      var minutesStr = "";

      hoursStr = (hours >= 0 && hours <= 9) ? "0"+hours : ""+hours;           
      minutesStr = (minutes >= 0 && minutes <= 9) ? "0"+minutes : ""+minutes;

      return hoursStr + ":" + minutesStr;

    };

    function showSolicitation(page, size, solicitation) {
    
      var objBatidasDiaria = {
        data: solicitation.dataFtd,
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

    function getSolicitationFromId(nameKey, myArray) {
      for (var i=0; i < myArray.length; i++) {
        if (myArray[i]._id === nameKey) {
            return myArray[i];
        }
      }
    };

  };

  function ModalShowSolicitationCtrl($uibModalInstance, $scope, objBatidasDiaria){
    
    console.log('objBatidasDiaria: ', objBatidasDiaria);
    $scope.objBatidasDiaria = objBatidasDiaria;
    
  };

})();
