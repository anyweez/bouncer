/* jslint node: true, mocha: true */
//var assert = require("assert");
require("blanket");
var util = require("../js/util");
require("../js/routes");
require("../js/bouncer");
var redis = require("redis");
var expect = require("chai").expect;

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
            var shortlink = "test:goo";
            var url = "https://google.com";
            this.timeout(5000);

            try {
                util.create({
                    shortlink: shortlink,
                    url: url,
                }, function (newest) {
                    expect(newest.shortlink).to.be.equal(shortlink);
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
            var shortlink = "test:shortlink_no_url";

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
    });

    describe("#get", function () {
        it("no matching shortlink returns no error && null", function () {
            // Try to retrieve a key that's very unlikely to exist.
            util.get("test:doesNotExist", function (err, val) {
                assert.equal(true, (err == null && val == null));
            })
        });

        it("matching shortlink returns valid entry object", function (done) {
            var shortlink = "test:mail";
            var url = "https://mail.google.com";
            util.create({
                shortlink: shortlink,
                url: url,
            }, function (newest) {
                assert.equal(true,
                    newest.shortlink === shortlink &&
                    newest.url === url);

                done();
            });
        });
    });
});