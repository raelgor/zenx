app.run(['$http', '$rootScope', function ($http, $rootScope) {

    // Connection handler
    ZenX.send = function (data) {

        // Use websocket if we have an open connection
        if (this.socket && this.socket.readyState) {

            var requestID = data.api + ':' + data.request + ':' + new Date().getTime();

            data.requestID = requestID;
            ZenX.socketRequests[requestID] = data;

            data.success = function (fn) {

                this.onsuccess = fn;
                return this;

            }

            data.error = function (fn) {

                this.onerror = fn;
                return this;

            }

            ZenX.socket.send(JSON.stringify(data));

            // If timeout is explicitly set to 0, it means that the
            // request was told to wait as long as it takes,
            // therefore there is no need to set a timeout function.
            // If a timeout is not set, or it is not 0, make a timeout
            // function, unless the request is marked as persistent.
            if (data.timeout !== 0 && !data.persistent) {

                data.timeoutFn = setTimeout(function () {

                    // Execute onerror
                    data.onerror && data.onerror({ error: "websocket_timeout" });

                    // Kill request handler
                    delete ZenX.socketRequests[data.requestID];

                }, data.timeout || 10000);

            }

            return data;

        // Otherwise post
        } else {

            // Exit if request was stricktly for WebSocket
            if (data.ws) return ZenX.log('Request canceled. No WebSocket available: ', data);

            // Procceed with request
            return $http({
                method: 'post',
                url: '/api',
                headers: { 'x-csrf-token': ZenX.csrf },
                data: data
            });

        }

    }

}]);