'use strict';
var emitter = require('events').EventEmitter;
var util = require("util");
		
module.exports = class ZenXServer {
	
	constructor(options) {
		
		// In case of no options
		!options && (options = {});
		
		// Load default configuration
		this.config = require('./defaultServerConfig.js');
		
		// Set initial status
		this.status = -1;
		
		// Overwrite defaults
		for(let option in this.config)
			this.config[option] = options[option] || this.config[option];
		
		// Inherit event emitter
		emitter.call(this);
		
		// Start the server
		this.start();
		
	}
	
}

module.exports.prototype.start = require('./start.js');
module.exports.prototype._makeExpressApp = require('./makeExpressApp.js');
module.exports.prototype._makeServer = require('./makeServer.js');
module.exports.prototype.stop = require('./stop.js');
module.exports.prototype.__proto__ = emitter.prototype;

// @todo Find out why this doen't work
//       util.inherits(module.exports, emitter);