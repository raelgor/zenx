'use strict';

// Standard response object used by ZenXPlatform 's core APIs
module.exports = class ZenXApiResponse {
	
	constructor (expressResponseObject) {
		
		this.res = expressResponseObject;
		
		this.error = 0;
		this.message = 'OK';
		this.data = '';
		
	}
	
	// Finish request
	send() {
		
		if(!this.res) 
			throw new Error('send() called without an expressResponseObject.');
		
		// Reference to expressResponseObject
		var res = this.res;
		
		// Unlink res from response
		delete this.res;
		
		// Send response without expressResponseObject
		res.end(
			JSON.stringify(this)
		);
		
	}
	
	// Set error in response object
	throw(code, message) {
		
		this.error = code;
		this.message = message;
		
	}
	
}