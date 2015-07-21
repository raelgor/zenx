function factory(config) {

    var mongodb = require('mongodb').MongoClient,
        ws = require('ws'),
        wss = null,
        _ = require('lodash'),
        compression = require('compression'),
        express = require('express'),
        path = require('path'),
        bodyParser = require('body-parser'),
        api = global.api = {},
        prompt = require('prompt'),
        fs = require('fs'),
        jade = global.jade = require('jade'),
        package = global.package = require(path.resolve(__dirname + '/../package.json')),
        os = require('os'),
        lang = global.languages,
        helmet = require('helmet'),
        cookieParser = require('cookie-parser'),
        multipart = require('connect-multiparty'),
        methodOverride = require('method-override'),
        zx = global.zx;


    var server = {
        STATUS: 0,
        db: null,
        server: null,
        SystemVars: {},
        config: config,
        wsClients: [],
        api: {},
        bouncer: require('http-bouncer'),
        Router: express.Router(),
        auth: {
            sessions: {}
        }
    };

    zx.log("Creating ZenX Server on " + config.bind + ":" + config.port + "...");

    // ZenX requires a database to initialize itself
    mongodb.connect(config.db_host, init);
    zx.log("Connecting to MongoDB on " + config.db_host + "...");

    function init(err, db) {

        zx.log("MongoDB connected.");
        server.db = db;

        // Load system variables or initialize
        var System = db.collection('System'),
            Users = db.collection('Users');

        zx.log("Checking for users...");
        Users.find().toArray(function (err, users) {

            if (err) return zx.log("There was an error checking for users.");

            if (!users.length) {

                zx.log("No ZenXManager users found in database. Flagging as initial login.");
                server.INITIAL_LOGIN = true;

            } else zx.log("Found " + users.length + " users.");

        });

        zx.log("Loading system variables...");

        System.find().toArray(function (err, keys) {

            var vars = {};

            keys.forEach(function (k) { vars[k.key] = k.value; });

            if (!vars.INITIALIZED) {

                zx.log("System keys are missing. Initializing...");

                keys = [
                    { key: 'MAX_HTTP_UPLOAD_SIZE', value: '5mb' },
                    { key: 'INITIALIZED', value: '1' },
                    { key: 'DEFAULT_BACKGROUND_IMAGE', value: 'images/bg6.jpg' },
                    { key: 'DEFAULT_PROFILE_IMAGE', value: 'images/default.gif' },
                    { key: 'DEFAULT_LANGUAGE', value: 'en' },
                    { key: 'KILL_UNAUTH_WEBSOCKET_TIMEOUT', value: '5000' }
                ];

                System.insert(keys, function (err) {
                    if (!err) zx.log("System keys added.");
                    else zx.log("There was an error adding system variables.");
                });

                keys.forEach(function (k) { vars[k.key] = k.value; });

            }

            server.SystemVars = vars;
            startServer.call(server);

        });

    }


    // Start or restart the ZenX Manager server
    function startServer() {

        var db = this.db
        server = this,
        Users = db.collection('Users');

        var zenxServer = express(),
            SystemVars = this.SystemVars,
            config = this.config;

        // First limit upload
        zenxServer.use(bodyParser.raw({
            limit: SystemVars.MAX_HTTP_UPLOAD_SIZE
        }));

        // Bounce by IP if request is of valid size
        zenxServer.use('*', function (req, res, next) {
            server.bouncer({
                connection: {
                    remoteAddress: server.config.isBehindProxy ? socket.upgradeReq.headers['x-forwarded-for'] : req.connection.remoteAddress
                }
            }, res, next);
        });

        // Parse json api requests
        zenxServer.use(bodyParser.json({
            uploadDir: './assets/u',
            extended: true
        }));

        // Check for csrf token in post json api requests
        zenxServer.post('/api', function (req, res, next) {

            console.log('csrf check for ' + req.headers['x-csrf-token']);
            console.log('in ', server.config.port);
            if (!(req.headers['x-csrf-token'] in server.auth.sessions)) return res.end('invalid-csrf');
            next();

        });

        // Add server stamp globally
        zenxServer.use('*', function (req, res, next) {
            res.setHeader('Server', 'ZenX/' + package.version);
            res.setHeader('Connection', 'Keep-Alive');
            res.setHeader('Keep-Alive', 'timeout=15, max=100');
            return next();
        });

        zenxServer.use(helmet.xssFilter());
        zenxServer.use(cookieParser());

        // Use compression on all requests
        zenxServer.use(compression({ filter: function () { return true; } }));
        zenxServer.disable('x-powered-by');

        zenxServer.use(multipart());
        zenxServer.use(methodOverride());

        // Place bouncer for JSON API only
        zenxServer.use('*', function (req, res, next) { server.bouncer(req, res, next, true); });

        // Start listening for api calls via post
        zenxServer.post("/api", function (req, res, next) {

            try {

                var reqApi = server.api[req.body.api][req.body.request];
                if (reqApi.auth) {

                    Users.find({
                        tokens: { $elemMatch: { token: String(req.cookies.authtoken) } }
                    }).toArray(function (err, user) {

                        if (err) return res.send('{"message":"bad_request", "error":"error_finding_token"}');

                        reqApi.call(server, req.body, db, req, res, user[0]);

                    });

                } else reqApi.call(server, req.body, db, req, res);

            } catch (x) { console.log(x); res.send('{"message":"bad_request","error":"post_crash"}'); }

            // If files were uploaded, delete them from temp
            // two seconds later
            setTimeout(function () {

                if (req.files) {
                    Object.keys(req.files).forEach(function (key) {
                        fs.unlink(req.files[key].path);
                    });
                }

            }, 20000)

        });

        // Custom router
        zenxServer.use(server.Router);

        zenxServer.get('*', function (req, res, next) {

            res.writeHead(404, 'Not found');

            res.end('404: It is precisely what you are looking for that you will not find here.');

        });

        // Start https server with default SSL certificate
        if (config.https) server.server = require('https').createServer({
            key: fs.readFileSync(config.ssl_key),
            cert: fs.readFileSync(config.ssl_crt)
        }, zenxServer)
        else server.server = require('http').createServer();

        server.server.listen(config.port, config.bind);

        server.server.on('connection', function (socket) {
            socket.setTimeout(15 * 1000);
        });

        // Start and bind websocket server
        config.ws && (server.wss = new ws.Server({
            server: server.server,
            headers: {
                server: 'ZenX/' + package.version
            }
        }));

        // Start listening for websocket connections
        config.ws && server.wss.on('connection', function (socket) {

            var token;

            if (!server.bouncer({
                connection: {
                remoteAddress: socket.upgradeReq.client.remoteAddress
            }
            })) return socket.close();

            token = socket.upgradeReq.headers.cookie.split('authtoken=')[1].split(';')[0];

            if (!token) return socket.close();

            // Find user
            db.collection('Users').find({
                tokens: {
                    $elemMatch: {
                        token: String(token),
                        expires: { $gt: new Date().getTime() }
                    }
                }
            }).toArray(function (err, users) {

                var user = users[0];

                // If found, return data
                if (user) initSocket(user, token); else {

                    socket.send('{"message":"bad_request"}');
                    socket.close();

                }

            });

            function initSocket(user, token) {

                // Only one active connection per user
                server.wsClients.forEach(function (s) {

                    s.user._id == user._id && s.close();

                });

                socket.user = user;
                socket.token = token;

                // Save the new socket
                server.wsClients.push(socket);

                // Handle messages
                socket.on('message', function (data, flags) {

                    try {

                        var message = JSON.parse(data);

                        if (!server.bouncer({
                            connection: {
                            remoteAddress: server.config.isBehindProxy ? socket.upgradeReq.headers['x-forwarded-for'] : socket.upgradeReq.client.remoteAddress
                        },
                            body: message
                        }, false, false, true)) return socket.send('{"message":"bad_request_bounced"}');

                        var reqApi = server.api[message.api][message.request];

                        reqApi.call(server, message, db, data, socket, socket.user);

                    } catch (x) {
                        socket.send('{"message":"bad_request", "err": "' + String(x) + '"}');
                    }

                });

                // Remove from memory if closed
                socket.on('close', function () {
                    _.remove(server.wsClients, socket);
                });

            }


            // Remove from memory if closed
            socket.on('close', function () {
                clearTimeout(socket.expiresTimeout);
                _.remove(wsClients, socket);
            });

        });

        zx.log("Server started.");

        server.server = zenxServer;
        server.onstart && server.onstart();

    };

    return server;

}

module.exports = factory;