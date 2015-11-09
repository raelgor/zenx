'use strict'

/* global zenx */
;
module.exports = function (message) {

	var fs = require('fs');
	var path = require('path');
	var mongodb = require('mongodb');

	// Pass server options as specified
	// by master process
	var options = message.options;

	// and make them available to all modules
	global.config = options;

	// Initialize cache client
	global.cache = new zenx.CacheClient(options);

	// Overwrite assets dir
	options.static = './../../assets';

	// Make zenx server cluster
	var server = new zenx.Server(options);

	// Load templates
	var templates = {};
	var tmpDir = fs.readdirSync(path.resolve(__dirname, './../templates'));

	var _iteratorNormalCompletion = true;
	var _didIteratorError = false;
	var _iteratorError = undefined;

	try {
		for (var _iterator = tmpDir[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
			var file = _step.value;

			templates[file] = zenx.util.jade.compileFile(path.resolve(__dirname, './../templates/' + file));
		} // Connect to mongodb
	} catch (err) {
		_didIteratorError = true;
		_iteratorError = err;
	} finally {
		try {
			if (!_iteratorNormalCompletion && _iterator.return) {
				_iterator.return();
			}
		} finally {
			if (_didIteratorError) {
				throw _iteratorError;
			}
		}
	}

	mongodb.connect(options.systemdb, function (err, db) {
		return global.systemdb = db.collection('systemdb');
	});
	mongodb.connect(options.usersdb, function (err, db) {
		return global.usersdb = db.collection('usersdb');
	});

	// Load APIs
	server.api = {};
	server.api.core = {};
	server.api.core.login = require('./../api/login.js');

	// Load bouncer rules
	require('./../bounceRules.js')(server.bouncer);

	// Authenticate
	server.router.use(function (req, res, next) {

		var token = req.cookies.auth;

		// If no cookie, leave `req.user` unset
		if (!token) return next();

		cache.get('usersdb', 'usersdb', 'sessions.' + token);
	});

	// Load routes
	server.router.all('/api', function (req, res, next) {

		// Make request object
		var request = req.body || {};

		// Validate request object
		for (var key in request) if (typeof request[key] != 'string') return res.end();

		// Pass from bouncer
		request.group = 'platform-api';
		if (!server.bouncer.check(request)) return res.end();

		// Bind request object to req stream
		req.APIRequest = request;

		// Request accepted
		request.api in server.api && request.request in server.api[request.api] ? server.api[request.api][request.request].apply(server, arguments) : res.end('bad request');
	});

	server.router.all('/', function (req, res, next) {

		res.send(templates['app.jade']({
			config: options,
			template: '',
			clientData: {}
		}));
	});
};