/**
 * @author Gilliard Lopes
 * created on 22.04.2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.employees')
    .controller('EmployeeListCtrl', EmployeeListCtrl)
    .controller('ModalDeleteEmployeeCtrl', ModalDeleteEmployeeCtrl)
    .controller('ModalDemitirEmployeeCtrl', ModalDemitirEmployeeCtrl)
    .controller('ModalAssociateCtrl', ModalAssociateCtrl);

  /** @ngInject */
  function EmployeeListCtrl($scope, $state, $stateParams, $uibModal, Auth, employeeAPI, roleAPI, funcionarios) {
    //var vm = this;
    //vm.messages = mailMessages.getMessagesByLabel($stateParams.label);
    //vm.label = $stateParams.label;}
    var currentUserLevel = Auth.getUserLevel();
    console.log('funcionarios - List controller');
    $scope.smartTablePageSize = 10;
    console.log('funcionarios pelo Resolve: ', funcionarios);
    var pageAssociatePath = 'app/pages/employees/list/associateModal.html';
    var pageDeletePath = 'app/pages/employees/list/deleteModal.html';
    var pageDemitirPath = 'app/pages/employees/list/demitirModal.html';
    var defaultSize = 'md';

    if (!funcionarios)
      alert('Houve um problema de captura das informações no banco de dados');
    else
      $scope.funcionarios = funcionarios.data;

    $scope.delete = function (id, index) {

      var modalInstance = $uibModal.open({
        animation: true,
        templateUrl: pageDeletePath,
        size: defaultSize,
        controller: 'ModalDeleteEmployeeCtrl',
        resolve: {
          funcionario: function (employeeAPI) {
            return employeeAPI.getFuncionario(id);
          }
        }
      });

      modalInstance.result.then(function (confirmation) {
        console.log('confirmação: ', confirmation);
        if (confirmation){
          $state.reload();
        }
      }, function () {
        console.log('modal-component dismissed at: ' + new Date());
      });
    };

    $scope.demitir = function (id, index) {

      var modalInstance = $uibModal.open({
        animation: true,
        templateUrl: pageDemitirPath,
        size: defaultSize,
        controller: 'ModalDemitirEmployeeCtrl',
        resolve: {
          funcionario: function (employeeAPI) {
            return employeeAPI.getFuncionario(id);
          }
        }
      });

      modalInstance.result.then(function (confirmation) {
        console.log('confirmação: ', confirmation);
        if (confirmation){
          $state.reload();
        }
      }, function () {
        console.log('modal-component dismissed at: ' + new Date());
      });
    };

    $scope.associate = function(id) {

      var modalInstance = $uibModal.open({
        animation: true,
        templateUrl: pageAssociatePath,
        size: defaultSize,
        controller: 'ModalAssociateCtrl',
        resolve: {
          funcionario: function (employeeAPI) {
            return employeeAPI.getFuncionario(id);
          },
          perfis: function (roleAPI) {
            return roleAPI.getPerfisByLevel(currentUserLevel);//substituiu o get
          },
          usuario: function (employeeAPI) {
            return employeeAPI.getUsuarioByFuncionario(id);
          }
        }
      });

      modalInstance.result.then(function (confirmation) {
        console.log('confirmação: ', confirmation);
        if (confirmation){
          //$state.reload();
        }
      }, function () {
        console.log('modal-component dismissed at: ' + new Date());
      });
    }
  };

  function ModalDeleteEmployeeCtrl ($uibModalInstance, $scope, funcionario, employeeAPI) {

    console.log('funcionario, ', funcionario);
    $scope.funcionario = funcionario.data;
    var $ctrl = this;
    $ctrl.confirmation = true;

    $scope.delete = function(){
      
      console.log('clicou para confirmar o deletar');

      employeeAPI.delete($scope.funcionario._id).then(function sucessCallback(response){

        console.log('deletou?', response.data);
        $scope.successMsg = response.data.message;
        console.log('msg: ', $scope.successMsg);
        $uibModalInstance.close($ctrl.confirmation);

        }, function errorCallback(response){

          console.log('erro ao deletar ', response.data.message);
          $scope.errorMsg = response.data.message;
      });
    }
  };

  function ModalDemitirEmployeeCtrl ($uibModalInstance, $scope, funcionario, usersAPI, employeeAPI) {

    console.log('funcionario, ', funcionario);
    $scope.funcionario = funcionario.data;
    var $ctrl = this;
    $ctrl.confirmation = true;

    $scope.demitir = function(){
      
      console.log('clicou para confirmar a demissão');
      //proceedUpdateFunc();

      usersAPI.unregister($scope.funcionario).then(function sucessCallback(response){

        console.log('UnRegister?', response.data);
        $scope.successMsg = response.data.message;
        console.log('msg: ', $scope.successMsg);
        proceedUpdateFunc();
        //$uibModalInstance.close($ctrl.confirmation);

        }, function errorCallback(response){

          console.log('erro ao deletar ', response.data.message);
          $scope.errorMsg = response.data.message;
      });
    }

    function proceedUpdateFunc() {

      $scope.funcionario.active = false;
      $scope.funcionario.historico.datasAdmissao.push($scope.funcionario.alocacao.dataAdmissao);
      $scope.funcionario.historico.datasDemissao.push(new Date());

      employeeAPI.update($scope.funcionario).then(function sucessCallback(response){

        console.log('deletou?', response.data);
        $scope.successMsg = response.data.message;
        console.log('msg: ', $scope.successMsg);
        $uibModalInstance.close($ctrl.confirmation);

        }, function errorCallback(response){

          console.log('erro ao deletar ', response.data.message);
          $scope.errorMsg = response.data.message;
      });
    };
  };

  function ModalAssociateCtrl ($uibModalInstance, $scope, funcionario, usuario, perfis, usersAPI) {

    console.log('funcionario, ', funcionario.data);
    console.log('usuario', usuario.data);
    console.log('perfis: ', perfis.data);
    $scope.funcionario = funcionario.data;
    $scope.perfis = perfis.data;
    $scope.user = usuario.data;
    $scope.isAssociated = false;
    $scope.selectedNivel;   

    var $ctrl = this;
    $ctrl.confirmation = true;

    $scope.associar = function(user){
      
      console.log('clicou para associar', user);
      console.log('selectedNivel: ', $scope.selectedNivel);
      user.firstAccess = true;
      user.perfil = $scope.selectedNivel.item;
      user.funcionario = $scope.funcionario._id;

      if (user.senha == user.confirmaSenha) {//tirar daqui o quanto antes...

        usersAPI.register(user).then(function sucessCallback(response){

          console.log('associou??', response.data);
          $scope.successMsg = response.data.message;
          console.log('msg: ', $scope.successMsg);
          $uibModalInstance.close($ctrl.confirmation);

          }, function errorCallback(response){

            console.log('erro ao deletar ', response.data.message);
            $scope.errorMsg = response.data.message;
        });

      } else {
        $scope.errorMsg = 'Senha e confirmação devem ser iguais';
      }
    };

    function checkPerfil(perfil) {

      return $scope.user.perfil._id == perfil._id;
    };

    function init(){

      if ($scope.perfis.length > 0){

        if ($scope.user) {
          $scope.isAssociated = true;
          $scope.selectedNivel = { item: $scope.perfis[$scope.perfis.findIndex(checkPerfil)] };
        } else {

          $scope.selectedNivel = {item: $scope.perfis[0]};           
          $scope.user = { //inicializa
            email: $scope.funcionario.email
          }    
        }

      } else {

        console.log('não há perfis disponíveis');
      }
      
    };

    init();

  };

})();
