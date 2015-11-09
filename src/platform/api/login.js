'use strict';

/* global cache */
// Basic login call handler
module.exports = function(req, res, next){
	
	// Initial response object
	var response = new zenx.ApiResponse(res);
	
	// Use generator for cleaner async calls
	zenx.util.gen(function*(){
		
		// The auth we are looking for
		var key = req.APIRequest.auth;
		
		// Get user
		var user = yield cache.get('usersdb', 'usersdb', {
			$or: [
				{ 'auth.phone': key },
				{ 'auth.username': key },
				{ 'auth.email': key },
				{ 'auth.fbid': key }
			]
		});
		
		// User not found
		if(user[0]) return response.throw(1, 'WRONG_CREDENTIALS');
		
		// Create ZenX User object
		user = new zenx.User(user[1]);
		
		// Test password
		if(user.testPassword(req.APIRequest.password)){
			
			// Make a new token
			// @todo Link to default login time setting
			let newToken = new zenx.SessionToken({ 
				expires: new Date().getTime() + (24*60*60*1e3) 
			});
			
			// Add it to the user and update cache
			user.addToken(newToken)
				.updateCache();
			
			// Write cookie and respond
			res.cookie(
				'auth', 
				newToken.token(), 
				{ 
					maxAge: 24 * 60 * 60 * 1000, 
					httpOnly: true, 
					secure: true
				}
			);
			
		// Invalid password
		} else return response.throw(1, 'WRONG_CREDENTIALS');
			
	// Respond
	}).then(() => response.send());
	
}