// Login dialog controller
// This is the initial controller that will handle authenticating an existing token or
// request a new one with login credentials
app.controller("login", ["$scope", "$timeout", "$http", "$rootScope", function ($scope, $timeout, $http, $rootScope) {

    // Hide login to apply disabled on inputs
    hideLogin();

    // Pass show login to use on logout
    $rootScope.showLogin = showLogin;

    window.hit = function (r) {
        $http.post('api', r).success(function (r) { console.log(r)})
    }

    // Spawn login dialog
    function showLogin() {

        $('.loading-status').addClass('out');
        $('.login-dialog *').attr('disabled', false);
        $('.login-dialog').css('opacity', 1)
                          .removeClass('pending');
        $('body > .spinner').addClass('out');

    }

    // Hide login dialog
    function hideLogin() {

        $('.login-dialog *').attr('disabled', false);
        $('.login-dialog').css('opacity', 0)
                          .removeClass('pending');

    }

    // Set pending state
    function pendingLogin() {

        $('.loading-status').addClass('out');
        $('.login-dialog *').attr('disabled', true);
        $('.login-dialog').css('opacity', 1)
                          .addClass('pending');
        $('body > .spinner:not(.out)').addClass('out');

    }

    // Don't start before logo is preloaded
    var logo = new Image();
    logo.src = "/images/logo.png";

    // If we have a token, authenticate
    if (localStorage.getItem('session_token')) {

        $timeout(function () { $('.loading-status').removeClass('out'); }, 100);
        ZenX.log('Token exists. Authenticating...');

        $http.post('api',{
            api: "core",
            request: "auth",
            token: localStorage.getItem('session_token')
        }).success(function (response) {

            // If not successful return to login dialog
            if (response.message != "success") {

                ZenX.log('Authentication unsuccessful: ', response);
                showLogin();
                localStorage.removeItem('session_token');

            } else {

                ZenX.log('Authentication successful. Initializing...');
                ZenX.log('Login data: ', response)

                initialize(response);

            }

        }).error(function (err) {
            ZenX.log('Authentication failed with error: ', err);
            showLogin();
        });

    } else {
        logo.onload = showLogin;
    }

    // Bound variables
    $scope.rememberMe = true;
    $scope.showTooltip = false;

    // Focus on username
    $('input[name="username"]').focus();

    // Function to call on submit
    $scope.login = function () {

        // If empty field show error tooltip
        if (!$scope.username || !$scope.password) return $scope.showTooltip = true;

        // Toggle tooltip
        $scope.showTooltip = false;

        // Set pending state
        pendingLogin();

        ZenX.log('Attempting to log in...');

        // Post the login request
        ZenX.send({
            request: 'login',
            username: $scope.username,
            password: $scope.password,
            api: 'core'
        })
        .success(function (response) {

            // If not successful return to login dialog
            if (response.message != "success") {

                ZenX.log('Login unsuccessful: ', response);
                ZenX.alert({
                    windowTitle: "ZenX Manager",
                    title: "Login failed: Wrong credentials",
                    message: "Please make sure you entered your credentials correctly and try again.",
                    buttons: "ok"
                });
                showLogin();

            } else {

                ZenX.log('Successful login. Initializing...');
                ZenX.log('Login data: ', response);

                // Empty login dialog and start loading
                $scope.username = "";
                $scope.password = "";

                // Save session token if rememberMe was checked
                if ($scope.rememberMe) {
                    localStorage.setItem('session_token', response.token);
                    ZenX.log('Token saved to local storage.');
                }

                hideLogin();
                initialize(response);

            }

        })
        .error(function (err) {
            ZenX.log('Login failed with error: ', err);
            ZenX.alert({
                windowTitle: "ZenX Manager",
                title: "Login failed",
                message: "An error occured. Please try again later.",
                buttons: "ok"
            });
            showLogin();
        });

    }

    // Start loading desktop
    function initialize(data) {

        // Load data
        ZenX.token = data.token;
        ZenX.text  = data.text;
        ZenX.user  = data.user;

        // Update text
        ZenX.updateText();

        $('body > .spinner, .loading-status').removeClass('out');

        // Will start and maintain a WebSocket connection
        function connectWebSocket(callback) {

            ZenX.log('Starting new WebSocket connection...');
            ZenX.socket = new WebSocket('wss://' + window.location.host);

            ZenX.socket.onopen = function () {

                ZenX.log('WebSocket connected. Getting auth...');

                var wsAuth = {
                        "api": "core",
                        "request": "ws-auth",
                        "token": data.token,
                        "ws": true
                    };

                ZenX.send(wsAuth)
                    .success(function (data) {

                        ZenX.log('Auth received: ', data);
                        $('.user-block .connected-light').removeClass('offline');

                        if (data.message != "success") {

                            ZenX.log('Bad auth. Getting new in 1s...');
                            setTimeout(function () {
                                ZenX.socketRequests[requestID] = this;
                                return ZenX.socket.send(JSON.stringify(wsAuth));
                            }, 1000);

                        } else {

                            ZenX.log('Auth successful. Socket healthy.');
                            typeof callback == "function" && callback();

                        }

                    })
                    .error(function (err) {

                        ZenX.log('Websocket auth timed out. Procceeding...');
                        typeof callback == "function" && callback();

                    });

                ZenX.socket.onmessage = function (data) {

                    var data = JSON.parse(data.data),
                        request = ZenX.socketRequests[data.requestID];
                    request.onsuccess(data);
                    !isNaN(request.timeoutFn) && clearTimeout(request.timeoutFn);
                    if (!request.persistent) delete ZenX.socketRequests[data.requestID];

                };

            };

            // Log error
            ZenX.socket.onerror = function (err) {
                ZenX.log('WebSocket error: ', err);
            };

            // Reconnect on close
            ZenX.socket.onclose = function () {

                // Reset request handlers
                for (var i in ZenX.socketRequests) {

                    try {
                        clearTimeout(ZenX.socketRequests[i].timeoutFn);
                        ZenX.socketRequests[i].onerror({ error: 'connection_dropped' });
                    } catch (x) { }
                    delete ZenX.socketRequests[i];

                }

                // If dropped because of logout, let it be
                if (ZenX.LOGGING_OUT) return delete ZenX.LOGGING_OUT;

                ZenX.log('WebSocket dropped. Reconnecting...');
                $('.user-block .connected-light').addClass('offline');
                connectWebSocket();

            };

        }

        $('.loading-status').html(ZenX.text.INITIALIZE_CONNECTING_WEBSOCKET);
        connectWebSocket(function () {

            var moduleLoadCounter = 0,
                modulesCount      = 0;

            for (var i in ZenX.user.modules) modulesCount++;

            $('.loading-status').html(ZenX.text.INITIALIZE_MODULES);
            ZenX.log('Loading modules...');

            function loadModule(module) {
                $.getScript('/modules/' + module + '/main.js')
                 .done(function () {
                     if (++moduleLoadCounter == modulesCount) {
                         ZenX.log('Loaded ' + modulesCount + ' modules.');
                         loadAssets();
                     }
                 })
                 .fail(function () { loadModule(module); });
            }

            for(var i in ZenX.user.modules) loadModule(i);

        });

        function loadAssets() {

            $('.loading-status').html(ZenX.text.INITIALIZE_ASSETS);
            ZenX.log('Loading assets...');

            var assets = [],
                images = [
                    ZenX.user.profileImage || 'images/default.gif',
                    ZenX.user.backgroundImage || 'images/bg3.jpg'
                ],
                audio  = [
                    'audio/newmsg.mp3'
                ],
                assetLoadCounter = 0;

            images.forEach(function (src) {

                var img = new Image();
                img.src = src;
                assets.push(img);

            });

            audio.forEach(function (src) {

                var audio = new Audio();
                audio.src = src;

                // Temporarily disable preloading audio  by commenting
                // the following line as oncanplaythrough is
                // not a reliable load event
                assets.push(audio);

            });

            assets.forEach(function (asset) {
                
                var event = $(asset).is('audio') ? 'oncanplaythrough' : 'onload';

                asset[event] = function () {
                    ZenX.log('Loaded asset: ', this);
                    if (++assetLoadCounter == assets.length) {
                        ZenX.log('Loaded ' + assets.length + ' assets.');
                        showDesktop();
                    }
                };

            });

        }

        // Show the new desktop
        function showDesktop() {

            ZenX.log('Initialization complete. Welcome!');
            $('.user-block .user-img').css('background-image', 'url(' + (ZenX.user.profileImage || 'images/default.gif') + ')');
            $('.desktop').removeClass('out')
                         .css('background-image', 'url(' + (data.user.backgroundImage || 'images/bg3.jpg') + ')');

        }

    }

}]);