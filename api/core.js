// ZenX Core API
// These are core methods used by the ZenX Manager client.
var shortid = require('shortid'),
    path    = require('path'),
    zx      = global.zx,
    jade    = global.jade,
    reqAuth = [
        "settings-template",
        "settings-vp",
        "user-change-image",
        "change-user-settings"
    ],
    jadeTemplates = {},
    fs      = require('fs');

// Have the files loaded so that we don't have to read
// from the hard drive on every request
jadeTemplates.settings = fs.readFileSync(path.resolve(__dirname+'/../layouts/settings.jade'));

module.exports = {

    // Login method with username and password that will return user data and a
    // session token if successful
    "login": function (data,db,req,res) {

        var server = this;

        // Get the users collection
        var collection = db.collection('Users');

        // Get username and password from request data
        var username = String(data.username),
            password = String(data.password);

        // If initial login, save user
        if (server.INITIAL_LOGIN) {

            collection.insert({
                username: username,
                password: require('password-hash').generate(password, { algorithm: "sha256", saltLength: 15 }),
                tokens: [],
                backgroundImage: server.SystemVars.DEFAULT_BACKGROUND_IMAGE,
                profileImage: server.SystemVars.DEFAULT_PROFILE_IMAGE,
                language: server.SystemVars.DEFAULT_LANGUAGE,
                level: 0,
                modules: {
                    system: {
                        permissions: {
                            all: 1
                        }
                    },
                    users: {
                        permissions: {
                            all: 1
                        }
                    }
                }
            }, function (err) {

                if (err) return zx.log("There was an error creating initial user.");

                zx.log("Initial user created successfully.");
                delete server.INITIAL_LOGIN;
                authenticate();

            });

        } else authenticate();

        function authenticate() {

            // Find the user that wants to log in
            collection.find({ username: username }).toArray(function (err, user) {

                var user = user[0],
                    valid_login = user && require('password-hash').verify(password, user.password);

                // Verify with hashed password
                if (valid_login) {

                    // Create a new session token
                    var session_token = zx.uuid(),
                        // Set an expiration date
                        expires = new Date().getTime() + 24 * 60 * 60 * 1000;

                    res.cookie('authtoken', session_token, { maxAge: 24 * 60 * 60 * 1000, httpOnly: true, secure: true });

                    // Clean expired or invalid tokens
                    collection.update({ username: username }, {
                        $pull: {
                            tokens: {
                                $or: [
                                    { expires: { $lte: new Date().getTime() } },
                                    { expires: { $type: 2 } }
                                ]
                            }
                        }
                    }, function () {

                        // If more than 10 tokens, delete until 10
                        collection.aggregate([
                            { $match: { username: username } },
                            { $project: { count: { $size: "$tokens" } } }
                        ], function (err, data) {

                            var data = data[0];

                            if (data.count - 10 > 0) {

                                for (var i = 0; i < data.count - 10; i++) {
                                    collection.update({ username: username }, { $unset: JSON.parse('{"tokens.' + i + '":1}') });
                                }

                                collection.update({ username: username }, { $pull: { tokens: null } });

                            }

                        });

                    });

                    // Push session token in document's tokens
                    collection.update({ username: username }, { $push: { tokens: { token: session_token, expires: expires } } });

                    // Remove password and other tokens from response
                    delete user.password;
                    delete user.tokens;

                    // Send response
                    res.send(JSON.stringify({
                        "message": "success",
                        "user": user,
                        "token": session_token,
                        "text": require(path.resolve(__dirname + './../lang.js'))[user.lang || 'en']
                    }));

                } else {
                    res.send(JSON.stringify({
                        "message": "bad_request",
                        "error": "invalid_user"
                    }));
                }

            });

        }

    },

    // Validates a session token to initialize the client
    "auth": function (data, db, req, res) {

        // Target database
        var Users = db.collection('Users');

        // Find user
        Users.find({
            tokens: {
                $elemMatch: {
                    token: String(req.cookies.authtoken),
                    expires: { $gt: new Date().getTime() }
                }
            }
        }).toArray(function (err, users) {

            var user = users[0];

            // If found, return data
            if (user) {

                // Remove password and other tokens from response
                delete user.password;
                delete user.tokens;

                res.cookie('authtoken', req.cookies.authtoken, { maxAge: 24 * 60 * 60 * 1000, httpOnly: true, secure: true });

                zx.log('Token authenticated for user: ' + user._id);
                res.send(JSON.stringify({
                    "message": "success",
                    "user": user,
                    "text": require(path.resolve(__dirname + './../lang.js'))[user.lang||'en']
                }));

            } else {

                res.clearCookie('authtoken');
                res.send(JSON.stringify({
                    "message": "bad_request"
                }));

            }

        });

    },

    // Destroys the token and all open WebSockets associated with it
    "purge-token": function (data, db, req, socket) {

        zx.log('Requested to purge token ' + socket.token);

        var server = this;
        var collection = db.collection('Users');

        collection.update({ tokens: { $elemMatch: { token: socket.token } } }, {
            $pull: {
                tokens: {
                    token: String(socket.token)
                }
            }
        });

        server.wsClients.forEach(function (socket) {
            socket.token == socket.token && socket.close();
        });

    },

    // Writes and returns settings template and data
    "settings-template": function (data, db, req, res, user) {

        var server = this;
        var Users = db.collection('Users');

        Users.find({ _id: user._id }, { modules: 1 }).toArray(function (err, m) {

            if (err) return res.send(JSON.stringify({
                "message": "bad_request"
            }));

            var moduleSettings = {};
            m = m[0];

            // Add settings template
            for (var i in m.modules) {

                if (!server.modules[i]) {
                    delete m.modules[i];
                    continue;
                }

                moduleSettings[i] = {
                    settings: server.modules[i].settings
                };

            }

            res.send(JSON.stringify({
                message: "success",
                requestID: data.requestID,
                template: jade.compile(jadeTemplates.settings, {})({ version: global.package.version }),
                modules: moduleSettings
            }));

        });

    },

    "refresh-session": function (data, db, req, res) {

        var server = this;
        var token = zx.newSession.call(server.auth);
        res.send(JSON.stringify({
            session_token: token,
            requestID: data.requestID
        }));

    },

    "settings-vp": function (data, db, req, res) {

        var server = this;
        var template = "";

        if (data.template == "user" && !data.isModule) template = jade.compile(fs.readFileSync(path.resolve(__dirname + '/../layouts/settings.user.jade')), {})({ version: global.package.version });
        if (data.template == "about" && !data.isModule) template = jade.compile(fs.readFileSync(path.resolve(__dirname + '/../layouts/settings.about.jade')), {})({ version: global.package.version });
        
        if (data.isModule) {

            if (server.modules[data.template]) {

                template = server.modules[data.template].settings;

                // Under construction
                template = "<div style='text-align: center; margin:20%;'>You do not have access to system settings right now</div>"

            }

        }

        res.send(JSON.stringify({
            message: "success",
            requestID: data.requestID,
            template: template
        }));

    },

    "user-change-image": function (data, db, req, res, user) {
        
        var newPath = path.resolve(__dirname + '/../assets/u/' + zx.uuid()) + '.' + req.files.file.path.split('.').pop();

        var rd = fs.createReadStream(req.files.file.path);
        var wr = fs.createWriteStream(newPath);
        wr.on('finish', function () {

            // Delete old unless it was the default one
            user.profileImage != "images/default.gif" && fs.unlink(path.resolve(__dirname + '/../assets' + user.profileImage));

            db.collection('Users').update({ username: user.username }, {
                $set: {
                    profileImage: newPath.split('\\').join('/').split('/assets')[1]
                }
            });

            res.send(JSON.stringify({
                message: "success",
                profileImage: newPath.split('\\').join('/').split('/assets')[1]
            }));

        });
        
        rd.pipe(wr);

    },

    "change-user-settings": function (data, db, req, res, user) {

        var set = {
            first_name: e('first_name') && data.settings.first_name,
            last_name: e('last_name') && data.settings.last_name,
            username: e('username') && data.settings.username,
            email: e('email') && data.settings.email,
            password: e('password') && (data.settings.password ? require('password-hash').generate(data.settings.password, { algorithm: "sha256", saltLength: 15 }) : undefined)
        };

        function e(p) { return user.modules.users.permissions.all || user.modules.users.permissions.own[p] }

        Object.keys(set).forEach(function (key) {

            if(set[key] === undefined) delete set[key]
            else set[key] = String(set[key]);

        });
        db.collection('Users').update({ _id: user._id }, { $set: set });

        res.send(JSON.stringify({
            requestID: data.requestID,
            message: "success"
        }));

    }

}

// Set auth flag to declare that only authenticated users can have access
// to this method
reqAuth.forEach(function (request) {
    module.exports[request].auth = true;
});