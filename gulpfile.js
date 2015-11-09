// Automation script for minifying
// client side javascript and css
var gulp       = require('gulp');    
var	concat     = require('gulp-concat');
var uglify     = require('gulp-uglify');
var ngAnnotate = require('gulp-ng-annotate');
var fs         = require('fs');
var minifyCSS  = require('gulp-minify-css');

// Minify css task
gulp.task('css', function () {
	
	// Delay 2s in case the change event
	// was fired from write start
	setTimeout(function(){
		
		gulp.src([
			'css/lib/*.css',
			'css/**/*.css'])
	    	.pipe(concat('styles.css'))
	    	//.pipe(minifyCSS())
	    	.pipe(gulp.dest('./assets/source'));
	
	}, 2000);

});

// Minify js task
gulp.task('js', function () {
	
	// Delay 2s in case the change event
	// was fired from write start
	setTimeout(function(){
		
		// @todo Find a more proper way to do this. Uglifying
		// 		 a minified file made `uglify` hang without an error
		gulp.src([
			'ng/main.js',
			'ng/controllers/*.js',
			'ng/directives/*.js',
			'ng/*.js'])      
			.pipe(concat('tmp'))
			.pipe(uglify())
			.pipe(ngAnnotate())
			.pipe(gulp.dest('./assets/source'))
			.on('finish', function() {
				
				gulp.src([
					'./ng/lib/angular.min.js', 
					'./ng/lib/angular-animate.min.js',
					'./ng/lib/angular-aria.min.js',
					'./ng/lib/angular-material.min.js',
					'./ng/lib/hammer.min.js',
					'./ng/lib/jquery.min.js',
					'./ng/lib/platform.min.js',
					'./ng/lib/md5.min.js',
					'./assets/source/tmp'])
					.pipe(concat('app.js'))
					.pipe(gulp.dest('./assets/source'))
					.on('finish', function() {
						
						fs.unlink('./assets/source/tmp');
						
					});
					
			});
		
	}, 2000);
	
});

// Watch `ng` directory and call task `js`
// if changes occur
gulp.task('watch:js', ['js'], function () {
	gulp.watch('ng/**/*.js', ['js']);
});

// Watch `css` directory and call task `css`
// if changes occur
gulp.task('watch:css', ['css'], function () {
	gulp.watch('css/**/*.css', ['css']);
});

// Combine tasks under `dev` to use them
// with `gulp dev` in cli
gulp.task('dev', ['watch:css', 'watch:js']);