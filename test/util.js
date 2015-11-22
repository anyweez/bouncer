var assert = require("assert");
var util = require("../util");
var redis = require("redis");

describe("util.js", function () {
    var client;

    // Initialize a Redis client connection to localhost before running any
    // tests.
    before('initialize redis client', function () {
        client = redis.createClient();
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

            var entry = util.create({
                shortlink: shortlink,
                url: url,
            }, function (newest) {
                assert.equal(true,
                    newest.shortlink == shortlink &&
                    newest.url == url &&
                    newest.createdOn > 0 &&
                    newest.domain == "google.com" &&
                    newest.title !== "Unknown");

                done();
            });
        });

        it("trying to create a shortlink with no url fails", function (done) {
            var shortlink = "test:car";

            try {
                var entry = util.create({
                    shortlink: shortlink,
                }, function (newest) {
                    assert.equal(true, false);
                    done();
                });
            } catch (e) {
                if (e.name == "AssertionError") throw e;
                else assert.equal(true, true);
                done();
            }
        });

        it("trying to create a shortlink with no shortlink fails", function (done) {
            try {
                var entry = util.create({
                    url: "https://google.com",
                }, function (newest) {
                    assert.equal(true, false);
                    done();
                });
            } catch (e) {
                if (e.name == "AssertionError") throw e;
                else assert.equal(true, true);
                done();
            }
        });

        it("trying to create a shortlink with no info fails", function (done) {
            try {
                var entry = util.create({}, function (newest) {
                    assert.equal(true, false);
                    done()
                });
            } catch (e) {
                if (e.name == "AssertionError") throw e;
                else assert.equal(true, true);
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