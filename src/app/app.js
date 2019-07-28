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
  //'angularFileUpload',

  'BlurAdmin.auth',
  'BlurAdmin.theme',
  'BlurAdmin.pages'
])
// .config(function($stateProvider){
//   ////console.log('StateProvider?!', $stateProvider);
//    // $stateProvider
//    //   .state('MainLogin', {
//    //     url: '/',
//    //     templateUrl: 'app/pages/login/login.html'      
//    //   });
// })
.config(['KeepaliveProvider', 'IdleProvider', function(KeepaliveProvider, IdleProvider) {
  IdleProvider.idle(60); //começa a contabilizar depois de 60 seg inativo
  IdleProvider.timeout(60 * 60); //Se ficar 60 minutos no contador, expira 
  KeepaliveProvider.interval(60); //recomeça a contagem depois de 60 segundos
}])
.run(['$rootScope', '$location', '$window', '$state', 'Auth', 'Idle', function($rootScope, $location, $window, $state, Auth, Idle){
  

  $rootScope.$on("$stateChangeStart", function(e, toState, toParams, fromState, fromParams){
    //current é de "onde veio", só aparece esse objeto se NÃO for o primeiro acesso
    
    console.log('#toState ', toState);
    Idle.watch();
   // console.log('#Idle? ', Idle);   
    
    //Precisa estar logado e com algum nível de autorização
    if (toState && toState.accessLevel) { 
      
      var allowed = false;
      //console.log('Entrando em uma rota com nível de acesso > 0');
      if (Auth.getToken()) {
        
        if (!Auth.isPwdExpired()){
          $rootScope.$broadcast('logged', true);//emite comunicado que está logado

          if (Auth.authorize(toState.accessLevel)){//veremos se o user tem o nivel de acesso permitido
            //console.log('Usuário tem nível de acesso para ver a página!');
            allowed = true;
            $rootScope.$broadcast('authorized', true);//Emite comunicado que está autorizado para ver
            // redirectTo
            if (toState.redirectTo) {
              //console.log('foi autorizado e passou no redirecionamento redirectTo', toState.redirectTo);
              e.preventDefault();
              $state.go(toState.redirectTo, toParams);
            }

            //tentando redirecionar por aqui ....
            if(toState.name == "adjustsolicitation"){
              console.log('entrou no adjustsolicitation direto do app.js');
              var level = Auth.getUserLevel();
              if (level >= 2){//é no mínimo gestor, redireciona para outro state, controller e html
                
                e.preventDefault();
                $state.go('adjustsolicitation-gestor');

              } 
            }

            if (toState.name == "abono"){
              console.log('entrou no ajusteabono direto do app.js');
              var level = Auth.getUserLevel();
              if (level >= 2){//é no mínimo gestor, redireciona para outro state, controller e html
                
                e.preventDefault();
                $state.go('abono-gestor');

              }
            }

          } else {//não está autorizado
            //console.log('vc não é autorizado a ver essa rota');
            $rootScope.$broadcast('authorized', false);
            $window.location.href = "/404.html";
          }
        } else {
          //tem que configurar nova senha
          //console.log("veio para o else do issPwdExpiredd");
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
        //console.log('Indo para a página inicial com login já realizado, deve ser redirecionado para dashboard');
        $state.go('dashboard');
      }
    }    
  });

  

}]);