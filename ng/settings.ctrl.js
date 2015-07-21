// The settings window controller, started whenever the window
// template code is compiled
app.controller('settings', [
    "$scope",
    "$rootScope",
    "$timeout",
    "$compile",
    "$http",
    function ($scope, $rootScope, $timeout, $compile, $http) {
    
        var vp;
        ZenX.log('Started settings controller.');

        $scope.ZenX = ZenX;
        $scope.vp = {
            data: {},
            noChanges: true
        };

        vp = $scope.vp;
        
        $scope.text = ZenX.text;

        (function loadTemplate() {

            ZenX.log('Loading settings template...');

            ZenX.send({
                api: "core",
                request: "settings-template"
            })
            .success(function (response) {

                if (response.message == "success") {

                    $scope.data = response.modules;
                    $scope.$apply(function () {

                        var content = $compile(response.template)($scope);
                        $('[ng-controller="settings"]').html(content).removeClass('out');
                        ZenX.winLoading('.zenx-window[data-module="settings"]', false);

                        $timeout(function () {

                            $(content).find('.tab').click(function () {

                                $('.tab.selected').removeClass('selected');
                                $(this).addClass('selected');

                            });

                        }, 0);

                    });

                } else {
                    ZenX.log("Template failed to load with response: ", response);
                }

            })
            .error(function (err) {

                ZenX.log('Failed to load settings template with error: ', err);
                ZenX.log('Retrying to load settings template...');
                $timeout(loadTemplate,2000);

            });

        })();

        $scope.getSettings = function (topic, isModule, e) {

            ZenX.winLoading('.zenx-window[data-module="settings"]', true);

            topic === 0 && (topic = $(this).attr('data-module-ns'));

            ZenX.send({
                api: "core",
                request: "settings-vp",
                template: topic,
                isModule: isModule
            })
            .success(function (response) {

                if (topic == "user" && !isModule) {
                    vp.data.first_name = ZenX.user.first_name;
                    vp.data.last_name = ZenX.user.last_name;
                    vp.data.username = ZenX.user.username;
                    vp.data.email = ZenX.user.email;
                    vp.noChanges = true;
                }

                $scope.$apply(function () {

                    typeof response.template != "string" && (response.template = ZenX.moduleSettings(response.template, topic));

                    var content = $compile(response.template)($scope);
                    $('[ng-controller="settings"] .viewport').html(content).removeClass('out');
                    ZenX.winLoading('.zenx-window[data-module="settings"]', false);

                });

                $('[ng-controller="settings"] .viewport input').bind("keyup keydown click", function () { vp.noChanges = false; $scope.$apply(); });
            
            });

        }

        $scope.readFiles = function (event) {

            var reader = new FileReader();
            var file = event.target.files[0];

            reader.onload = function(event){
                $('[data-module="settings"] .viewport .img').css('background-image', 'url(' + event.target.result + ')');
            }

            reader.readAsDataURL(file);

            var formData = new FormData();

            var xhr = new XMLHttpRequest();
            xhr.open('POST', window.location.origin + '/api');

            xhr.upload.onprogress = function (event) {
                if (event.lengthComputable) {
                    var complete = (event.loaded / event.total * 100 | 0);
                }
            }

            xhr.onload = function (response) {
                ZenX.user.profileImage = JSON.parse(response.target.response).profileImage;
                $('.user-block .user-img').css('background-image', 'url(' + ZenX.user.profileImage + ')');
            }

            formData.append('file', file);
            formData.append('api', 'core');
            formData.append('request', 'user-change-image');

            xhr.setRequestHeader('x-csrf-token', ZenX.csrf);

            xhr.send(formData);

        }

        $scope.saveUserSettings = function () {

            ZenX.winLoading('.zenx-window[data-module="settings"]',true);
            vp.data.password = vp.data.password && String(CryptoJS.MD5(vp.data.password));

            ZenX.send({
                api: "core",
                request: "change-user-settings",
                settings: vp.data
            }).success(function () {

                ZenX.user.first_name = vp.data.first_name;
                ZenX.user.last_name = vp.data.last_name;
                ZenX.user.username = vp.data.username;
                ZenX.user.email = vp.data.email;

                ZenX.winLoading('.zenx-window[data-module="settings"]', false);
                vp.noChanges = true;
                vp.data.password = '';
                $scope.$apply();

            });

        }

    }]);