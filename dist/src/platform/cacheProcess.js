/* global config */
/* global dbcs */
'use strict'

// Load an instance of zenx lib and
// make it available to all modules
// of this process
;

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _typeof(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; }

global.zenx = new (global.ZenX = require('./../../main.js'))();

// Index storage
global.indexes = {};

// Handle init message
process.on('message', function (jsonMessage) {

	var mongodb = require('mongodb');
	var dbConnectionsPromises = [];

	// Parse json message
	var options = JSON.parse(jsonMessage);
	global.config = options;

	// Create cache server
	var cacheServer;
	dbConnectionsPromises.push(new Promise(function (resolve) {
		return (cacheServer = new zenx.Server({
			bind: options.bind,
			port: options.port
		})).once('start', resolve);
	}));

	// Database connections storage
	global.dbcs = {};

	// Connect to mongodb databases
	// and save connections

	var _loop = function _loop(db) {
		dbConnectionsPromises.push(new Promise(function (resolve) {
			mongodb.connect(config.databases[db], function (err, dbc) {
				global.dbcs[db] = dbc;
				global.indexes[db] = {};
				resolve();
			});
		}));
	};

	for (var db in config.databases) {
		_loop(db);
	} // Send started message
	Promise.all(dbConnectionsPromises).then(function () {
		return process.send({ evt: 'start' });
	});

	// Handle requests
	cacheServer.router.post('/', function (req, res, next) {

		var respond = function respond(err, data) {
			return res.end(JSON.stringify([err, data]));
		};

		// Parse request
		var request = req.body;
		var cmd = request.cmd;
		var args = request.args = JSON.parse(request.args);

		// @todo Add security; possibly with http-bouncer
		if (cmd == 'get') {

			var queryObject = undefined;

			if (_typeof(args[2]) == 'object') queryObject = args[2];else {
				args[3] === undefined && (args[3] = { $exists: 1 });
				queryObject = _defineProperty({}, args[2], args[3]);
			}

			dbcs[args[0]].collection(args[1]).find(queryObject).toArray(respond);
		}

		if (cmd == 'upsert') {

			dbcs[args['0']].collection(args['1']).update({ _id: mongodb.ObjectID(args['2']._id) }, args['2'], { upsert: true }, respond);
		}

		if (cmd == 'remove') {

			dbcs[args['0']].collection(args['1']).remove({ _id: args['2']._id }, respond);
		}
	});
});