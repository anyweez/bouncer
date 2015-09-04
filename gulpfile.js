var gulp = require('gulp');
var jslint = require('gulp-jslint');

gulp.task('default', function() {
	return gulp.src(["bouncer.js", "routes.js", "util.js"])
		.pipe(jslint({
			node: true,
		}))
});