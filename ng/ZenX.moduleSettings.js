ZenX.moduleSettings = function (settings, module) {

    var keywords = {
        $label: 1,
        $group: 1,
        $text: 1
    }

    var wrapper = '<div>';

    function htmlOf(key) {

        if (key in keywords) {

            if (key == '$label') {

                var text = ZenX.modules[module].text[settings[key]];
                return '<div class="settings-label">' + text + '</div>';

            }

        }

        return "";

    }

    Object.keys(settings).forEach(function (key) {

        var html = htmlOf(key);
        
        wrapper += html;

    });

    return wrapper += '</div>';

}