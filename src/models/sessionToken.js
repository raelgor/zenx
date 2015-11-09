'use strict';

var ZenX = require('./../../main.js');
var zenx = new ZenX();

// Used by ZenXUser to create session tokens (cookies)
module.export = class ZenXSessionToken {
	
	constructor (options) {
		
		this.expires = new Date().getTime() + (24*60*60*1e3);
		this.token = zenx.util.uuid().split('-').join('');
		
		// Overwrite 
		for(let key in options) this[key] = options[key];
		
	}
	
}