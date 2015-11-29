/* jslint node: true */
var gulp = require('gulp');
var jslint = require('gulp-jslint');
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var mocha = require('gulp-mocha');

var paths = { in : {
        templates: './templates/*.html',
        scss: './style/*.scss',
    },
    out: {
        templates: './public/',
        scss: './public/static/css/',
    },
};

gulp.task('default', ['styles', 'test']);

gulp.task('lint', function () {
    return gulp.src(["bouncer.js", "routes.js", "util.js"])
        .pipe(jslint({
            node: true,
        }));
});

gulp.task('test', function () {
    return gulp.src('test/*.js', {
            read: false
        })
        .pipe(mocha({
            reporter: 'spec'
        }));
});

gulp.task('styles', function () {
    return gulp.src(paths.in.scss)
        .pipe(sass({
            includePaths: require('node-normalize-scss').includePaths
        }).on('error', sass.logError))
        .pipe(concat('style.css'))
        .pipe(gulp.dest(paths.out.scss));
});

gulp.task('watch', ['styles'], function () {
    gulp.watch(paths.in.scss, ['styles']);
});