var extend = require('deep-extend');
var fs = require('fs');
var gulp = require('gulp');
var gulpAutoprefixer = require('gulp-autoprefixer');
var path = require('path');
var readdirRecursive = require('fs-readdir-recursive');
var rename = require('gulp-rename');
var sass = require('gulp-sass');
var server = require('gulp-webserver');
var webpack = require('webpack');
var webpackStream = require('webpack-stream');
var WebpackBabiliPlugin = require("babili-webpack-plugin");

var config = {
  JS_SOURCE_DIR: './js/',
  JS_SOURCES: [
    './js/**/*.js',
  ],
  JS_OUT_DIR: './dist/js/',
  JS_OPTIONS: {
    uglify: {
      mangle: false
    }
  },
  SASS_SOURCE_DIR: './sass/',
  SASS_SOURCES: [
    './sass/**/*.sass',
  ],
  SASS_OUT_DIR: './dist/css/'
};

var jsFiles = fs.readdirSync(config.JS_SOURCE_DIR);
var entry = {};
jsFiles.forEach(function (value) {
  if (value.endsWith('.js')) {
    var key = value.substring(0, value.length - 3);
    entry[key] = config.JS_SOURCE_DIR + value;
  }
});

var webpackConfig = {
  entry: entry,
  mode: 'development',
  output: {
    path: path.resolve(__dirname, config.JS_OUT_DIR),
    filename: '[name].min.js'
  }
};
var webpackProdConfig = extend({
  mode: 'production',
}, webpackConfig);

gulp.task('compile-js', function() {
  return gulp.src(config.JS_SOURCES)
      .pipe(webpackStream(
        webpackProdConfig, webpack
      ))
      .pipe(gulp.dest(config.JS_OUT_DIR));
});

gulp.task('watch-js', () => {
  webpackConfig.watch = true;

  gulp.src(config.JS_SOURCES)
    .pipe(webpackStream(
      webpackConfig, webpack
    ))
    .pipe(gulp.dest(config.JS_OUT_DIR));
});

gulp.task('compile-sass', function() {
  gulp.src(`${config.SASS_SOURCE_DIR}**/*.sass`)
  .pipe(sass({
    includePaths: ['./node_modules/'],
    outputStyle: 'compressed'
  })).on('error', sass.logError)
  .pipe(rename(function(path) {
    path.basename += '.min';
  }))
  .pipe(gulpAutoprefixer({
    browsers: [
      'last 1 version',
      'last 2 iOS versions'
    ],
  }))
  .pipe(gulp.dest(config.SASS_OUT_DIR));
});

gulp.task('watch-sass', function() {
  gulp.watch(config.SASS_SOURCES, ['compile-sass']);
});

gulp.task('server', function() {
  gulp.src(['example/', 'dist/'])
    .pipe(server({
      livereload: true,
      port: 8888,
    }));
});

gulp.task('build', ['compile-js', 'compile-sass']);
gulp.task('default', ['compile-sass', 'watch-js', 'watch-sass', 'server']);
