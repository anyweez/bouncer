var redis = require("redis");
var protobuf = require("node-protobuf");
var fs = require("fs");
var async = require("async");

/**
 * Core utility functionality that's invoked by request handlers in the main app. Note
 * that there may be multiple paths to call these functions, and ideally all storage
 * details (encoding/decoding of protobufs, durable storage, etc) can be contained in
 * util.js so that the rest of the app doesn't need to be aware and some of this stuff
 * can change if needed.
 */

exports.stub = function(shortlink, url) {
	return new Entry(shortlink, url);
}

function Entry(shortlink, url) {
	if (shortlink == null) throw Error("You must provide a shortlink name."); 
	if (url == null) throw Error("You must provide a URL for the shortlink.");

	this.shortlink = shortlink;
	this.url = url;
	this.createdOn = Date.now();
}

var entryPb = new protobuf(fs.readFileSync("./proto/entry.desc"));

/**
 * Create a new shortlink.
 */
exports.create = function(shortlink, url) {
	var entry = new Entry(shortlink, url);
	var client = redis.createClient();

	client.set(shortlink, entryPb.serialize(entry, "bouncer.Entry"));

	return entry;
}

/**
 * Tries to retrieve a shortlink. If the shortlink doesn't exist,
 * return null.
 */
exports.get = function(shortlink, callback) {
	var client = redis.createClient(null, null, {
		return_buffers: true,
	});
	
	client.on("error", function(err) {
		console.log("Error " + err);
	});

	client.get(shortlink, function(err, reply) {
		// If there's an issue, return the error.
		if (err != null) {
			callback(err);
		// If the key doesn't exist, return an empty object.
		} else if (reply == null) {
			callback(null, null);
		// Deserialize and return retrieved object.
		} else {
			var entry = entryPb.parse(reply, "bouncer.Entry");
			callback(null, entry);
		}
	});

	return null;
}

exports.getAll = function(callback) {
	var client = redis.createClient(null, null, {
		return_buffers: true,
	});

	// Get entries for all shortlinks.
	client.keys("*", function(err, reply) {
		var keys = reply.map(function(item) {
			return item.toString();
		});

		// Generate a list of functions that retrieve entries, one per shortlink.
		async.parallel(keys.map(function(item) {
			return function(db_callback) {
				exports.get(item, function(err, val) {
					db_callback(err, val);
				});
			};			
		}),  
		// Once all have been fetched, execute the callback.
		function(err, items) {
			callback(items);
		});
	});
}