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
    .controller('ModalAssociateCtrl', ModalAssociateCtrl)
    .controller('ModalFeriasCtrl', ModalFeriasCtrl);

  /** @ngInject */
  function EmployeeListCtrl($scope, $state, $stateParams, $uibModal, Auth, employeeAPI, roleAPI, funcionarios) {
    //var vm = this;
    //vm.messages = mailMessages.getMessagesByLabel($stateParams.label);
    //vm.label = $stateParams.label;}
    var currentUserLevel = Auth.getUserLevel();
    var currentUser = Auth.getCurrentUser();
    console.log('funcionarios - List controller');
    $scope.smartTablePageSize = 10;
    console.log('funcionarios pelo Resolve: ', funcionarios);
    var pageAssociatePath = 'app/pages/employees/list/associateModal.html';
    var pageDeletePath = 'app/pages/employees/list/deleteModal.html';
    var pageDemitirPath = 'app/pages/employees/list/demitirModal.html';
    var pageFeriasPath = 'app/pages/employees/list/feriasModal.html';
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

    $scope.feriar = function (id) {

      var modalInstance = $uibModal.open({
        animation: true,
        templateUrl: pageFeriasPath,
        size: defaultSize,
        controller: 'ModalFeriasCtrl',
        resolve: {
          funcionario: function (employeeAPI) {
            return employeeAPI.getFuncionario(id);
          },
          gestor: function(){
            return currentUser;
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

  function ModalFeriasCtrl ($uibModalInstance, $scope, $timeout, funcionario, gestor, usersAPI, employeeAPI, appointmentAPI, util, utilCorrectApps) {

    console.log('funcionario, ', funcionario.data);
    console.log('Gestor?, ', gestor);
    $scope.funcionario = funcionario.data;
    $scope.currentDate = new Date();
    
    var $ctrl = this;
    $ctrl.confirmation = true;

    if ($scope.funcionario.ferias){

      for (var i=0; i<$scope.funcionario.ferias.length; i++){
        $scope.funcionario.ferias[i].dataIniFtd = new Date($scope.funcionario.ferias[i].periodo.anoInicial, 
          $scope.funcionario.ferias[i].periodo.mesInicial-1, $scope.funcionario.ferias[i].periodo.dataInicial, 0, 0, 0, 0);
        $scope.funcionario.ferias[i].dataFinFtd = new Date($scope.funcionario.ferias[i].periodo.anoFinal, 
          $scope.funcionario.ferias[i].periodo.mesFinal-1, $scope.funcionario.ferias[i].periodo.dataFinal, 0, 0, 0, 0);
      }
    }

    //parte do datePicker dataInicial
    $scope.datepic = {
      dt: $scope.currentDate
      //dt: new Date(teste.getFullYear(), teste.getMonth(), teste.getDate())
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
      console.log('já passou no changeDate no carregamento?');
      $scope.dataErrorMsg = null;
      // if (date == 1){
      //   //$scope.datepic.dt = new Date($scope.currentDate);
      //   //$scope.dataErrorMsg = "Você só pode solicitar ajustes de: "+$filter('date')(dataMaxBusca, 'abvFullDate')+" para trás.";
      //   $scope.dataErrorMsg = "erro";
      //   $timeout(hideDataError, 8000);
      //   return $scope.dataErrorMsg;
      // }
      console.log('passou por aqui!!!', date);
      $scope.datepic.dt = date;
      // $scope.currentDate = new Date(date);
      // $scope.currentDateFtd = $filter('date')($scope.currentDate, 'abvFullDate');
      //reset fields      
    };

    function hideDataError(seconds){
      $scope.dataErrorMsg = null;
    };
    //Fim do datePicker

    //parte do datePicker dataFinal
    $scope.datepicF = {
      dt: $scope.currentDate
      //dt: new Date(teste.getFullYear(), teste.getMonth(), teste.getDate())
    };    
    $scope.openF = openF;
    $scope.somethingF = {
      opened: false
    };
    
    function openF() {
      //console.log("open function", $scope.something.opened);
      $scope.somethingF.opened = true;
    }
    $scope.changeDateF = function(date) {
      console.log('já passou no changeDate no carregamento?');
      $scope.dataErrorMsgF = null;
      // if (date == 1){
      //   //$scope.datepic.dt = new Date($scope.currentDate);
      //   //$scope.dataErrorMsgF = "Você só pode solicitar ajustes de: "+$filter('date')(dataMaxBusca, 'abvFullDate')+" para trás.";
      //   $timeout(hideDataErrorF, 8000);
      //   return $scope.dataErrorMsgF;
      // }
      console.log('passou por aqui DF!!!', date);
      $scope.datepicF.dt = date;
      // $scope.currentDate = new Date(date);
      // $scope.currentDateFtd = $filter('date')($scope.currentDate, 'abvFullDate');
      //reset fields      
    };

    function hideDataErrorF(seconds){
      $scope.dataErrorMsgF = null;
    };
    //Fim do datePicker

    function hideDataErrorMsg(seconds){
      $scope.errorMsg = null;
    };

    $scope.indicarFerias = function(){
      
      console.log('clicou para indicar férias, inicial: ', $scope.datepic.dt);
      console.log('clicou para indicar férias, final: ', $scope.datepicF.dt);

      if (util.compareOnlyDates($scope.datepicF.dt, $scope.datepic.dt) == -1 || util.compareOnlyDates($scope.datepicF.dt, $scope.datepic.dt) == 0) {//se dataFinal >= dataInicial, erro

        $scope.errorMsg = 'Erro: A data final deve ser maior que a data inicial!';
        $timeout(hideDataErrorMsg, 8000);

      } else {

        var objDays = util.daysCountBtwDates($scope.datepic.dt, $scope.datepicF.dt);
        //console.log('ObjGeradoPeloBtwCount: ', objDays);

        var objFerias = {
          comentario: "",
          cadastradoPor: {_id: gestor._id, email: gestor.email},
          periodo: {dataInicial: $scope.datepic.dt.getDate(), dataFinal: $scope.datepicF.dt.getDate(), mesInicial: $scope.datepic.dt.getMonth()+1, mesFinal: $scope.datepicF.dt.getMonth()+1, anoInicial: $scope.datepic.dt.getFullYear(), anoFinal: $scope.datepicF.dt.getFullYear()},
          qtdeDias: objDays.daysCount,
          arrayDias: objDays.arrayDias
        };
        $scope.funcionario.ferias.push(objFerias);
        console.log('vai enviar: ', $scope.funcionario);
        employeeAPI.update($scope.funcionario).then(function sucessCallback(response){

          //console.log('ajustou ferias??', response.data);
          $scope.successMsg = response.data.message;
          console.log('msg: ', $scope.successMsg);
          //$uibModalInstance.close($ctrl.confirmation);
          proceedUpdateAppoint();

          }, function errorCallback(response){

            console.log('erro ao indicar férias ', response.data.message);
            $scope.errorMsg = response.data.message;
          }
        );
      }
    };

    function proceedUpdateAppoint() {

      var dateAux = new Date($scope.datepic.dt);
      var endDateAux = new Date($scope.datepicF.dt);

      var objDateWorker = {
        date: {
          raw: $scope.datepic.dt,
          year: dateAux.getFullYear(),
          month: dateAux.getMonth(),
          day: dateAux.getDate(),
          hour: dateAux.getHours(),
          minute: dateAux.getMinutes(),
          finalInclude: true,
          final: {
            raw: $scope.datepicF.dt,
            year: endDateAux.getFullYear(),
            month: endDateAux.getMonth(),
            day: endDateAux.getDate(),
            hour: endDateAux.getHours(),
            minute: endDateAux.getMinutes()
          }
        },
        funcionario: $scope.funcionario
      };
     
      console.log("objDateWorker Enviado: ", objDateWorker);

      appointmentAPI.getApontamentosByDateRangeAndFuncionario(objDateWorker).then(function successCallback(response){

        var apontamentosResponse = response.data;
        console.log("!@# Apontamentos do funcionário: ", apontamentosResponse);
        utilCorrectApps.putFeriasAppoints(apontamentosResponse);
        $uibModalInstance.close($ctrl.confirmation);

      }, function errorCallback(response){
        
        $scope.errorMsg = response.data.message;
        console.log("Erro ao obter apontamentos por um range de data e equipe");
      });
    };
  };

})();
