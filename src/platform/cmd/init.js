'use strict';

/* global cache */
/* global zenx */
module.exports = function(message){
	
	var fs = require('fs');
	var path = require('path');
	var mongodb = require('mongodb');
	
	// Pass server options as specified
	// by master process
	var options = message.options;
	
	// and make them available to all modules
	global.config = options;
	
	// Initialize cache client
	global.cache = new zenx.CacheClient({
		bind: options.cacheBind,
		port: options.cachePort
	});
	
	// Overwrite assets dir
	options.static = './../../assets';
	
	// Make zenx server cluster
	var server = new zenx.Server(options);
	
	// Load templates
	var templates = {};
	var tmpDir = fs.readdirSync(path.resolve(__dirname, './../templates'));
	
	for(let file of tmpDir)
		templates[file] = zenx.util
							  .jade
							  .compileFile(path.resolve(__dirname, './../templates/' + file));
	
	// Connect to mongodb
	mongodb.connect(options.systemdb, (err, db) => global.systemdb = db.collection('systemdb'));
	mongodb.connect(options.usersdb, (err, db) => global.usersdb = db.collection('usersdb'));
	
	// Load APIs
	server.api = {};
	server.api.core = {};
	server.api.core.login = require('./../api/login.js');
	
	// Load bouncer rules
	require('./../bounceRules.js')(server.bouncer);
	
	// Authenticate
	server.router.use((req, res, next) => {
		
		let token = req.cookies.auth;
		
		// If no cookie, leave `req.user` unset
		if(!token) return next();
		
		cache.get('usersdb', 'usersdb', 'sessions.' + token);
		
	});
	
	// Load routes
	server.router.all('/api', function(req, res, next) {
		
		// Make request object
		var request = req.body || {};
		
		// Validate request object
		for(var key in request) 
			if(typeof request[key] != 'string')
				return res.end();
		
		// Pass from bouncer
		request.group = 'platform-api';
		if(!server.bouncer.check(request)) return res.end();
		
		// Bind request object to req stream
		req.APIRequest = request;
		
		// Request accepted
		request.api in server.api &&
		request.request in server.api[request.api] ?
		server.api[request.api][request.request].apply(server, arguments) :
		res.end('bad request');
		
	});
	
	server.router.all('/', (req, res, next) => {
		
		res.send(templates['app.jade']({ 
			config: options,
			template: '',
			clientData: {}
		}));
		
	});
		
}