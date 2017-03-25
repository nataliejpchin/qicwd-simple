// Call plugins
var gulp = require('gulp');
var sass = require('gulp-sass');
var plumber = require('gulp-plumber');
var notify = require('gulp-notify');
var browserSync = require('browser-sync');
var useref = require('gulp-useref');
var uglify = require('gulp-uglify');
var gulpIf = require('gulp-if');
var cssnano = require('gulp-cssnano');
var imagemin = require('gulp-imagemin');
var cache = require('gulp-cache');
var del = require('del');
var runSequence = require('run-sequence');
var sourcemaps = require('gulp-sourcemaps');
var autoprefixer = require('gulp-autoprefixer');
var sassGlob = require('gulp-sass-glob');
var svgSprite = require('gulp-svg-sprite');


// Development Tasks
// -----------------


// Custom plumber function that emits the end event with the plumber plugin
function customPlumber(errTitle) {
	return plumber({
		errorHandler: notify.onError({
			// Customizing error title
			title: errTitle || "Error running Gulp",
			message: "Error: <%=error.message %>",
		})
	});
}

// Live-reloading task
gulp.task('browserSync', function(){
	browserSync({
		// create a static server
		server: {
			// use src as base directory
			baseDir: 'src'
		},
		// Allow others on different WIFI network to connect to your server
		tunnel: "test",
		// Disable pop-over notification
		notify: false,
	});
});

// Sass task
gulp.task('sass', function(){
return gulp.src('src/scss/**/*.scss') // Gets all files ending with .scss in src/scss and children dirs
	.pipe(sassGlob())

	// Initialize sourcemap
	.pipe(sourcemaps.init())

	// Checks for errors all plugins
	.pipe(customPlumber('Error Running Sass'))

	// Compiles Sass to CSS with gulp-sass
	.pipe(sass({
		includePaths: ['./node_modules/bootstrap-sass/assets/stylesheets'], 	// Array of paths that libsass looks to resolve @import declarations.
		outputStyle: 'nested', // Output format for styles.
		precision: 3		// Number of decimal points.
	}))

	.pipe(autoprefixer('last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'))

	// Writing sourcemaps
	.pipe(sourcemaps.write())

	.pipe(gulp.dest('src/css')) // Outputs it in the css folder

	// Tells BrowserSync to reload files task is done
	.pipe(browserSync.reload({
		stream: true
	}));
});

// Copy fonts from bootstrap to src folder
gulp.task('fonts:src', function(){
	return gulp.src('./node_modules/bootstrap-sass/assets/fonts/**/*')
		.pipe(gulp.dest('src/fonts'));
});

// SVG Config
var svgConfig = {
  mode: {
    symbol: { // symbol mode to build the SVG
      render: {
        css: false, // CSS output option for icon sizing
        scss: false // SCSS output option for icon sizing
      },
      dest: '.', // destination folder
      prefix: '.svg--%s', // BEM-style prefix if styles rendered
      sprite: 'sprite.svg', //generated sprite name
      example: true // Build a sample page, please!
    }
  }
};

// Create SVG Sprite
gulp.task('svg-sprite', function() {
    return gulp.src('**/*.svg', {cwd: 'src/svg'})
		.pipe(customPlumber('Error Running SVG Srpite'))
	    .pipe(svgSprite(svgConfig))
	    .pipe(gulp.dest('src/svg-sprite'))
	    .pipe(browserSync.reload({
			stream: true
		}));
});

// Watch task
gulp.task('watch', function (){
	gulp.watch('src/scss/**/*.scss', ['sass']);
	gulp.watch('src/svg/**/*.svg', ['svg-sprite']);
	gulp.watch('src/svg-sprite/**/*.svg', browserSync.reload);
	gulp.watch('src/*.html', browserSync.reload);
  	gulp.watch('src/js/**/*.js', browserSync.reload);

});


// Optimization Tasks
// ------------------

// Minify and concatenate files
gulp.task('useref', function(){
	return gulp.src('src/*.html')
		.pipe(useref())
		.pipe(gulpIf('**/*.js', uglify().on('error', function(e){
            console.log(e);
         })) // Minifies only if it's a Javascript file
		.pipe(gulpIf('**/*.css', cssnano())) // Minifies only if it's a CSS file
		.pipe(gulp.dest('dist')));
});

// Optimize image
gulp.task('images', function(){
	return gulp.src('src/images/**/*.+(png|jpg|gif|svg)')
		// Caching images that ran through imagemin
		.pipe(cache(imagemin({
			interlaced: true
		})))
		.pipe(gulp.dest('dist/images'));
});

// Copy fonts to dist folder
gulp.task('fonts:dist', function(){
	return gulp.src('src/fonts/**/*')
		.pipe(gulp.dest('dist/fonts'));
});

// Copy sprites to dist folder
gulp.task('sprite-copy', function() {
  return gulp.src('src/svg-sprite/sprite.svg')
    .pipe(gulp.dest('dist/svg-sprite'));
});

// Copy documents to dist folder
gulp.task('doc', function() {
  return gulp.src('src/doc/**/*')
    .pipe(gulp.dest('dist/doc'));
});

// Deleting files that are no longer used
gulp.task('clean', function() {
  return del.sync('dist').then(function(cb) {
    return cache.clearAll(cb);
  });
});

gulp.task('clean:dist', function(){
	return del.sync(['dist/**/*', '!dist/images', '!dist/images/**/*']);
});

// Clear caches off local system
gulp.task('cache:clear', function (callback) {
	return cache.clearAll(callback);
});


// Build Sequences
// ---------------

gulp.task('default', function(callback) {
	runSequence(['sass', 'svg-sprite', 'fonts:src', 'browserSync'], 'watch',
		callback
	);
});

gulp.task('build', function(callback) {
	runSequence(
		'clean:dist',
		'sass',
		['useref', 'images', 'fonts:dist', 'sprite-copy', 'doc'],
		callback
	);
});