var gulp = require('gulp'),
   concat = require('gulp-concat');

gulp.task('combine', function() { 
   return gulp.src([ 
      './public/js/controllers/*.js']) 
    .pipe(concat('ng-app.js')) 
    .pipe(gulp.dest('./public/js/controllers/')); 
});

gulp.task('default', ['combine']);