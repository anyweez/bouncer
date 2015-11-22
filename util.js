/* jslint node: true */
"use strict";
var redis = require("redis");
var protobuf = require("node-protobuf");
var fs = require("fs");
var async = require("async");
var URL = require("url");
var request = require("request");
var cheerio = require("cheerio");

/**
 * Core utility functionality that's invoked by request handlers in the main app. Note
 * that there may be multiple paths to call these functions, and ideally all storage
 * details (encoding/decoding of protobufs, durable storage, etc) can be contained in
 * util.js so that the rest of the app doesn't need to be aware and some of this stuff
 * can change if needed.
 */
var entryPb = new protobuf(fs.readFileSync("./proto/entry.desc"));

var Entry = {
    new: function (entry, callback) {
        if (entry.shortlink === null) throw Error("You must provide a shortlink name.");
        if (entry.url === null) throw Error("You must provide a URL for the shortlink.");

        var newest = {
            shortlink: entry.shortlink,
            url: entry.url,
            createdOn: Date.now(),
            domain: function (url) {
                return URL.parse(url).hostname;
            }(entry.url),
            title: null,
        };

        request(entry.url, function (error, response, body) {
            if (response !== undefined && response.statusCode == 200) {
                var doc = cheerio.load(body, {
                    decodeEntities: true,
                });
                console.log(doc('title').text());
                newest.title = doc('title').text().replace(/[^\x00-\x7F]/g, "");
            } else {
                console.log("[EntryLookup] Specified URL doesn't exist: " + entry.url);
                newest.title = "Unknown";
            }

            callback(newest);
        });
    },
};

/**
 * Create a new shortlink.
 */
exports.create = function (entry, callback) {
    // Check to make sure the entry contains critical fields.
    if (entry === null || entry === undefined) throw Error("No entry data provided");
    if (entry.shortlink === null || entry.shortlink === undefined) throw Error("You must provide a shortlink name.");
    if (entry.url === null || entry === undefined) throw Error("You must provide a URL for the shortlink.");

    Entry.new(entry, function (newest) {
        // Store the new object.
        // TODO: only create a single client (I think this is currently one connection per request).
        var client = redis.createClient();
        client.set(newest.shortlink, entryPb.serialize(newest, "bouncer.Entry"));

        callback(newest);
    });
}

/**
 * Tries to retrieve a shortlink. If the shortlink doesn't exist,
 * return null.
 */
exports.get = function (shortlink, callback) {
    var client = redis.createClient(null, null, {
        return_buffers: true,
    });

    client.on("error", function (err) {
        console.log("Error " + err);
    });

    client.get(shortlink, function (err, reply) {
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
};

exports.getAll = function (callback) {
    var client = redis.createClient(null, null, {
        return_buffers: true,
    });

    // Get entries for all shortlinks.
    client.keys("*", function (err, reply) {
        var keys = reply.map(function (item) {
            return item.toString();
        });

        // Generate a list of functions that retrieve entries, one per shortlink.
        async.parallel(keys.map(function (item) {
                return function (db_callback) {
                    exports.get(item, function (err, val) {
                        db_callback(err, val);
                    });
                };
            }),
            // Once all have been fetched, execute the callback.
            function (err, items) {
                callback(items);
            });
    });
}