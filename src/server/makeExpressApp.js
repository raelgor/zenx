var libs = require('./libs.js');

module.exports = function() {
	
	// Create the express app
	this.server = libs.express();
	
	// Create router
	this.router = libs.express.Router();
	
	// Initialize bouncer
	this.bouncer = require('http-bouncer');
	
	// Declare general DDoS bouncing rule
	this.bouncer({  
		$match: {
			request: 'any'
		},
		$include: {
			ip: 1
		}
	})
	.on(this.config.bounceOn)
	.over(this.config.bounceOver)
	.for(this.config.bounceFor);
	
	// Check if request passes DDoS check
	this.server.use((req, res, next) => {
		
		if(this.bouncer.check({ 
			request: 'any',
			ip: req.connection.remoteAddress
		})) next();
		
	});
	
	// Set upload limit
	this.server.use(libs.bodyParser.raw({
		limit: this.config.uploadLimit
	}));
	
	// Block libwww-perl
    this.server.use(
		(req, res, next) => 
			/libwww-perl/.test(req.get('user-agent')) ?	res.status(403).end() : next());
		
	// Parse json api requests
	this.server.use(libs.bodyParser.urlencoded({ extended: true }));
	this.server.use(libs.bodyParser.json({ extended: true }));
	
	// Add headers
	this.server.use((req, res, next) => {

		if(this.config.serverHeader)
			res.setHeader(
				'Server', 
				'ZenX/' + require('./../../package.json').version);

		res.setHeader('Connection', 'Keep-Alive');
		res.setHeader('Keep-Alive', 'timeout=15, max=100');
		
		return next();
		
	});
	
	// Standard middleware
	this.server.use(libs.helmet.xssFilter());
	this.server.use(libs.cookieParser());
	this.server.use(libs.multipart());
	this.server.use(libs.methodOverride());
	
	// Use compression on all requests
	this.server.use(libs.compression());
	
	// Disable x-powered-by header
	this.server.disable('x-powered-by');
	
	// A route to be used later
	this.server.use(this.router);
	
	// If a static content path was provided
	if(this.config.static){
		
		// Always add cache control header
		this.server.use(function (req, res, next) {
			
			res.setHeader("Cache-Control", "max-age=31104000, public");
			res.setHeader('Expires', 
				new Date(Date.now() + 345600000).toUTCString());
			
			return next();
		
		});
		
		// Serve static content
		this.server.use(
			libs.express.static(
				require('path').resolve(__dirname, this.config.static)));
		
	}
	
	// Not found
	this.server.get('*', function (req, res, next) {

		res.writeHead(404, 'Not found');

		res.end('404: Not found');

	});

}