'use strict';

// Number of available CPUs that we will use
// as default number of clusters
var numCpus = require('os').cpus().length;

var ZenX = require('./../../main.js');

// Export ZenXPlatform class
module.exports = class ZenXPlatform extends ZenX {
	
	constructor(options) {
		
		// Inherit methods
		super();
		
		// Bind cluster lib to the ZenXPlatform object
		this.cluster = require('cluster');
		
		// Make object if undefined
		typeof options != 'object' && (options = {});
		
		// Bind options to our object to use later
		this.options = options;
		
		// Overwrite default port setting
		options.port = options.port || 10000;
		
		// Set default number of clusters if not
		// specified in options.numClusters
		this.numClusters = options.numClusters || numCpus;
		
		// Specify worker file
		this.cluster.setupMaster({exec: __dirname + '/platform.js'});
		
		// Create workers
		this.fillWorkerSlots();
		
		// On disconnect, kill and refill
		this.cluster.on('disconnect', (worker) => this._workerDisconnectHandler(worker));
		
		// Create cache server if specified
		if(options.createCache)	
			this.cacheServer = new this.CacheServer({
				bind: options.cacheBind,
				port: options.cachePort,
				databases: {
					usersdb: options.usersdb,
					systemdb: options.systemdb
				}
			});
		
	}
	
	// Forks workers until we have as many as this.numClusters
	fillWorkerSlots() {
		
		// Pass the options to the worker to get
		// connection info and more
		while(this.workersLength < this.numClusters) 
			this.cluster
				.fork()
				.send(JSON.stringify({
					cmd: 'init',
					options: this.options
				}));
		
	}
	
	// Returns the amount of active workers
	get workersLength() {
		
		return Object.keys(this.cluster.workers).length;
		
	}
	
	// Handler for disconnected workers
	_workerDisconnectHandler(worker) {
		
		worker.kill();
		process.nextTick(() => this.fillWorkerSlots());
		
	}
	
	// Restart all workers
	restart() {
		
		// Remove listener because we are
		// about to get disconnects we don't want to handle
		this.cluster.removeListener('disconnect', this._workerDisconnectHandler);
		
		// Kill all workers
		for(let worker of this.cluster.workers) worker.kill();
		
		// Make new workers after a small grace period of 2s
		setTimeout(() => this.fillWorkerSlots(),2000);
		
	}
	
}