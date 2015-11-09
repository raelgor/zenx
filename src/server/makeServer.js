module.exports = function() {
	
	return new Promise((resolve) => {
		
		var config = this.config;
		
		// Start server as specified in config
		if(config.ssl){ 
			this.httpServer = require('https').createServer({
				key: config.sslCert.key,
				cert: config.sslCert.cert,
				ca: config.sslCert.ca,
				passphrase: config.passphrase
			}, this.server)
		}
		else this.httpServer = require('http').createServer(this.server);
		
		// Start and bind a WebSocket server if
		// specified in config
		if(config.ws){
			
			var ws = require('ws');
			var headers = {};
			
			if(config.serverHeader)
				headers.server = 'ZenX/' + 
					require('./../../package.json').version;
			
			// Start and bind websocket server
			this.ws = new ws.Server({
				server: this.server,
				headers: headers
			});
			
		}
		
		// Callback
		this.httpServer.listen(config.port, config.bind, resolve);
		
	});
	
}