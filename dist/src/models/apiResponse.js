'use strict'

// Standard response object used by ZenXPlatform 's core APIs
;

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

module.exports = (function () {
	function ZenXApiResponse(expressResponseObject) {
		_classCallCheck(this, ZenXApiResponse);

		this.res = expressResponseObject;

		this.error = 0;
		this.message = 'OK';
		this.data = '';
	}

	// Finish request

	_createClass(ZenXApiResponse, [{
		key: 'send',
		value: function send() {

			if (!this.res) throw new Error('send() called without an expressResponseObject.');

			// Reference to expressResponseObject
			var res = this.res;

			// Unlink res from response
			delete this.res;

			// Send response without expressResponseObject
			res.end(JSON.stringify(this));
		}

		// Set error in response object

	}, {
		key: 'throw',
		value: function _throw(code, message) {

			this.error = code;
			this.message = message;
		}
	}]);

	return ZenXApiResponse;
})();