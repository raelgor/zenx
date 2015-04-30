// ZenX Core API
// These are core methods used by the ZenX Manager client.
var shortid = require('shortid'),
    path    = require('path'),
    zenOut  = require(path.resolve(__dirname + './../zenOut.js')),
    jade    = global.jade,
    reqAuth = [
        "settings-template"
    ];

module.exports = {

    // Login method with username and password that will return user data and a
    // session token if successful
    "login": function (data,db,req,res) {

        // Get the users collection
        var collection = db.collection('Users');

        // Get username and password from request data
        var username = data.username,
            password = data.password;

        // If initial login, save user
        if (global.INITIAL_LOGIN) {

            collection.insert({
                username: username,
                password: require('password-hash').generate(password, { algorithm: "sha256", saltLength: 15 }),
                tokens: [],
                backgroundImage: global.SystemVars.DEFAULT_BACKGROUND_IMAGE,
                profileImage: global.SystemVars.DEFAULT_PROFILE_IMAGE,
                language: global.SystemVars.DEFAULT_LANGUAGE,
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

                if (err) return zenOut("There was an error creating initial user.");

                zenOut("Initial user created successfully.");
                delete global.INITIAL_LOGIN;
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
                    var session_token = shortid.generate(),
                        // Set an expiration date
                        expires = new Date().getTime() + 24 * 60 * 60 * 1000;

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
                        "message": "bad_request"
                    }));
                }

            });

        }

    },

    // Called first when a new WebSocket connection opens from the client
    // in order to authenticate for use of features like chat or notifications
    "ws-auth": function (data, db, req, socket) {

        zenOut('WebSocket Auth request received from ' + socket.upgradeReq.client.remoteAddress + ':' + socket.upgradeReq.client.remotePort + ' with token ' + data.token);

        var collection = db.collection('Users');

        collection.find({
            tokens: {
                $elemMatch: {
                    token: data.token,
                    expires: { $gt: new Date().getTime() }
                }
            }
        }, { _id: 1, tokens: 1 }).toArray(function (err, user) {

            if (user.length) {

                zenOut('Socket authenticated for user: ' + user[0]._id);
                socket.ZenXAuth  = true;
                socket.ZenXUser  = user[0]._id;
                socket.ZenXToken = data.token;
                socket.send(JSON.stringify({
                    "requestID": data.requestID,
                    "message": "success"
                }));

                // Kill socket when token expires
                var expires = user[0].tokens.filter(function (t) {
                    return t.token == data.token
                })[0].expires - new Date().getTime();

                socket.expiresTimeout = setTimeout(function () {
                    socket.close();
                }, expires);

            } else {

                socket.send(JSON.stringify({
                    "requestID": data.requestID,
                    "message": "bad_request"
                }));

            }

        });


    },

    // Validates a session token to initialize the client
    "auth": function (data, db, req, res) {

        var collection = db.collection('Users');

        collection.find({
            tokens: {
                $elemMatch: {
                    token: data.token,
                    expires: { $gt: new Date().getTime() }
                }
            }
        }).toArray(function (err, user) {

            if (user.length) {

                zenOut('Token authenticated for user: ' + user[0]._id);
                res.send(JSON.stringify({
                    "message": "success",
                    "user": user[0],
                    "token": data.token,
                    "text": require(path.resolve(__dirname + './../lang.js'))[user[0].lang||'en']
                }));

            } else {

                res.send(JSON.stringify({
                    "message": "bad_request"
                }));

            }

        });

    },

    // Destroys the token and all open WebSockets associated with it
    "purge-token": function (data, db, req, socket) {

        zenOut('Requested to purge token ' + data.token);
        var collection = db.collection('Users');

        collection.update({ tokens: { $elemMatch: { token: data.token } } }, {
            $pull: {
                tokens: {
                    token: data.token
                }
            }
        });

        global.wsClients.forEach(function (socket) {
            socket.token == data.token && socket.close();
        });

    },

    // Writes and returns settings template and data
    "settings-template": function (data, db, req, res) {

    }

}

// Set auth flag to declare that only authenticated users can have access
// to this method
reqAuth.forEach(function (request) {
    module.exports[request].auth = true;
});