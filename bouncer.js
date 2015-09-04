var url = require("url");
var http = require("http");
var routes = require("./routes");

const PORT = 8080;

/**
 * Initialize a server that uses the router() function to
 * process and route requests.
 */

var server = http.createServer(router);

server.listen(PORT, function() {
	console.log("Server is listening on port " + PORT);
});

/**
 * Router function determines which handler needs to process the request. All handlers are
 * stored in routes.js.
 */
function router(request, response) {
	var path = url.parse(request.url)

	// If the request is not one we want to respond to, ignore it.
	if (dropRequest(request)) {
		response.end();
		return;
	}

	// When no shortlink is provided.
	//   Ex: Expected path: http://localhost/
	if (path.pathname == "/") {
		routes.main(request, response, function(resp) {
			resp.end();
		});
	} else if (path.pathname.indexOf("/public") == 0) {
		routes.fetchFile(request, response, function(resp) {
			resp.end();
		});
	// Edit an existing shortlink. 
	//   Ex: Expected path is /edit/{shortlink}
	} else if (path.pathname.indexOf("/edit") == 0) {
		routes.edit(request, response, function(resp) {
			resp.end();
		});
	// Create a new shortlink (depends on POST'd parameters, usually from a form).
	//   Ex: Only matches with /create.
	} else if (path.pathname == "/create") {
		routes.create(request, response, function(resp) {
			resp.end();
		});	
	// Any time a shortlink is provided
	//   Ex: http://localhost/myfavoritelink
	} else {
		routes.redirect(request, response, function(resp) {
			resp.end();
		});
	}
}

function dropRequest(request) {
	var path = url.parse(request.url);
	return path.pathname == "/favicon.ico";
}
