'use strict';

// Returns useful utilities
module.exports = {

	gen: require('./gen.js'),
	colors: require('colors/safe'),
	console: require('./console.js'),
	Timer: require('./timer.js'),
	uuid: require('./uuid.js'),
	pwHash: require('password-hash'),
	mongodb: require('mongodb'),

	// Export internal tools
	jade: require('jade')

};