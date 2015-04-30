app.controller('desktop', ['$scope','$compile','$timeout', '$rootScope', function ($scope,$compile,$timeout,$rootScope) {

    $scope.text = {};

    ZenX.updateText = function () {
        $scope.text = this.text;
    }

    $('.user-block .user-img').click(function () { $('.user-menu').toggleClass('out'); });

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
            $scope.$apply(function () {
                var content = $compile(options.template)($scope);
                win.find('.window-content').append(content);
            });
        } else {
            win.find('.window-content').append(options.template || '');
        }

        if (options.resizable == undefined || options.resizable) win.append('<div class="resizer"></div>');
        if (focus) ZenX.focus(win);
        if (options.callback) options.callback(win);
        if (options.maximizable != undefined && !options.maximizable) win.find('.window-head .fs').addClass('disabled')

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
                win.find('.no') .click(close).click(no  || function () { });
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
    $('.user-menu .option.logout').click(function () {
        
        ZenX.confirm({
            windowTitle: "ZenX Manager",
            title: ZenX.text.LOGOUT,
            message: ZenX.text.CONFIRM_LOGOUT,
            buttons: "yes no"
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

    });

    // Start or focus settings window
    $('.user-menu .option.settings').click(function () {

        if($('.zenx-window[data-module="settings"]').length) return ZenX.focus($('.zenx-window[data-module="settings"]'));

        ZenX.createWindow({
            width: 600,
            height: 400,
            minWidth: 600,
            minHeight: 600,
            title: ZenX.text.SETTINGS,
            template: '<div class="app-spinner"></div><div class="out ani02" ng-controller="settings"></div>',
            callback: function (win) {
                win.attr('data-module', 'settings');
            }
        });

    });

}]);