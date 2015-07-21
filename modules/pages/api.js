var api = {},
    path = require('path'),
    text = {},
    fs = require('fs');

fs.readdirSync(path.resolve(__dirname + '/client/lang')).toString().split(',').forEach(function (lang) {

    text[lang.split('.')[0]] = require(path.resolve(__dirname + '/client/lang/' + lang));

});


module.exports = {
    api: api,
    settings: {

        $label: "SETTINGS_LABEL",

        live_cpu_and_mem: {
            $index: 0,
            $label: "LIVE_CPU_AND_MEM",
            $type: "boolean",
            $default: true,
            $permissions: ["sysadmin"]
        },

        live_cpu_and_mem_interval: {
            $index: 1,
            $label: "LIVE_CPU_AND_MEM_INTERVAL",
            $type: "float",
            $default: 1000,
            $minimum: 1000,
            $dependencies: ["live_cpu_and_mem"],
            $permissions: ["sysadmin"]
        },

        $group: {
            $id: "cool-group",
            $index: 2,
            $label: "SETTINGS_LABEL"
        }

    },
    text: text
}