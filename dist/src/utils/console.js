'use strict';

var colors = require('colors/safe');
var instance = {};

instance.log = function (message) {

	message = colors.cyan('[ZenX] ') + message;

	console.log(message);
};

instance.warn = function (message) {
	return instance.log(colors.yellow('Warning: ' + message));
};

instance.error = function (message) {
	return instance.log(colors.red('Error: ' + message));
};

module.exports = instance;