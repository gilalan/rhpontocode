'use strict';

angular.module('BlurAdmin', [
  'ngAnimate',
  'ui.bootstrap',
  'ui.sortable',
  'ui.router',
  'ngTouch',
  'toastr',
  'smart-table',
  "xeditable",
  'ui.slimscroll',
  'ngJsTree',
  'angular-progress-button-styles',

  'BlurAdmin.auth',
  'BlurAdmin.theme',
  'BlurAdmin.pages'
])
.config(function($stateProvider){
  console.log('StateProvider?!', $stateProvider);
   // $stateProvider
   //   .state('MainLogin', {
   //     url: '/',
   //     templateUrl: 'app/pages/login/login.html'      
   //   });
})
.run(['$rootScope', '$location', '$window', '$state', 'Auth', function($rootScope, $location, $window, $state, Auth){
  
  console.log('1. Opa, dentro de rootScope do BLUR ADMIN!!!');
  console.log('tentando pegar a factory Auth', Auth);
  
  if ($state.current.url === '^') {
    console.log('está vindo para o endereço principal, agora é o auth');
    //$window.location.href = "/auth.html";
  }

  console.log('$state url ', $state.current.url);
  console.log('$state name ', $state.current.name);
  $rootScope.$on("$stateChangeStart", function(e, toState, toParams, fromState, fromParams){
    //current é de "onde veio", só aparece esse objeto se NÃO for o primeiro acesso
    console.log('#event ', e);
    console.log('#toState ', toState);
    console.log('#toParams ', toParams);
    console.log('#fromState ', fromState);
    console.log('#fromParams ', fromParams);
    //$location.path("/login");
    //$window.location.href = "/auth.html";
    // if (current){
    //   console.log('2. current.originalPath: ', current.originalPath);
    //   console.log('2.1 current.access: ', current.access);
    //   if (current.originalPath == "/"){
    //     //var regex = /registro_ponto/;
    //     if (regex.test(next.originalPath)){
    //       console.log("3. opa, veio do login para o registro_ponto");
    //       //Auth.setBatidaDireta(true);
    //       //current.resolve["batidaDireta"] = true;
    //     }
          
    //   }
    //   //console.log("2.0 current path", current.originalPath);
    //   //console.log("2.1 next path: ", next.originalPath);
    // }
  });
}]);