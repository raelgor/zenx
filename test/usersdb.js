var assert = require('assert');
var fs = require('fs');
var http = require('http');
var zenx = require('./../main.js');
var bind = '10.240.0.2';
var crypto = require('crypto');

describe('User database tests', function(){
	
	var user;
	var cacheServer;
	var cacheClient;
	
	it('create zenx.User and set password to 0909', () => {
		
		user = new zenx.util.User({ auth: { username: 'testuser1' } });
		user.setPassword(crypto.createHash('md5').update('0909').digest('hex'));
		
	});
	
	it('create cache server process', (done) => {
		
		cacheServer = new zenx.cache.Server({
			bind: bind,
			port: 10001,
			databases: {
				usersdb: 'mongodb://uadmin:speedfreakpl2@' + bind + ':27017/usersdb',
				systemdb: 'mongodb://sysadmin:speedfreakpl2@' + bind + ':27017/systemdb'
			}
		});
		
		cacheServer.on('start', done);
		
	});
	
	it('create cache client', () => {
		
		cacheClient = new zenx.cache.Client({
			bind: bind,
			port: 10001
		});
		
	});
	
	it('save user to database', (done) => {
		
		user.updateCache(cacheClient).then((args) => args[1].ok && done());
		
	});
	
	it('get user from database', (done) => {
		
		cacheClient.get('usersdb', 'usersdb', 'auth.username', 'testuser1').then((args) => {
			
			args[0] === null &&
			args[1].length === 1 &&
			done();
			
		});
		
	});
	
	it('delete user from database', (done) => {
		
		user.deleteRecord(cacheClient).then(
			(args) => args[1].ok && args[1].n && done());
		
	});
	
	it('kill cache server', () => {
		
		cacheServer.kill();
	
	});
	
});