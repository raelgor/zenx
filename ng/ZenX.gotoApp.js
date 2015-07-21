ZenX.gotoApp = function (namespace) {

    if ($('[data-module="' + namespace + '"]').length) ZenX.focus('[data-module="' + namespace + '"]');
    else ZenX.startApp(namespace);

}