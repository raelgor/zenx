// Apply basic default rules
'use strict';

module.exports = (bouncerInstance) => {
	
	let b = bouncerInstance;
	
	b({ $match: { request: 'login', api: 'core', group: 'platform-api'  }, $include: { ip: 1 } })  .on(50).over(1000).for(2000);
	b({ $match: { request: 'login', api: 'core', group: 'platform-api'  }, $include: { auth: 1 } }).on(5) .over(2000).for(10000);
	
}