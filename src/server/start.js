module.exports = function(){

	this._makeExpressApp();
	this._makeServer().then(() => {
		this.status = 1;
		this.emit('start');
	});

}