var gulp       = require('gulp'),
    concat     = require('gulp-concat'),
    uglify     = require('gulp-uglify'),
    ngAnnotate = require('gulp-ng-annotate'),
    fs         = require('fs'),
    minifyCSS  = require('gulp-minify-css');

gulp.task('css', function () {
    gulp.src('css/**/*.css')
      .pipe(concat('styles.css'))
      .pipe(minifyCSS())
      .pipe(gulp.dest('assets/source'));
});

gulp.task('js', function () {
    gulp.src(['ng/module.js', 'ng/**/*.js'])
      .pipe(concat('app.js'))
      .pipe(uglify())
      .pipe(ngAnnotate())
      .pipe(gulp.dest('assets/source'))
});

gulp.task('watch:js', ['js'], function () {
    gulp.watch('ng/**/*.js', ['js']);
});

gulp.task('watch:css', ['css'], function () {
    gulp.watch('css/**/*.css', ['css']);
});

gulp.task('dev', ['watch:css', 'watch:js']);