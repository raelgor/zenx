'use strict';
var emitter = require('events').EventEmitter;

var cluster = require('cluster');

// Makes a child process that will store cached data
// and start a server
// @todo Make it clustered
module.exports = class ZenXCacheServer {
	
	constructor (options) {
		
		cluster.setupMaster({exec: __dirname + '/cacheProcess.js'});
		
		this.cacheProcess = cluster.fork(__dirname + '/cacheProcess.js');
		
		this.cacheProcess.send(
			JSON.stringify(options)
		);
		
		// Inherit event emitter
		emitter.call(this);
		
		// Event channel
		this.cacheProcess.on('message', (message) => {
			
			message.evt && this.emit(message.evt);
			
		});
		
	}
	
	// Kill process
	kill() {
		
		this.cacheProcess.kill('SIGHUP');
		
	}	
	
}

module.exports.prototype.__proto__ = emitter.prototype;