var gulp = require('gulp');
var concat = require('gulp-concat');
const uglifyes = require('uglify-es');
const composer = require('gulp-uglify/composer');
const uglify = composer(uglifyes, console);


gulp.task('combine', function () {
   return gulp.src([
         './public/js/controllers/*.js'
      ])
      //.pipe(uglify())
      .pipe(concat('ng-app.js'))
      .pipe(gulp.dest('./public/js/dist/'));
      
});


gulp.task('default', gulp.parallel('combine'));