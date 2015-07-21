var fs = require('fs'),
    path = require('path'),
    express = require('express');

// Management layer over zx.Server
function factory(config) {

    var server = new global.zx.Server(config);
    server.modules = {};

    function onstart() {

        // Always add cache control header
        server.Router.use(function (req, res, next) {
            res.setHeader("Cache-Control", "max-age=31104000");
            return next();
        });

        server.api.core = require(path.resolve(__dirname + '/../api/core.js'));

        // Serve static content in assets folder as is
        server.Router.use(express.static(__dirname + '/../assets'));

        // Serve static content of modules
        fs.readdirSync(path.resolve(__dirname + '/../modules'))
          .toString()
          .split(',')
          .forEach(function (module) {

              _path = path.resolve(__dirname + '/../modules/' + module + '/api.js');

              server.modules[module] = require(_path);
              server.api[module] = server.modules[module].api;

        });

        Object.keys(server.modules)
              .forEach(function (dir) {

                  var _path = express.static(__dirname + '/../modules/' + dir + '/client');
                  server.Router.use('/modules/' + dir, _path);
              });

        // Serve app
        server.Router.get('/', function (req, res, next) {

            var fn = jade.compileFile(__dirname + '/../layouts/app.jade', {});

            res.send(fn({
                baseUrl: '/',
                lang: global.languages["en"],
                version: package.version,
                csrf: zx.newSession.call(server.auth)
            }));
            zx.log("Served an HTTPS request just now.");

            res.end();

        });

    }

    server.onstart = onstart;

    return server;

}

// Export constructor
module.exports = factory;