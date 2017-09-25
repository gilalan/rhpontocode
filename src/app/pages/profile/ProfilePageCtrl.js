/**
 * @author Gilliard Alan
 * created on 24/07/2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.profile')
    .controller('ProfilePageCtrl', ProfilePageCtrl);

  /** @ngInject */
  function ProfilePageCtrl($scope, fileReader, $window, $state, $filter, $uibModal, usersAPI, user,  instituicoes) {
    
    $scope.picture = $filter('profilePicture')('Nick');

    $scope.funcionario = user.data.funcionario;
    $scope.funcionario.dataNascimento = $filter('date')($scope.funcionario.dataNascimento, "dd/MM/yyyy");
    $scope.funcionario.alocacao.dataAdmissao = $filter('date')($scope.funcionario.alocacao.dataAdmissao, "dd/MM/yyyy");
    $scope.funcionario.nomeCargo = getCargo();
    $scope.instituicoes = instituicoes.data;

    $scope.userForm = {
      senha: "",
      confSenha: ""
    };

    $scope.testData = {
      blankDate: null,
      realDate: new Date("September 30, 2010 15:30:00")
    };

    $scope.removePicture = function () {
      $scope.picture = $filter('appImage')('theme/no-photo.png');
      $scope.noPicture = true;
    };

    $scope.uploadPicture = function () {
      var fileInput = document.getElementById('uploadFile');
      fileInput.click();

    };

    $scope.save = function(funcionario) {

      console.log('funcionario: ', funcionario);
      if (funcionario.senha){
        var userD = 
        {
          _id: user.data._id,
          senha: funcionario.senha
        };//user.data;
        //userD.senha = funcionario.senha;
        
        usersAPI.update(userD).then(function successCallback(response){
          
          $scope.successMsg = response.data.message;  
          console.log("resposta da atualizacao: ", response.data);
          //$window.scrollTo(0, 0);  
          $state.reload();

        }, function errorCallback(response) {

          $scope.errorMsg = response.data.message;
          console.log('Erro de registro: ' + response.data.message);
          $window.scrollTo(0, 0);  
        });

      } else {

        console.log('Usuário não alterado');
        $window.scrollTo(0, 0);
      }
    };

    function checkInst(inst) {

      return $scope.funcionario.alocacao.instituicao == inst._id;
    };

    function getCargo() {

      return ($scope.funcionario.sexoMasculino) ? $scope.funcionario.alocacao.cargo.especificacao : $scope.funcionario.alocacao.cargo.nomeFeminino;
    };

    function initSelects(){
      
      if ($scope.instituicoes.length > 0){

        $scope.selectedInst = { item: $scope.instituicoes[$scope.instituicoes.findIndex(checkInst)] };
      }
    };

    initSelects();

    $scope.showModal = function (item) {
      $uibModal.open({
        animation: false,
        controller: 'ProfileModalCtrl',
        templateUrl: 'app/pages/profile/profileModal.html'
      }).result.then(function (link) {
          item.href = link;
        });
    };

    $scope.getFile = function () {
      fileReader.readAsDataUrl($scope.file, $scope)
          .then(function (result) {
            $scope.picture = result;
          });
    };
  }

})();
