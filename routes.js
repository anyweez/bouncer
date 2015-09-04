var handlebars = require("handlebars");
var fs = require("fs");
var url = require("url");
var querystring = require("querystring");

var util = require("./util");

/**
 * index.html handler that renders what the page should like like when no shorturl was
 * provided. The main use case is as an intro page and it's really a secondary page. Most
 * users will end up in the redirect() flow, which means a shortlink was specified.
 */
exports.main = function(request, response, callback) {
	console.log("[Handler] Main");

	var template = handlebars.compile(fs.readFileSync("templates/main.html", "utf8"));
	
	util.getAll(function(items) {
		var data = {
			shortlinks: items,
			provided_shortlink: null,
		}

		response.write(template(data));
		callback(response);
	});
}

exports.edit = function(request, response, callback) {
	console.log("[Handler] Edit");

	callback(response);
}

exports.create = function(request, response, callback) {
	console.log("[Handler] Create");
	var body = "";

	request.on("data", function(data) {
		body += data.toString();
	});

	request.on("end", function() {
		var decoded = querystring.parse(body);
		console.log(decoded);

		// Create the new entry.
		if (isValidShortlink(decoded)) {
			util.create(decoded.shortlink, decoded.shortlink_url);

			// Redirect to the edit page for this shortlink. Does this
			// feel right from a user perspective?
			response.writeHead(302, {
				"Location": "/edit/" + decoded.shortlink, 
			})
		}

		callback(response);
	});
}

exports.redirect = function(request, response, callback) {
	console.log("[Handler] Redirect");

	var path = url.parse(request.url);
	var shortlink = path.pathname.substring(1);

	// Try to retrieve the shortlink. If it exists, redirect. Otherwise
	// go to setup page.
	util.get(shortlink, function(err, entry) {
		// If we've got an entry to work with, redirect.
		if (entry != null) {
			console.log("got an entry: ")
			console.log(entry);

			response.writeHead(302, {
				"Location": entry.url, 
			});

			callback(response);
		// Otherwise, give the user the ability to create a new entry.
		} else {
			console.log("no entry");
			var template = handlebars.compile(fs.readFileSync("templates/main.html", "utf8"));

			util.getAll(function(items) {
				var data = {
					shortlinks: items,
					provided_shortlink: shortlink,
				};

				response.write(template(data));
				callback(response);
			});
		}
	});
}

exports.fetchFile = function(request, response, callback) {
	var path = url.parse(request.url);
	try {
		var fpath = fs.readFileSync(__dirname + path.pathname)		
		response.writeHead(200);
		response.write(fpath, "utf8");
	} catch (e) {
		response.writeHead(404);
		console.log(e);
	}


	callback(response);
}

function isValidShortlink(entry) {
	if (entry.shortlink == null) return false;
	if (entry.shortlink_url == null) return false;

	// TODO: do more checking here.

	return true;
}