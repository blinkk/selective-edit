const connect = require('gulp-connect');
const {
  dest,
  parallel,
  series,
  src,
  task,
  watch
} = require('gulp');
const gulpAutoprefixer = require('gulp-autoprefixer');
const rename = require('gulp-rename');
const sass = require('gulp-sass');

const config = {
  SASS_SOURCE_DIR: './sass/**/*.{sass,scss}',
  SASS_SOURCES: [
    './sass/**/*.{sass,scss}',
    './node_modules/@material/**/*.{sass,scss}',
  ],
  SASS_OUT_DIR: './dist/css/'
};

task('compile-sass', function(cb) {
  return src(config.SASS_SOURCE_DIR)
    .pipe(sass({
      outputStyle: 'compressed',
      includePaths: [
        'node_modules'
      ],
    })).on('error', sass.logError)
    .pipe(rename(function(path) {
      path.basename += '.min';
    }))
    .pipe(gulpAutoprefixer())
    .pipe(dest(config.SASS_OUT_DIR));
});

task('watch-sass', function() {
  watch(config.SASS_SOURCES, series('compile-sass'));
});

task('connect', function() {
  connect.server({
    root: ['example', 'dist'],
    livereload: true,
    port: 8888,
  });
});

exports.build = parallel('compile-sass')
exports.server = series(exports.build, parallel('connect', 'watch-sass'))
exports.default = exports.server
