'use strict'

// Number of available CPUs that we will use
// as default number of clusters
;

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _typeof(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var numCpus = require('os').cpus().length;

var ZenX = require('./../../main.js');

// Export ZenXPlatform class
module.exports = (function (_ZenX) {
	_inherits(ZenXPlatform, _ZenX);

	function ZenXPlatform(options) {
		_classCallCheck(this, ZenXPlatform);

		// Bind cluster lib to the ZenXPlatform object

		var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(ZenXPlatform).call(this));

		// Inherit methods

		_this.cluster = require('cluster');

		// Make object if undefined
		(typeof options === 'undefined' ? 'undefined' : _typeof(options)) != 'object' && (options = {});

		// Bind options to our object to use later
		_this.options = options;

		// Overwrite default port setting
		options.port = options.port || 10000;

		// Set default number of clusters if not
		// specified in options.numClusters
		_this.numClusters = options.numClusters || numCpus;

		// Specify worker file
		_this.cluster.setupMaster({ exec: __dirname + '/platform.js' });

		// Create workers
		_this.fillWorkerSlots();

		// On disconnect, kill and refill
		_this.cluster.on('disconnect', function (worker) {
			return _this._workerDisconnectHandler(worker);
		});

		// Create cache server if specified
		if (options.createCache) _this.cacheServer = new _this.CacheServer({
			bind: options.cacheBind,
			port: options.cachePort,
			databases: {
				usersdb: options.usersdb,
				systemdb: options.systemdb
			}
		});

		return _this;
	}

	// Forks workers until we have as many as this.numClusters

	_createClass(ZenXPlatform, [{
		key: 'fillWorkerSlots',
		value: function fillWorkerSlots() {

			// Pass the options to the worker to get
			// connection info and more
			while (this.workersLength < this.numClusters) this.cluster.fork().send(JSON.stringify({
				cmd: 'init',
				options: this.options
			}));
		}

		// Returns the amount of active workers

	}, {
		key: '_workerDisconnectHandler',

		// Handler for disconnected workers
		value: function _workerDisconnectHandler(worker) {
			var _this2 = this;

			worker.kill();
			process.nextTick(function () {
				return _this2.fillWorkerSlots();
			});
		}

		// Restart all workers

	}, {
		key: 'restart',
		value: function restart() {
			var _this3 = this;

			// Remove listener because we are
			// about to get disconnects we don't want to handle
			this.cluster.removeListener('disconnect', this._workerDisconnectHandler);

			// Kill all workers
			var _iteratorNormalCompletion = true;
			var _didIteratorError = false;
			var _iteratorError = undefined;

			try {
				for (var _iterator = this.cluster.workers[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
					var worker = _step.value;
					worker.kill();
				} // Make new workers after a small grace period of 2s
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

			setTimeout(function () {
				return _this3.fillWorkerSlots();
			}, 2000);
		}
	}, {
		key: 'workersLength',
		get: function get() {

			return Object.keys(this.cluster.workers).length;
		}
	}]);

	return ZenXPlatform;
})(ZenX);