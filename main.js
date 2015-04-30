// ZenX Server
var express     = require('express'),
    fs          = require('fs'),
    mongodb     = require('mongodb').MongoClient,
    ws          = require('ws'),
    wss         = null,
    _           = require('lodash'),
    wsClients   = [],
    package     = require('./package.json'),
    compression = require('compression'),
    path        = require('path'),
    zenOut      = require('./zenOut.js'),
    bodyParser  = require('body-parser'),
    api         = {},
    prompt      = require('prompt'),
    jade        = global.jade = require('jade');

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

// Will start a server for the ZenX Manager client in the ip and port
// specified in the options object
module.exports.start = function (config) {

    zenOut("Starting...");
    global.config = config;

    // ZenX requires a database to initialize itself
    mongodb.connect(config.db_host, init);
    zenOut("Connecting to MongoDB...");

};

// Start doing anything that needs a database
function init(err, db) {

    zenOut("MongoDB connected.");
    global.db = db;

    // Load system variables or initialize
    var System = db.collection('System'),
        Users  = db.collection('Users');

    zenOut("Checking for users...");
    Users.find().toArray(function (err, users) {

        if (err) return zenOut("There was an error checking for users.");

        if (!users.length) {

            zenOut("No ZenXManager users found in database. Flagging as initial login.");
            global.INITIAL_LOGIN = true;

        } else zenOut("Found " + users.length + " users.");

    });

    zenOut("Loading system variables...");
    System.find().toArray(function (err, keys) {

        var vars = {};

        keys.forEach(function (k) { vars[k.key] = k.value; });

        if (!vars.INITIALIZED) {

            zenOut("System keys are missing. Initializing...");

            keys = [
                { key: 'MAX_HTTP_UPLOAD_SIZE',     value: '5mb' },
                { key: 'ZENX_MANAGER_SSL_CERT',    value: '/ssl/ssl.crt' },
                { key: 'ZENX_MANAGER_SSL_KEY',     value: '/ssl/ssl.key' },
                { key: 'INITIALIZED',              value: '1'},
                { key: 'DEFAULT_BACKGROUND_IMAGE', value: 'images/bg6.jpg' },
                { key: 'DEFAULT_PROFILE_IMAGE',    value: 'images/default.gif' },
                { key: 'DEFAULT_LANGUAGE',         value: 'en' }
            ];

            System.insert(keys, function (err) {
                if (!err) zenOut("System keys added.");
                else zenOut("There was an error adding system variables.");
            });

            keys.forEach(function (k) { vars[k.key] = k.value; });
                
        }

        global.SystemVars = vars;
        startServer(false);

    });

    // Load core api
    api.core = require('./controllers/core.js');

}

// Start or restart the ZenX Manager server
function startServer(restart) {

    var db = global.db;

    function start(){

        var zenxServer = express(),
            SystemVars = global.SystemVars;

        // Use compression on all requests
        zenxServer.use(compression());
        zenxServer.disable('x-powered-by');

        // Add server stamp globally
        zenxServer.use('*', function (req, res, next) {
            res.setHeader('Server', 'ZenX/' + package.version);
            return next();
        });

        // Parse json posts
        zenxServer.use(bodyParser.json({ limit: SystemVars.MAX_HTTP_UPLOAD_SIZE }));

        // Start listening for api calls via post
        zenxServer.post("/api", function (req, res, next) {
            api[req.body.api][req.body.request](req.body, db, req, res);
        });

        // Make assets folder publically accessible
        zenxServer.use(require('./controllers/static'));

        // Start https server with default SSL certificate
        global.ZenXManager = require('https').createServer({
            key:  fs.readFileSync(path.resolve(__dirname + SystemVars.ZENX_MANAGER_SSL_KEY )),
            cert: fs.readFileSync(path.resolve(__dirname + SystemVars.ZENX_MANAGER_SSL_CERT))
        }, zenxServer).listen(config.zenx_client_port, config.zenx_client_bind);

        // Start and bind websocket server
        global.wss = new ws.Server({ server: ZenXManager });

        // Start listening for websocket connections
        global.wss.on('connection', function (socket) {

            // Save the new socket
            wsClients.push(socket);

            // Handle messages
            socket.on('message', function (data, flags) {

                var message = JSON.parse(data);

                if (socket.ZenXAuth || (message.api == "core" && message.request == "ws-auth"))
                    api[message.api][message.request](message, db, data, socket);

            });

            // Remove from memory if closed
            socket.on('close', function () {
                _.remove(wsClients, socket);
            });

        });

        zenOut("Server started.");

    }

    if (restart) {

        zenOut("Restarting server...");
        zenOut("Closing WebSocket server...");

        global.wss.close();
        zenOut("WebSocket server closed. Closing ZenXManager server...");
        global.ZenXManager.close(function () {

            zenOut("ZenXManager server closed. Restarting...");
            delete global.wss;
            delete global.ZenXManager;
            start();

        });

    } else start();

};

// Make proccess immortal
process.on('uncaughtException', function (err) {

    zenOut('Uncaught exception caught.');
    console.log(err);
    zenOut('Resuming...');

});