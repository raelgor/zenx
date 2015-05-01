// The settings window controller, started whenever the window
// template code is compiled
app.controller('settings', [
    "$scope",
    "$rootScope",
    "$timeout",
    "$compile",
    "$http",
    function ($scope, $rootScope, $timeout, $compile, $http) {
    
    ZenX.log('Started settings controller.');

    (function loadTemplate() {

        ZenX.log('Loading settings template...');

        ZenX.send({
            api: "core",
            request: "settings-template"
        })
        .success(function (response) {

            if (response.message == "success") {

                $scope.data = response.data;
                $scope.$apply(function () {
                    var content = $compile(response.template)($scope);
                    $('[ng-controller="settings"]').html(content).removeClass('out');
                });

            } else {
                ZenX.log("Templated failed to load with response: ",response);
            }

        })
        .error(function (err) {

            ZenX.log('Failed to load settings template with error: ', err);
            ZenX.log('Retrying to load settings template...');
            $timeout(loadTemplate,2000);

        });

    })();

}]);