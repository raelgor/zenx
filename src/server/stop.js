module.exports = function(){

	this.httpServer.close();
	this.status = 0;
	this.emit('stop');
	
}