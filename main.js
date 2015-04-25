var http = require('http');

module.exports.start = function () {

    /*
    http.createServer(function (req, res) {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Hello World1\n');
    }).listen(80, '104.155.37.54');
    */

    http.createServer(function (req, res) {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Hello World2\n');
    }).listen(80, '104.155.23.6');

    console.log("ZenX Server Started.");

}