/* jslint node: true, mocha: true */
require("blanket");
require("../js/routes");
require("../js/server");
var util = require("../js/util");
var redis = require("redis");
var expect = require("chai").expect;

function token(token) {
    return "test:" + token;
}

describe("util.js", function () {
    var client;

    // Initialize a Redis client connection to localhost before running any
    // tests.
    before('initialize redis client', function (done) {
        try {
            client = redis.createClient();
            expect(client).to.not.be.undefined;

            client.keys("test:*", function (error, results) {
                client.del(results);
                done();
            });
        } catch (e) {
            expect(e).to.be.undefined;
            done();
        }
    });

    // Once all tests are completed, remove everything in the testing keyspace
    // (test:*).
    after('teardown redis client', function (done) {
        client.keys("test:*", function (error, results) {
            client.del(results);
            done();
        });
    });

    describe("#create", function () {
        it("created object has all expected fields set", function (done) {
            var shortlink = token('goo');
            var url = "https://google.com";
            this.timeout(5000);

            try {
                util.create({
                    shortlink: shortlink,
                    url: url,
                }, function (newest) {
                    expect(newest.shortlink).to.be.equal('goo');
                    expect(newest.url).to.be.equal(url);
                    expect(newest.createdOn).to.be.above(0);
                    expect(newest.domain).to.be.equal("google.com"); // Set dynamically
                    expect(newest.title).to.be.equal("Google"); // Set dynamically

                    done();
                });
            } catch (e) {
                expect(e).to.be.undefined;
                done();
            }
        });

        it("trying to create a shortlink with no url fails", function (done) {
            var shortlink = token('shortlink_no_url');

            try {
                util.create({
                    shortlink: shortlink,
                }, function (newest) {
                    expect(newest).to.be.undefined;
                    done();
                });
            } catch (e) {
                if (e.name == "AssertionError") throw e;
                done();
            }
        });

        it("trying to create a shortlink with no shortlink fails", function (done) {
            try {
                util.create({
                    url: "https://google.com",
                }, function (newest) {
                    expect(newest).to.be.undefined;
                    done();
                });
            } catch (e) {
                if (e.name == "AssertionError") throw e;
                done();
            }
        });

        it("trying to create a shortlink with no info fails", function (done) {
            try {
                util.create({}, function (newest) {
                    expect(newest).to.be.undefined;
                    done();
                });
            } catch (e) {
                if (e.name == "AssertionError") throw e;
                done();
            }
        });

        it("trying to create shortlink to non-existant url sets title to 'unknown'", function (done) {
            try {
                util.create({
                    shortlink: token('nonexistent_url'),
                    url: "htsp://notrealxyz.far",
                }, function (newest) {
                    expect(newest.title).is.equal("Unknown");
                    done();
                });
            } catch (e) {
                throw e;
            }
        });
    });

    describe("#get", function () {
        it("no matching shortlink returns no error && null", function () {
            // Try to retrieve a key that's very unlikely to exist.
            util.get(token('doesNotExist'), function (err, val) {
                expect(err).is.null;
                expect(val).is.null;
            });
        });

        it("matching shortlink returns valid entry object", function (done) {
            var shortlink = token('mail');
            var url = "https://mail.google.com";
            util.create({
                shortlink: shortlink,
                url: url,
            }, function (newest) {
                expect(newest.shortlink).is.equal('mail');
                expect(newest.namespace).is.equal('test');
                expect(newest.url).is.equal(url);

                util.getFromNamespace("test", "mail", function (err, val) {
                    expect(err).is.null;
                    expect(val).is.not.null;
                    done();
                });
            });
        });
    });

    describe("#getAll", function () {
        it("returns an empty list when pattern matches none", function (done) {
            util.getAllFromNamespace("nonexistent", function (items) {
                expect(items).to.have.length(0);
                expect(items).to.be.instanceOf(Array);
                done();
            });
        });
    });
});