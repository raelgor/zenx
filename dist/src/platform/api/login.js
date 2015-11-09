'use strict'

/* global cache */
// Basic login call handler
;
module.exports = function (req, res, next) {

	// Initial response object
	var response = new zenx.ApiResponse(res);

	// Use generator for cleaner async calls
	zenx.util.gen(regeneratorRuntime.mark(function _callee() {
		var key, user, newToken;
		return regeneratorRuntime.wrap(function _callee$(_context) {
			while (1) switch (_context.prev = _context.next) {
				case 0:

					// The auth we are looking for
					key = req.APIRequest.auth;

					// Get user

					user = cache.get('usersdb', 'usersdb', {
						$or: [{ 'auth.phone': key }, { 'auth.username': key }, { 'auth.email': key }, { 'auth.fbid': key }]
					});

					// User not found

					if (user) {
						_context.next = 4;
						break;
					}

					return _context.abrupt('return', response.throw(1, 'WRONG_CREDENTIALS'));

				case 4:

					// Create ZenX User object
					user = new zenx.User(user);

					// Test password

					if (!user.testPassword(req.APIRequest.password)) {
						_context.next = 11;
						break;
					}

					// Make a new token
					// @todo Link to default login time setting
					newToken = new zenx.SessionToken({
						expires: new Date().getTime() + 24 * 60 * 60 * 1e3
					});

					// Add it to the user and update cache

					user.addToken(newToken).updateCache();

					// Write cookie and respond
					res.cookie('auth', newToken.token(), {
						maxAge: 24 * 60 * 60 * 1000,
						httpOnly: true,
						secure: true
					});

					// Invalid password
					_context.next = 12;
					break;

				case 11:
					return _context.abrupt('return', response.throw(1, 'WRONG_CREDENTIALS'));

				case 12:
				case 'end':
					return _context.stop();
			}
		}, _callee, this);
	})).

	// Respond
	then(function () {
		return response.send();
	});
	//() => response.send();
};