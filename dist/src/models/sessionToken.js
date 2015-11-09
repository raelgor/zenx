'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ZenX = require('./../../main.js');
var zenx = new ZenX();

// Used by ZenXUser to create session tokens (cookies)
module.export = function ZenXSessionToken(options) {
	_classCallCheck(this, ZenXSessionToken);

	this.expires = new Date().getTime() + 24 * 60 * 60 * 1e3;
	this.token = zenx.util.uuid().split('-').join('');

	// Overwrite
	for (var key in options) {
		this[key] = options[key];
	}
};