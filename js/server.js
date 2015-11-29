/* jslint node: true */
"use strict";
var url = require("url");
var http = require("http");
var routes = require("./routes");

var PORT = 8080;

/**
 * Filtering function that determines whether a particular request should get a response.
 */
function dropRequest(request) {
    var path = url.parse(request.url);
    return path.pathname === "/favicon.ico";
}

/**
 * Router function determines which handler needs to process the request. All handlers are
 * stored in routes.js.
 */
function router(request, response) {
    var path = url.parse(request.url);

    // If the request is not one we want to respond to, ignore it.
    if (dropRequest(request)) {
        response.end();
        return;
    }

    // When no shortlink is provided.
    //   Ex: Expected path: http://localhost/
    if (path.pathname === "/") {
        routes.main(request, response, function (resp) {
            resp.end();
        });
        // Static content handler.
    } else if (path.pathname.indexOf("/static") === 0) {
        routes.fetchFile(request, response, function (resp) {
            resp.end();
        });
        // Create a new shortlink (depends on POST'd parameters, usually from a form).
        //   Ex: Only matches with /create.
    } else if (path.pathname === "/create") {
        routes.create(request, response, function (resp) {
            resp.end();
        });
    } else if (path.pathname.indexOf("/debug") === 0) {
        routes.debug(request, response, function (resp) {
            resp.end();
        });
        // Any time a shortlink is provided
        //   Ex: http://localhost/myfavoritelink
    } else {
        routes.redirect(request, response, function (resp) {
            resp.end();
        });
    }
}

function Server(conf) {
    var server = {
        http: null,
        config: conf || {},
        /**
         * Initialize the server and have it listen on the designated port.
         */
        init: function (callback) {
            // Setup important configurations.
            this.config.port = this.config.port || PORT;

            // Initialize the actual HTTP server.
            this.http = http.createServer(router);
            this.http.listen(this.config.port || PORT, function () {
                callback();
            }.bind(this));
        },
        /**
         * Close the server
         */
        close: function (callback) {
            this.http.close(callback);
        },
    };

    return server;
}

module.exports = {
    /**
     * Initialize a server that uses the router() function to
     * process and route requests.
     */
    createServer: function (conf) {
        return Server(conf);
    },
};