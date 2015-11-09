'use strict';

// Load an instance of zenx lib and
// make it available to all modules
// of this process
global.zenx = new (global.ZenX = require('./../../main.js'))();

// Load command handlers as modules
var modules = {

	'init': require('./cmd/init.js')

};

// Handle messages
process.on('message', function (jsonMessage) {

	// Parse json message
	var message = JSON.parse(jsonMessage);

	// Call handler
	if (typeof modules[message.cmd] == 'function') modules[message.cmd](message);
});