var zenxServer = require('https');

module.exports.start = function () {

    zenxServer.createServer({
        key:  fs.readFileSync('swiftfinger.key'),
        cert: fs.readFileSync('swiftfinger.crt')
    },function (req, res) {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Hello World2\n');
    }).listen(10000, '10.240.212.94');

    console.log("ZenX Server Started.");

}