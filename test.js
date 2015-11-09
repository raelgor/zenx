var zenx = new (global.ZenX = require('./main.js'));
var fs = require('fs');

zenx.util.console.log('Started.');
var bind = require('os').networkInterfaces().eth0[0].address;
var server = new zenx.Platform({
	bind: bind,
	port: 10000,
	numClusters: 4,
	ssl: false,
	ws: true,
	createCache: true,
	cacheBind: bind,
	cachePort: 10001,
	fbauth: true,
	fbadmins: '1119763856',
	fbappid: '957277001026643',
	fbappsecret: '1e6c3a0d2afbc52de0a20b7ce64b76e4',
	systemdb: 'mongodb://sysadmin:speedfreakpl2@' + bind + ':27017/systemdb',
	usersdb: 'mongodb://uadmin:speedfreakpl2@' + bind + ':27017/usersdb',
	sslCert: {
		key: String(fs.readFileSync('./ssl/ssl.key')),
		cert: String(fs.readFileSync('./ssl/ssl.crt')),
		passphrase: 'test123'
	}
});

var app = new zenx.Server({
	bind: bind,
	port: 443,
	ssl: false,
	ws: false,
	static: __dirname + '/assets',
	sslCert: {
		key: String(fs.readFileSync('./ssl/ssl.key')),
		cert: String(fs.readFileSync('./ssl/ssl.crt')),
		passphrase: 'test123'
	}
});