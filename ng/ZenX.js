// Initialize client
var app = angular.module('app', ['ngAnimate', 'ngMaterial']),
    ZenX = {
        socket: null,
        socketRequests: {},
        version: window.version,
        modules: {},
        text: {},
        focusIndex: 1,
        assets: {
            audio: {}
        }
    };

// Configure angular material theme and more
app.config(['$mdThemingProvider', '$controllerProvider',
function ($mdThemingProvider, $controllerProvider) {

    window.$controllerProvider = $controllerProvider;

    $mdThemingProvider.theme('default')
      .primaryPalette('orange')
      .accentPalette('yellow');

}]);