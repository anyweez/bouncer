var assert = require("assert");
var util = require("../util");

// TODO: cleanup task that gets rid of all keys that are created for tests.
function clean(keys) {
	// TODO: redis drop all keys listed in 'affected_keys'.
}

describe("util.js", function() {
	var affected_keys = [];

	describe("#create", function() {
		it("created object has all expected fields set", function() {
			var shortlink = "goo";
			var url = "https://google.com";

			var entry = util.create(shortlink, url);			
//			affected_keys.push(shortlink);

			assert.equal(true, (entry.shortlink == shortlink && entry.url == url && entry.createdOn > 0));
		});

		// Clean up affected keys.
		affected_keys = clean(affected_keys);

		it("trying to create a shortlink with no url fails", function() {
			var shortlink = "car";

			try {
				var entry = util.create(shortlink, null);
				assert.equal(true, false);
			} catch (e) {
				if (e.name == "AssertionError") throw e;
				else assert.equal(true, true);
			}
		});

		// Clean up affected keys.
		affected_keys = clean(affected_keys);

		it("trying to create a shortlink with no shortlink fails", function() {
			try {
				var entry = util.create(null, "https://google.com");
				assert.equal(true, false);
			} catch (e) {
				if (e.name == "AssertionError") throw e;
				else assert.equal(true, true);
			}
		});

		// Clean up affected keys.
		affected_keys = clean(affected_keys);
	});

	describe("#get", function() {
		it("no matching shortlink returns no error && null", function() {
			// Try to retrieve a key that's very unlikely to exist.
			util.get("a;oewjaegfkjdsalfhds", function(err, val) {
				assert.equal(true, (err == null && val == null));
			})
		});

		it("matching shortlink returns valid entry object", function() {

		});
	});
});