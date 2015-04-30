// The settings window controller, started whenever the window
// template code is compiled
app.controller('settings', ["$scope", "$rootScope", "$timeout", function ($scope, $rootScope, $timeout) {
    
    ZenX.log('Started settings controller.');

    (function loadTemplate() {

        ZenX.log('Loading settings template...');

        $http.post('api', {
            api: "core",
            request: "settings",
            token: ZenX.token
        })
        .success(function (response) {

        })
        .error(function (err) {

            ZenX.log('Failed to load settings template with error: ', err);
            ZenX.log('Retrying to load settings template...');
            $timeout(loadTemplate,2000);

        });

    })();

}]);