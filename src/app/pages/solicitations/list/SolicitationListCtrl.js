/**
 * @author Gilliard Lopes
 * created on 22.04.2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.solicitations')
    .controller('SolicitationListCtrl', SolicitationListCtrl);
    //.controller('ModalDeleteSolicitationCtrl', ModalDeleteSolicitationCtrl)
    //.controller('ModalAssociateCtrl', ModalAssociateCtrl);

  /** @ngInject */
  function SolicitationListCtrl($scope, $state, $stateParams, $uibModal, Auth, solicitationAPI, solicitacoes) {
    
    $scope.smartTablePageSize = 10;
    $scope.solicitacoes = solicitacoes.data;
    console.log('List Ctrl - SolicitationListCtrl');
    console.log('solicitacoes: ', solicitacoes.data);
  };

})();
