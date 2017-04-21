/**
 * @author Gilliard Lopes
 * created on 12.04.2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.pages.entities.institutions')
      .controller('InstitutionCtrl', InstitutionCtrl);

  /** @ngInject */
  function InstitutionCtrl(institutionAPI) {

    console.log('dentro do InstitutionCtrl!');
    
    // $scope.smartTablePageSize = 5;
    // //console.log('Instituicoes pelo Resolve: ', instituicoes);
    // //$scope.instituicoes = instituicoes.data;

    // $scope.delete = function (id, index) {

    //   // institutionAPI.delete(id).then(function sucessCallback(response){

    //   //   console.log("deletou?", response.data);
    //   //   $scope.successMsg = response.data.message;
    //   //   //$scope.load();
    //   //não vai fucnionar o splice nessa smartTable...
    //   //$scope.instituicoes.splice(index, 1);


    //   // }, function errorCallback(response){

    //   //   console.log("erro ao deletar", response.data.message);
    //   //   $scope.errorMsg = response.data.message;
    //   // });
    // }

    // $scope.edit = function(instituicaoId) {

    //    // $location.path("/editInstituicao/"+instituicaoId);
    // }

    // $scope.new = function() {

    //     $state.go('entities.campus');
    // }
  }

})();
