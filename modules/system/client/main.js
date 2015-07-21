(function () {

    var module = {

        namespace: 'system'

    };

    $.getJSON('/modules/' + module.namespace + '/lang/' + ZenX.user.language + '.json', function (response) {

        module.text = response;

    });

    ZenX.modules[module.namespace] = module;

})();