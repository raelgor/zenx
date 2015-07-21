module.exports = function () {

    var token = zx.uuid();
    var auth = this;

    this.sessions[token] = 1;

    setTimeout(function () {

        delete auth.sessions[token];

    }, 1000 * 60);

    return token;

}