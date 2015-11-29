/* jslint node: true */
"use strict";
var redis = require("redis");
var protobuf = require("node-protobuf");
var fs = require("fs");
var async = require("async");
var URL = require("url");
var request = require("request");
var cheerio = require("cheerio");

var NAMESPACE = "bouncer";
var client = redis.createClient();

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
            shortlink: (entry.shortlink.split(':').length > 1) ? entry.shortlink.split(':')[1] : entry.shortlink,
            url: entry.url,
            createdOn: Date.now(),
            domain: function (url) {
                return URL.parse(url).hostname;
            }(entry.url),
            title: null,
            namespace: (entry.shortlink.split(':').length > 1) ? entry.shortlink.split(':')[0] : NAMESPACE,

            // Generate the key that should be used to store this entry.
            key: function () {
                return addNamespace(this.namespace, this.shortlink);
            },
        };

        request(entry.url, function (error, response, body) {
            if (response !== undefined && response.statusCode == 200) {
                var doc = cheerio.load(body, {
                    decodeEntities: true,
                });
                newest.title = doc('title').text().replace(/[^\x00-\x7F]/g, "");
            } else {
                newest.title = "Unknown";
            }

            callback(newest);
        });
    },
};

function addNamespace(ns, token) {
    return ns + ":" + token;
}

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
        // TODO: `client` is currently global. Should make this a module-level connection.
        client.set(
            newest.key(),
            entryPb.serialize(newest, "bouncer.Entry")
        );

        callback(newest);
    });
};

/**
 * Tries to retrieve a shortlink. If the shortlink doesn't exist,
 * return null.
 */
exports.get = function (shortlink, callback) {
    exports.getFromNamespace(NAMESPACE, shortlink, callback);
};

exports.getFromNamespace = function (ns, shortlink, callback) {
    var client = redis.createClient(null, null, {
        return_buffers: true,
    });

    client.on("error", function (err) {
        console.log("Error " + err);
        throw err;
    });

    client.get(addNamespace(ns, shortlink), function (err, reply) {
        // If there's an issue, return the error.
        if (err !== null) {
            callback(err);
            // If the key doesn't exist, return an empty object.
        } else if (reply === null) {
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
    exports.getAllFromNamespace(NAMESPACE, callback);
};

exports.getAllFromNamespace = function (ns, callback) {
    var client = redis.createClient(null, null, {
        return_buffers: true,
    });

    // Get entries for all shortlinks.
    client.keys(addNamespace(ns, "*"), function (err, reply) {
        var keys = reply.map(function (item) {
            item = item.toString();

            // A namespace should always be specified. Split the key out into the namespace
            // and token.
            if (item.split(':').length > 1) {
                return {
                    namespace: item.split(':')[0],
                    token: item.split(':')[1],
                };
            } else {
                throw Error('No namespace specified.');
            }
        });

        // Generate a list of functions that retrieve entries, one per shortlink.
        async.parallel(keys.map(function (item) {
                return function (db_callback) {
                    exports.getFromNamespace(item.namespace, item.token, function (err, val) {
                        db_callback(err, val);
                    });
                };
            }),
            // Once all have been fetched, execute the callback.
            function (err, items) {
                callback(items);
            });
    });
};