var assert = require('assert');
var fs = require('fs');
var http = require('http');
var ZenX = require('./../main.js');
var zenx = new ZenX();
		
describe('Server tests', function(){
	
	var server;
	var defaultConfig;
	
	it('should make default server in less than 1s', function(done){
		
		server = new zenx.Server();
		
		server.once('start', done);
		
		this.timeout(1000);
		
	});
	
	it('status === 1', function(){
			
		assert.equal(server.status, 1);
		
	});
	
	it('should call onStop when server stops', function(done){
		
		server.once('stop', done);
		server.stop();
		
		this.timeout(1000);
		
	});
	
	it('status === 0', function(){
			
		assert.equal(server.status, 0);
		
	});
	
	it('should load default server config fast', function(done){
		
		setTimeout(function(){
			
			defaultConfig = require('./../src/server/defaultServerConfig.js');
			done();
			
		},0);
		
		this.timeout(1000);
		
	});
	
	it('status === 1 (restart)', function(done){
		
		server.start();
		
		server.once('start', function(){
			
			assert.equal(server.status, 1);
			
			done();
			
		});
		
	});
	
	it('stop server', function(){
		
		server.stop();
		
	});
	
});