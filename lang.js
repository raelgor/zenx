var path = require('path'),
    fs   = require('fs'),
    exp  = {};

fs.readdirSync(__dirname + '/languages').forEach(function (lang) {
    exp[lang.split('.')[0]] = eval("sb = "+fs.readFileSync(path.resolve(__dirname + '/languages/' + lang)));
});

module.exports = exp;