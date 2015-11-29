/* jslint node: true */
var bouncer = require('./server');

var server = bouncer.createServer();
server.init(function () {
    console.log("Bouncer server is running on port " + server.config.port);
});