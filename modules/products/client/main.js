(function () {

    var module = {

        namespace: 'products'

    };

    $.getJSON('/modules/' + module.namespace + '/lang/' + ZenX.user.language + '.json', function (response) {

        module.text = response;

    });

    app.controller(module.namespace, ['$scope', function ($scope) {

        ZenX.log('"' + module.namespace + '" controller started.');

    }]);

    ZenX.modules[module.namespace] = module;

})();