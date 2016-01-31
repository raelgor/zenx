// ZenX instance
module.exports = {
			
	// Contains useful methods and tools
	util: require('zenx-util'),
	
	// Create and control ZenX Platform servers
	Platform: require('zenx-platform'),
	
	// Create and manage ZenX servers
	Server: require('zenx-server'),
	
	// ZenX Cache module
	cache: require('zenx-cache'),
    
	// ZenX Load Balancer module
	lb: require('zenx-lb')
			
}