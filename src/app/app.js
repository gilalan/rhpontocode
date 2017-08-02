'use strict';

angular.module('BlurAdmin', [
  'ngAnimate',
  'ui.bootstrap',
  'ui.sortable',
  'ui.router',
  'ngTouch',
  'ngSanitize',
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
  //console.log('StateProvider?!', $stateProvider);
   // $stateProvider
   //   .state('MainLogin', {
   //     url: '/',
   //     templateUrl: 'app/pages/login/login.html'      
   //   });
})
.run(['$rootScope', '$location', '$window', '$state', 'Auth', function($rootScope, $location, $window, $state, Auth){
  
  //console.log('## - Dentro do RUN: State?!', $state);
  /*accessLevel => 
   *{
     0: public,
     1: colaborador,
     2: fiscal,
     3: gestor,
     4: admin 
   *}
   */

  $rootScope.$on("$stateChangeStart", function(e, toState, toParams, fromState, fromParams){
    //current é de "onde veio", só aparece esse objeto se NÃO for o primeiro acesso
    console.log('#event ', e);
    console.log('#toState ', toState);
    console.log('#toParams ', toParams);
    console.log('#fromState ', fromState);
    console.log('#fromParams ', fromParams);

    //Precisa estar logado e com algum nível de autorização
    if (toState && toState.accessLevel > 0) {
      
      var allowed = false;
      console.log('Entrando em uma rota com nível de acesso > 0');
      if (Auth.getToken()) {
        
        if (!Auth.isPwdExpired()){
          $rootScope.$broadcast('logged', true);//emite comunicado que está logado

          if (Auth.authorize(toState.accessLevel)){//veremos se o user tem o nivel de acesso permitido
            console.log('Usuário tem nível de acesso para ver a página!');
            allowed = true;
            $rootScope.$broadcast('authorized', true);//Emite comunicado que está autorizado para ver
            // redirectTo
            if (toState.redirectTo) {
              console.log('foi autorizado e passou no redirecionamento redirectTo', toState.redirectTo);
              e.preventDefault();
              $state.go(toState.redirectTo, toParams);
            }

          } else {//não está autorizado
            console.log('vc não é autorizado a ver essa rota');
            $rootScope.$broadcast('authorized', false);
            $window.location.href = "/404.html";
          }
        } else {
          //tem que configurar nova senha
          console.log("veio para o else do issPwdExpiredd");
          $rootScope.$broadcast('logged', false);
          $rootScope.$broadcast('authorized', false);
          $rootScope.$broadcast('pwdExpired', true);//emite comunicado que está com pwd expirado
          //$window.location.href = "/index.html";
        }
      } else {
        //não está logado
        $window.location.href = "/index.html";
      }
    } 

    //está indo para uma rota pública...
    else {
      //indo para a página inicial (login) mas já está logado
      if (toState.url == "^" && Auth.getToken()){
        console.log('Indo para a página inicial com login já realizado, deve ser redirecionado para dashboard');
        $state.go('dashboard');
      }
    }

    // //current/fromState é de "onde veio", só aparece esse objeto se NÃO for o primeiro acesso
    // if (fromState){
    //   console.log('2. fromState.access: ', fromState.access);
    //   console.log('2. fromState.accessLevel: ', fromState.accessLevel);
    //   console.log('2. fromState.originalPath ', fromState.originalPath);
    //   if (fromState.originalPath == "/"){
    //     var regex = /registro_ponto/;
    //     if (regex.test(toState.originalPath)){
    //       console.log("opa, veio do login para o registro_ponto");
    //       Auth.setBatidaDireta(true);
    //       //current.resolve["batidaDireta"] = true;
    //     }
          
    //   }
    //   //console.log("2.0 current path", current.originalPath);
    //   //console.log("2.1 next path: ", next.originalPath);
    // }

    // //next.access pega essa variável definida na rota, que indica o nível de acesso a ela.
    // //a gnt passa isso para um authorize(local) e verifica se ele pode entrar nessa rota.
    // if(toState){
    //   console.log('toState.access: ', toState.access);
    //   console.log('toState.accessLevel: ', toState.accessLevel);
    //   console.log('toState.originalPath: ', toState.originalPath);

    //   if (toState.originalPath == "/" && Auth.getToken()){ //se estiver acessando a app na tela inicial mas tiver um token de log guardado, manda para a página principal
    //     console.log("página de login com o usuário já logado... encaminha para o dashboard");
    //     return $state.go('dashboard');//$location.path("/dashboard");
    //   }

    //   if (toState.accessLevel > 0) {

    //     if(!Auth.getToken()){
    //       console.log('usuário não logado e página necessita de nível de acesso: ', toState.accessLevel);
    //       $rootScope.$broadcast('authorized', false);
    //       $rootScope.$broadcast('logged', true);
    //       //$location.path('/');
    //       $state.go('^');
    //     }

    //     else {
    //       $rootScope.$broadcast('logged', true);
    //       console.log("rota exigida: "+toState.accessLevel+" e usuário logado, checar seu nível");
    //       if (Auth.authorize(toState.accessLevel)){//veremos se o user tem o nivel de acesso permitido
    //         console.log('opa fui autorizado');
    //         console.log('deverá seguir o fluxo normal... controller e depois view');
    //         $rootScope.$broadcast('authorized', true);
    //       } else {
    //         console.log('vc não é autorizado a ver essa rota');
    //         $rootScope.$broadcast('authorized', false);
    //         //$location.path('/unauthorized');
    //         //$state.go('')
    //         $window.location.href = "/404.html";
    //       }
    //     }
    //   } 
    // }

    
    
  });
}]);