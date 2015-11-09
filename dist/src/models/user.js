'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ZenX = require('./../../main.js');

module.exports = (function (_ZenX) {
	_inherits(ZenXUser, _ZenX);

	function ZenXUser(userObject) {
		_classCallCheck(this, ZenXUser);

		// In case of no userObject
		// create an empty one

		var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(ZenXUser).call(this, ['util']));

		!userObject && (userObject = {});

		// Defaults
		_this._id = _this.util.mongodb.ObjectID();
		_this.uuid = _this.util.uuid();
		_this.auth = {};
		_this.verified = 0;
		_this.lang = 'en_US';
		_this.info = {};
		_this.password = _this.util.pwHash.generate(_this.util.uuid(), { algorithm: 'sha256', saltLength: 15 });
		_this.sessions = {};
		_this.perimissions = {};

		// Overwrite defaults
		for (var key in userObject) _this[key] = userObject[key];

		return _this;
	}

	// Change password

	_createClass(ZenXUser, [{
		key: 'setPassword',
		value: function setPassword(passwordString) {

			this.password = this.util.pwHash.generate(passwordString, { algorithm: "sha256", saltLength: 15 });

			return this;
		}

		// Test password

	}, {
		key: 'testPassword',
		value: function testPassword(passwordString) {

			return this.util.pwHash.verify(passwordString, this.password);
		}

		// Send update message to ZenXCacheServer

	}, {
		key: 'updateCache',
		value: function updateCache(ZenXCacheClientObject) {

			// Return promise
			return ZenXCacheClientObject.upsert('usersdb', 'usersdb', this);
		}

		// Delete the cache to delete this user from the database

	}, {
		key: 'deleteRecord',
		value: function deleteRecord(ZenXCacheClientObject) {

			// Return promise
			return ZenXCacheClientObject.remove('usersdb', 'usersdb', this);
		}

		// Add token to the user's token index

	}, {
		key: 'addToken',
		value: function addToken(ZenXSessionTokenObject) {

			this.sessions[ZenXSessionTokenObject.token] = ZenXSessionTokenObject;

			delete ZenXSessionTokenObject.token;

			return this;
		}
	}]);

	return ZenXUser;
})(ZenX);