app.controller('desktop', ['$scope', '$compile', '$timeout', '$rootScope', function ($scope, $compile, $timeout, $rootScope) {

    // Log version and start clock
    ZenX.log("Version " + ZenX.version);
    ZenX.clock = setInterval(function () {
        $('.user-block .clock').html(new Date().getHours() + ':' + (new Date().getMinutes() < 10 ? '0' : '') + new Date().getMinutes());
    }, 1000);

    setInterval(function () {
        ZenX.send({
            api: "core",
            request: "refresh-session"
        }).success(function (r) {
            ZenX.csrf = r.session_token;
        });
    }, 50 * 1000);

    $scope.text = {};

    ZenX.updateText = function () {
        $scope.text = this.text;
    }

    $scope.toggleUserMenu = function () { $('.user-menu').toggleClass('out'); };
    window.deCompile = $compile;
    window.deScope = $scope;
    // ZenX Window
    ZenX.createWindow = function (options) {

        var desktop = options.parent ? $(options.parent) : $('.desktop > .pool'),
            win = $('.window-template').clone(),
            width = options.width || 400,
            height = options.height || 350,
            focus = options.focus == undefined ? true : options.focus;

        win.addClass('zenx-window')
           .removeClass('window-template out')
           .css({
               width: width + 'px',
               height: height + 'px',
               minWidth: (width < (options.minWidth || 400) ? width : (options.minWidth || 400)) + 'px',
               minHeight: (height < (options.minHeight || 400) ? height : (options.minHeight || 400)) + 'px',
               top: 'calc(50% - ' + height / 2 + 'px)',
               left: 'calc(50% - ' + width / 2 + 'px)'
           });

        win.find('.title').html(options.title || '');

        desktop.append(win);

        if (typeof options.template == "string") {
            options.template = '<div class="win-spinner ani02 out"><div class="app-spinner ng-scope"></div></div>' + (options.template || '');
            $timeout(function () {
                $scope.$apply(function () {
                    var content = $compile(options.template)($scope);
                    win.find('.window-content').append(content);
                    if (options.callback) options.callback(win);
                });
            }, 0);
        } else {
            win.find('.window-content').append(options.template || '');
            if (options.callback) options.callback(win);
        }

        if (options.resizable == undefined || options.resizable) win.append('<div class="resizer"></div>');
        if (focus) ZenX.focus(win);
        if (options.maximizable != undefined && !options.maximizable) win.find('.window-head .fs').addClass('disabled');

    };

    // ZenX confirm
    ZenX.confirm = function (options, yes, no) {

        var template = $('.dialog-template').clone(),
            close = function () { ZenX.closeWindow(this); };

        template.find('.title').html(options.title);
        template.find('.message').html(options.message);
        template.find('.yes').html(options.buttons.split(" ")[0]);
        template.find('.no').html(options.buttons.split(" ")[1]);

        this.createWindow({
            title: options.windowTitle,
            width: 300,
            height: 165,
            resizable: false,
            maximizable: false,
            parent: "body",
            template: template.removeClass('dialog-template out').addClass('confirm-content'),
            callback: function (win) {
                win.find('.yes').click(close).click(yes || function () { }).focus();;
                win.find('.no').click(close).click(no || function () { });
                options.callback && options.callback(win);
            }
        });

    }

    // ZenX alert
    ZenX.alert = function (options) {

        var template = $('.dialog-template').clone(),
            close = function () { ZenX.closeWindow(this); };

        template.find('.title').html(options.title);
        template.find('.message').html(options.message);
        template.find('.yes').html(options.buttons.split(" ")[0]);
        template.find('.no').remove();

        this.createWindow({
            title: options.windowTitle,
            width: 300,
            height: 165,
            resizable: false,
            maximizable: false,
            parent: "body",
            template: template.removeClass('dialog-template out').addClass('confirm-content'),
            callback: function (win) {
                win.find('.yes').click(close).focus();
                options.callback && options.callback(win);
            }
        });

    }

    // ZenX focus handler
    ZenX.focus = function (win) {

        typeof win == "string" && (win = $(win));
        $('.x-focus').removeClass('x-focus');
        win.addClass('x-focus').css('z-index', ++ZenX.focusIndex);

    }

    // ZenX close window by contained element or window itself or selector
    ZenX.closeWindow = function (relElement) {

        var tarWindow = $(relElement).is('.zenx-window') ? $(relElement) : $(relElement).parents('.zenx-window');

        tarWindow.addClass('closing');
        $timeout(function () { tarWindow.remove(); },250);

    }

    // Start logout after confirm
    $scope.logout = function () {
        
        if ($('.zenx-window[data-id="logout"]').length) ZenX.focus($('.zenx-window[data-id="logout"]'));
        else ZenX.confirm({
            windowTitle: "ZenX Manager",
            title: ZenX.text.LOGOUT,
            message: ZenX.text.CONFIRM_LOGOUT,
            buttons: "yes no",
            callback: function(win){
                win.attr('data-id', 'logout');
            }
        }, function () {

            ZenX.log('Destroying token...');
            $('.loading-status').html(ZenX.text.LOGGING_OUT);
            $('.desktop').addClass('out');

            localStorage.removeItem('session_token');
            ZenX.socket.send(JSON.stringify({
                api: "core",
                request: "purge-token",
                token: ZenX.token
            }));

            ZenX.LOGGING_OUT = true;
            ZenX.socket.close();
            delete ZenX.socket;

            ZenX.modules = {};
            delete ZenX.token;

            $('.zenx-window').each(function (i,e) { ZenX.closeWindow(e); });
            
            ZenX.focusIndex = 1;

            $timeout(function () {
                ZenX.log('Logout successful.');
                $rootScope.showLogin();
            }, 1000);

        });

    };

    // Start or focus settings window
    $('.user-menu .settings').click(function () {

        if($('.zenx-window[data-module="settings"]').length) return ZenX.focus($('.zenx-window[data-module="settings"]'));

        ZenX.createWindow({
            width: 600,
            height: 400,
            minWidth: 600,
            minHeight: 600,
            title: ZenX.text.SETTINGS,
            template: '<div class="out ani02" ng-controller="settings"></div>',
            callback: function (win) {
                win.attr('data-module', 'settings');
                ZenX.winLoading(win,true);
            }
        });

    });

}]);