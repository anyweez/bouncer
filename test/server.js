/* jslint node: true, mocha: true */
require("blanket");
require("../js/routes");
var bouncer = require("../js/server");
var util = require("../js/util");
var expect = require("chai").expect;
var request = require("request");

describe("server.js", function () {
    var server;
    var config = {
        port: 8081,
    };

    before('server starts', function (done) {
        server = bouncer.createServer(config);
        server.init(done);
    });

    after('server shuts down', function (done) {
        server.close(done);
    });

    it('configuration properties are actually reflected in server', function () {
        expect(server.config.port).to.be.equal(config.port);
    });

    it('receive 200 from / endpoint', function (done) {
        request('http://localhost:' + server.config.port.toString(), function (error, response) {
            expect(error).to.be.null;
            expect(response.statusCode).to.be.equal(200);
            done();
        });
    });

    it('receive 200 from /debug endpoint', function (done) {
        var url = 'http://localhost:' + server.config.port.toString();
        request(url + '/debug', function (error, response) {
            expect(error).to.be.null;
            expect(response.statusCode).to.be.equal(200);
            done();
        });
    });

    it('receive 400 from empty post to /create endpoint', function (done) {
        var url = 'http://localhost:' + server.config.port.toString();
        request(url + '/create', function (error, response) {
            expect(error).to.be.null;
            expect(response.statusCode).to.be.equal(400);
            done();
        });
    });

    it('receive redirect to expected URL when hitting known shortlink', function (done) {
        this.timeout(5000);
        var shortlink = {
            shortlink: "test_retrieve",
            url: "https://google.com",
        };

        util.create(shortlink, function () {
            var url = 'http://localhost:' + server.config.port.toString() + '/' + shortlink.shortlink;
            request(url, {
                followRedirect: false,
            }, function (error, response) {
                expect(error).to.be.null;
                expect(response.statusCode).to.be.equal(302);

                done();
            });
        });
    });
});