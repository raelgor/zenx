'use strict';
var ZenX = require('./../../main.js');
		
module.exports = class ZenXUser extends ZenX {
	
	constructor(userObject) {
		
		super(['util']);
		
		// In case of no userObject
		// create an empty one
		!userObject && (userObject = {});
		
		// Defaults
		this._id = this.util.mongodb.ObjectID();
		this.uuid = this.util.uuid();
		this.auth = {};
		this.verified = 0;
		this.lang = 'en_US';
		this.info = {};
		this.password = this.util
							.pwHash
							.generate(
								this.util.uuid(), 
								{ algorithm: 'sha256', saltLength: 15 });
		this.sessions = {};
		this.perimissions = {};
		
		// Overwrite defaults
		for(var key in userObject) this[key] = userObject[key];
		
	}

	// Change password
	setPassword(passwordString){
		
		this.password = this.util
							.pwHash
							.generate(
								passwordString, 
								{ algorithm: "sha256", saltLength: 15 });
								
		return this;
		
	}
	
	// Test password
	testPassword(passwordString){
		
		return this.util.pwHash.verify(passwordString, this.password);
		
	}
	
	// Send update message to ZenXCacheServer
	updateCache(ZenXCacheClientObject){
		
		// Return promise
		return ZenXCacheClientObject.upsert('usersdb', 'usersdb', this);
		
	}
	
	// Delete the cache to delete this user from the database
	deleteRecord(ZenXCacheClientObject){
		
		// Return promise
		return ZenXCacheClientObject.remove('usersdb', 'usersdb', this);
		
	}
	
	// Add token to the user's token index
	addToken(ZenXSessionTokenObject) {
		
		this.sessions[ZenXSessionTokenObject.token] = ZenXSessionTokenObject;
		
		delete ZenXSessionTokenObject.token;
		
		return this;
		
	}
	
}