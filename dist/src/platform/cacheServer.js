'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var emitter = require('events').EventEmitter;

var child_process = require('child_process');

// Makes a child process that will store cached data
// and start a server
// @todo Make it clustered
module.exports = (function () {
	function ZenXCacheServer(options) {
		var _this = this;

		_classCallCheck(this, ZenXCacheServer);

		this.cacheProcess = child_process.fork(__dirname + '/cacheProcess.js');

		this.cacheProcess.send(JSON.stringify(options));

		// Inherit event emitter
		emitter.call(this);

		// Event channel
		this.cacheProcess.on('message', function (message) {

			message.evt && _this.emit(message.evt);
		});
	}

	// Kill process

	_createClass(ZenXCacheServer, [{
		key: 'kill',
		value: function kill() {

			this.cacheProcess.kill('SIGHUP');
		}
	}]);

	return ZenXCacheServer;
})();

module.exports.prototype.__proto__ = emitter.prototype;