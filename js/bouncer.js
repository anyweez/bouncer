/* jslint node: true */
var bouncer = require('./server');

var server = bouncer.createServer();
bouncer.init(server, function () {
    console.log("Bouncer server is running.");
});