'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var querystring = require('querystring');
var http = require('http');

module.exports = (function () {
	function ZenXCacheClient(config) {
		_classCallCheck(this, ZenXCacheClient);

		this._config = config;
	}

	_createClass(ZenXCacheClient, [{
		key: 'get',
		value: function get() {

			return this._send('get', arguments);
		}
	}, {
		key: 'upsert',
		value: function upsert() {

			return this._send('upsert', arguments);
		}
	}, {
		key: 'remove',
		value: function remove() {

			return this._send('remove', arguments);
		}
	}, {
		key: '_send',
		value: function _send(cmd, args) {
			var _this = this;

			return new Promise(function (resolve, reject) {

				var cacheRequest = http.request({
					method: 'POST',
					host: _this._config.bind,
					port: _this._config.port,
					path: '/',
					headers: {
						'content-type': 'application/x-www-form-urlencoded'
					}
				}, function (response) {

					var data = '';

					response.on('data', function (chunk) {
						return data += chunk;
					});
					response.on('error', reject);
					response.on('end', function () {
						return resolve(JSON.parse(data));
					});
				});

				cacheRequest.on('error', reject);

				cacheRequest.write(querystring.stringify({
					cmd: cmd,
					args: JSON.stringify(args)
				}));

				cacheRequest.end();
			});
		}
	}]);

	return ZenXCacheClient;
})();