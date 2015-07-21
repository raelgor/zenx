(function () {

    var module = {

        namespace: 'pages'

    };

    $.getJSON('/modules/' + module.namespace + '/lang/' + ZenX.user.language + '.json', function (response) {

        module.text = response;

    });

    app.controller(module.namespace, ['$scope','$compile', function ($scope,$compile) {

        ZenX.log('"' + module.namespace + '" controller started.2');

        

    }]);

    ZenX.modules[module.namespace] = module;

})();