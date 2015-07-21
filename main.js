// ZenX Server
var express     = require('express'),
    fs          = require('fs'),
    mongodb     = require('mongodb').MongoClient,
    ws          = require('ws'),
    wss         = null,
    _           = require('lodash'),
    wsClients   = [],
    package     = global.package = require('./package.json'),
    compression = require('compression'),
    path        = require('path'),
    bodyParser  = require('body-parser'),
    api         = global.api = {},
    prompt      = require('prompt'),
    jade        = global.jade = require('jade'),
    bouncer     = require('http-bouncer'),
    os          = require('os'),
    zx = global.zx = {};

fs.readdirSync(path.resolve(__dirname + '/zx')).toString().split(',').forEach(function (file) {

    var key = file.split('.')[1];
    zx[key] = require(path.resolve(__dirname + '/zx/' + file ));

});

// Add bouncing rule
bouncer.config.JSON_API_CALLS.push({
    MATCH: {
            api: "core",
            request: "login"
    },
    INTERVAL: 10000,
    LIMIT: 10,
    INCLUDE_IP: false,
    INCLUDE_FROM_MATCH: ["username"]
});

// Debugger CLI
prompt.start();
prompt.message = "";
prompt.delimiter = "";

(function contPrompt() {
    prompt.get([{ name: "code", message: " " }], function (err, result) {
        try { console.log(eval(result.code)); } catch (x) { console.log(x); }
        result.code != "^C" && contPrompt();
    });
    console.log('..\n');
})();

// Load system languages
global.languages = require('./lang.js');

// Make WebSocket clients available to all modules
global.wsClients = wsClients;

// Make proccess immortal
process.on('uuncaughtException', function (err) {

    zx.log('Uncaught exception caught.');
    console.log(err);
    zx.log('Resuming...');

});

module.exports = zx;