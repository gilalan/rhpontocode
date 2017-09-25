(function() {
  'use strict';

  angular.module('BlurAdmin.theme.components')
      .provider('baSidebarService', baSidebarServiceProvider);

  /** @ngInject */
  function baSidebarServiceProvider() {
    var staticMenuItems = [];
    
    this.addStaticItem = function() {
      staticMenuItems.push.apply(staticMenuItems, arguments);
    };

    /** @ngInject */
    this.$get = function($state, layoutSizes) {
      return new _factory();

      function _factory() {
        var isMenuCollapsed = shouldMenuBeCollapsed();

        this.getMenuItems = function(user) {
          //console.log('user passado', user);
          var states = defineMenuItemStates(user);
          //console.log('states retornados ? ', states);
          var menuItems = states.filter(function(item) {
            return item.level == 0;
          });

          menuItems.forEach(function(item) {
            //console.log('##### item: ', item);
            var children = states.filter(function(child) {
              return child.level == 1 && child.name.indexOf(item.name) === 0;
            });
            item.subMenu = children.length ? children : null;
          });

          return menuItems.concat(staticMenuItems);
        };

        this.shouldMenuBeCollapsed = shouldMenuBeCollapsed;
        this.canSidebarBeHidden = canSidebarBeHidden;

        this.setMenuCollapsed = function(isCollapsed) {
          isMenuCollapsed = isCollapsed;
        };

        this.isMenuCollapsed = function() {
          return isMenuCollapsed;
        };

        this.toggleMenuCollapsed = function() {
          isMenuCollapsed = !isMenuCollapsed;
        };

        this.getAllStateRefsRecursive = function(item) {

          var result = [];
          _iterateSubItems(item);
          return result;

          function _iterateSubItems(currentItem) {
            currentItem.subMenu && currentItem.subMenu.forEach(function(subItem) {
              subItem.stateRef && result.push(subItem.stateRef);
              _iterateSubItems(subItem);
            });
          }
        };

        function defineMenuItemStates(user) {
          console.log('$state.get()', $state.get());
          return $state.get()
              .filter(function(s) { //retorna apenas os States com o atributo 'sidebarMeta'
                return s.sidebarMeta;
              })
              .map(function(s) { //map aplica a função abaixo para retornar os elementos do array filtrado dos states
                var meta = s.sidebarMeta;
                //incluí o attr 'visible' para retornar apenas os itens que possuem acesso permitido de acordo com o nível do usuário
                return {
                  name: s.name,
                  title: s.title,
                  visible: user.acLvl >= s.accessLevel,
                  level: (s.name.match(/\./g) || []).length,
                  order: meta.order,
                  icon: meta.icon,
                  stateRef: s.name,
                };
                
              })
              .sort(function(a, b) {
                return (a.level - b.level) * 100 + a.order - b.order;
              });
        }

        function shouldMenuBeCollapsed() {
          return window.innerWidth <= layoutSizes.resWidthCollapseSidebar;
        }

        function canSidebarBeHidden() {
          return window.innerWidth <= layoutSizes.resWidthHideSidebar;
        }
      }

    };

  }
})();
