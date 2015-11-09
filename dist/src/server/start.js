'use strict';

module.exports = function () {
	var _this = this;

	this._makeExpressApp();
	this._makeServer().then(function () {
		_this.status = 1;
		_this.emit('start');
	});
};