ZenX.startApp = function (namespace) {

    ZenX.createWindow({
        width: 600,
        height: 400,
        minWidth: 600,
        minHeight: 600,
        title: ZenX.modules[namespace].text.MODULE_NAME,
        template: '<div class="out ani02" ng-controller="' + namespace + '"></div>',
        callback: function (win) {
            win.attr('data-module', namespace);
            ZenX.winLoading(win, true);
        }
    });

}