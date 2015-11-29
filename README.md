# Bouncer
[![Build Status](https://travis-ci.org/anyweez/bouncer.svg?branch=master)](https://travis-ci.org/anyweez/bouncer)
[![Test Coverage](https://codeclimate.com/github/anyweez/bouncer/badges/coverage.svg)](https://codeclimate.com/github/anyweez/bouncer/coverage)
[![Code Climate](https://codeclimate.com/github/anyweez/bouncer/badges/gpa.svg)](https://codeclimate.com/github/anyweez/bouncer)

Bouncer is a simple application for saving shortlinks on an internal LAN. It's written as a NodeJS application
and currently depends on Redis for durable storage.

Bouncer provides a very simple web interface for saving shortened forms of web links, and is intended for use on
in a protected networking environment. It doesn't handle user authentication or even have a concept of users. When
possible, the design biases towards simplicity over functionality.

In my own setup, I've configured a Bouncer server with a very short DNS hostname (i.e. "go" or "to"). You can then
store any longer link with a shortened form, i.e. `to/fb` as a shortcut to Facebook. Anyone who can reach the Bouncer
server (usually anyone on your LAN) can use the same shortlinks.

And that's about it. Keep it simple.

# Installation

- `apt-get install protobuf-compiler libprotobuf-dev redis-server`
- `npm install`
- `node bouncer.js`