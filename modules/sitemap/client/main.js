(function () {

    var module = {

        namespace: 'sitemap'

    };

    $.getJSON('/modules/' + module.namespace + '/lang/' + ZenX.user.language + '.json', function (response) {

        module.text = response;

    });

    $controllerProvider.register(module.namespace, ['$scope', '$compile', function ($scope, $compile) {

        ZenX.log('"' + module.namespace + '" controller started.');

        ZenX.send({ api: "sitemap", request: "init" }).success(function (response) {

            ZenX.winLoading('[data-module="sitemap"]', false);

            $scope.$apply(function () {

                var content = $compile(response.html)($scope);
                $('[data-module="sitemap"] .window-content').append(content);

                init(content);

            });

        });

    }]);

    function init(content) {

        var lastSearch = '';

        content.find('.cat-search').keyup(function () {

            fetchCat(this.value, content.find('.pool'), 0);

        });

        content.find('.pool').click(function (e) {

            var tar = $(e.target);

            if (tar.is('.icon-play3:not(.exp)')) {

                !tar.parent().next().find('*').length && fetchCat(tar.parent().parent().attr('data-id'), tar.parent().next(), 0, true);

                tar.parent().next().css('display', 'block');
                tar.addClass('exp');

            } else if (tar.is('.icon-play3.exp')) tar.removeClass('exp').parent().next().css('display', 'none');

            if (tar.is('.sitemap-fs .title')) {

                $('.sitemap-fs .selected').removeClass('selected');
                tar.addClass('selected');

                catToVp(tar.parent().attr('data-id'));

            }
                
        });

        function catToVp(catID) {

            // save

        }

        function fetchCat(query, target, skip, contents) {

            var curTs;
            skip = skip || 0;
            curTs = lastSearch = new Date().getTime();

            if (!query) return;

            ZenX.send({
                api: "sitemap",
                request: "sitemap-fetch",
                query: query,
                contents: contents
            }).success(function (response) {

                if (curTs != lastSearch) return;

                !skip && $(target).html('');

                response.data.forEach(function (i) {

                    var item = $('<div>');
                    item.attr('data-id', i._id)
                        .html(
                        '<div class="title">' +
                            '<span class="expand icon-play3"></span>' +
                            i.namespace +
                        '</div><div class="upool"></div>');

                    $(target).append(item);

                });
                
            });

        };

    }

    ZenX.modules[module.namespace] = module;

})();