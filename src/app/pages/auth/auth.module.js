/**
 * @author Gilliard Lopes
 * created on 11.04.2017
 */
(function () {
  'use strict';

  angular.module('BlurAdmin.auth', [
    'ui.router',
    'ngStorage',
    'angular-jwt'
  ]).

  factory('Auth', function($localStorage, $q, jwtHelper){
    console.log('Auth factory');
    return {
      authorize: function(routerAccessLevel){

        var user = jwtHelper.decodeToken($localStorage.token);
        console.log("USUARIO OBTIDO NO AUTH ATRAVES DO DECODEJWT: ", user);
        console.log("ROTA NívelAcesso: ", routerAccessLevel);
        console.log("USUARIO NívelAcesso: ", user.acLvl);
        if (user.acLvl >= routerAccessLevel) {
          //se usuario tem acesso maior que a página demanda... ele está autorizado
          return true;
        } else {
          return false;
        }
      },
      setToken: function(token) {
        $localStorage.token = token;
      },
      getToken: function(){
        return $localStorage.token;
      },
      setCurrentUser: function(user) {
        //var user = jwtHelper.decodeToken(getToken());
        //console.log()
      },
      getCurrentUser: function() {
        console.log('## Get Current User?!');
        var user = jwtHelper.decodeToken($localStorage.token);
        return user;
      },
      setBatidaDireta: function(flag) {
        console.log("Setando a batida direta para " , flag);
        batidaDireta = flag;
      },
      getBatidaDireta: function() {
        return batidaDireta;
      },
      getUserLevel: function() {
        var user = jwtHelper.decodeToken($localStorage.token);        
        return user.acLvl;
      },
      logout: function(){
        this.setBatidaDireta(false);
        delete $localStorage.token;
        $q.when();
      }
    }
  });

})();
