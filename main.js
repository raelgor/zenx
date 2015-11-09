'use strict';

// ZenX Class
module.exports = class ZenX {
	
	constructor (modules) {
		
		var moduleIndex = {
			
			// Contains useful methods and tools
			util: 'zenx-util',
			
			// Create and control ZenX Platform servers
			Platform: './src/platform/index.js',
			
			// Create and manage ZenX servers
			Server: './src/server/index.js',
			
			// Load info
			package: './package.json',
			
			// ZenX User class
			User: './src/models/user.js',
			
			// ZenX Cache Server client
			CacheClient: './src/cacheClient.js',
			
			// ZenXApiResponse class
			ApiResponse: './src/models/apiResponse.js',
			
			// ZenXSessionToken class
			SessionToken: './src/models/sessionToken.js',
			
			// ZenXCacheServer class
			CacheServer: './src/platform/cacheServer.js'
		
		}
		
		// If no modules specified, load all
		!modules && (modules = Object.keys(moduleIndex));
	
		// Load
		for(let moduleName of modules)
			this[moduleName] = require(moduleIndex[moduleName]);
		
	}
	
}