'use strict';

module.exports = function () {
	var _this = this;

	return new Promise(function (resolve) {

		var config = _this.config;

		// Start server as specified in config
		if (config.ssl) {
			_this.httpServer = require('https').createServer({
				key: config.sslCert.key,
				cert: config.sslCert.cert,
				ca: config.sslCert.ca,
				passphrase: config.passphrase
			}, _this.server);
		} else _this.httpServer = require('http').createServer(_this.server);

		// Start and bind a WebSocket server if
		// specified in config
		if (config.ws) {

			var ws = require('ws');
			var headers = {};

			if (config.serverHeader) headers.server = 'ZenX/' + require('./../../package.json').version;

			// Start and bind websocket server
			_this.ws = new ws.Server({
				server: _this.server,
				headers: headers
			});
		}

		// Callback
		_this.httpServer.listen(config.port, config.bind, resolve);
	});
};