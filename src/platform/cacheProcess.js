/* global config */
/* global dbcs */
'use strict';

// Load an instance of zenx lib and
// make it available to all modules
// of this process
global.zenx = new (global.ZenX = require('./../../main.js'));

// Index storage
global.indexes = {};

// Name the process
process.title = 'zenx-cache';

// Handle init message
process.on('message', function(jsonMessage){
	
	var mongodb = require('mongodb');
	var dbConnectionsPromises = [];
	
	// Parse json message
	var options = JSON.parse(jsonMessage);
	global.config = options;
	
	// Create cache server
	var cacheServer;
	dbConnectionsPromises.push(new Promise((resolve) => (cacheServer = new zenx.Server({
		bind: options.bind,
		port: options.port
	})).once('start', resolve)));
	
	// Database connections storage
	global.dbcs = {};
	
	// Connect to mongodb databases
	// and save connections
	for(let db in config.databases)
		dbConnectionsPromises.push(new Promise((resolve)=>{
			mongodb.connect(
				config.databases[db], 
				(err, dbc) => {
					global.dbcs[db] = dbc;
					global.indexes[db] = {};
					resolve();
				}
			);
		}));
	
	// Send started message
	Promise.all(dbConnectionsPromises)
		   .then(() => {
	console.log('cache process started2 ' + options.bind + ':' + options.port);
			   process.send({ evt: 'start' })});
		   
	// Handle requests
	cacheServer.router.post('/', (req, res, next) => {
		
		console.log('request received');
		let respond = (err, data) => {
		
		console.log('respond called');
			res.end(JSON.stringify([err, data]));
		}
		// Parse request
		let request = req.body;
		let cmd = request.cmd;
		let args = request.args = JSON.parse(request.args);
		
		// @todo Add security; possibly with http-bouncer
		if(cmd == 'get'){
		
			let queryObject;
			
		console.log('got in get');
			if(typeof args[2] == 'object') 
				queryObject = args[2];
			else {
				args[3] === undefined && (args[3] = { $exists: 1 });
				queryObject = {
					[args[2]]: args[3]
				};
			}
			
			dbcs[args[0]].collection(args[1]).find(queryObject).toArray(respond);
		
		}
		
		if(cmd == 'upsert'){
			
			dbcs[args['0']].collection(args['1']).update(
				{ _id: mongodb.ObjectID(args['2']._id) },
				args['2'],
				{ upsert: true },
				respond
			);
			
		}
		
		if(cmd == 'remove'){
			
			dbcs[args['0']].collection(args['1']).remove(
				{ _id: args['2']._id },
				respond
			);
			
		}
		
		
	});
	
});