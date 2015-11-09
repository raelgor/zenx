'use strict'

// ZenX Class
;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

module.exports = function ZenX(modules) {
	_classCallCheck(this, ZenX);

	var moduleIndex = {

		// Contains useful methods and tools
		util: '/src/utils/index.js',

		// Create and control ZenX Platform servers
		Platform: '/src/platform/index.js',

		// Create and manage ZenX servers
		Server: '/src/server/index.js',

		// Load info
		// @todo Fix path problem
		package: '/../package.json',

		// ZenX User class
		User: '/src/models/user.js',

		// ZenX Cache Server client
		CacheClient: '/src/cacheClient.js',

		// ZenXApiResponse class
		ApiResponse: '/src/models/apiResponse.js',

		// ZenXSessionToken class
		SessionToken: '/src/models/sessionToken.js',

		// ZenXCacheServer class
		CacheServer: '/src/platform/cacheServer.js'

	};

	// If no modules specified, load all
	!modules && (modules = Object.keys(moduleIndex));

	// Load
	var _iteratorNormalCompletion = true;
	var _didIteratorError = false;
	var _iteratorError = undefined;

	try {
		for (var _iterator = modules[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
			var moduleName = _step.value;

			this[moduleName] = require(__dirname + moduleIndex[moduleName]);
		}
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
};