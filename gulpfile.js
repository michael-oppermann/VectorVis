
// Load plugins
const gulp = require('gulp');
const concat = require('gulp-concat');
const notify = require('gulp-notify');
const uglify = require('gulp-uglify');
const merge = require('merge-stream');
const sass = require('gulp-sass');
const browserSync = require('browser-sync').create();

//sass.compiler = require('node-sass');

const config = {
		jsPath: './src/js',
    sassPath: './src/scss',
		modulesPath: './node_modules' ,
}

function css() {
  return gulp.src(config.sassPath + '/**/*.scss')
    .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
    .pipe(concat('style.css'))
    .pipe(gulp.dest('./dist'))
}

// Concatenate and minify scripts
function scripts() {
  return (gulp
      .src([config.jsPath + '/*/*.js', config.jsPath + '/index.js'])
      .pipe(concat('main.js'))
      //.pipe(uglify())
      .pipe(gulp.dest('./dist'))
      //.pipe(browserSync.stream());
  );
}

function vendorScripts() {
  return gulp.src([
      config.modulesPath + '/jquery/dist/jquery.min.js',
      config.modulesPath + '/uikit/dist/js/uikit.min.js',
      config.modulesPath + '/uikit/dist/js/uikit-icons.min.js',
      //config.modulesPath + '/nouislider/distribute/nouislider.min.js',
      //config.modulesPath + '/d3-tip/dist/index.js',
      config.modulesPath + '/d3/dist/d3.min.js',
      config.modulesPath + '/moment/min/moment.min.js'
    ])
    .pipe(concat('libs.js'))
    .pipe(uglify())
    .pipe(gulp.dest('./dist'));
}

// Watch files
function watchFiles() {
  gulp.watch(config.sassPath + '/**/*.scss', css);
  gulp.watch(config.jsPath + '/**/*.js', scripts);
}

const build = gulp.parallel(css, vendorScripts, scripts);
const watch = gulp.parallel(watchFiles);

exports.build = build;
exports.watch = watch;
exports.default = build;
