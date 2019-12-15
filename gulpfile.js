var gulp = require('gulp');
var concat = require('gulp-concat');
const uglifyes = require('uglify-es');
const composer = require('gulp-uglify/composer');
const uglify = composer(uglifyes, console);


gulp.task('combineForDev', function () {
   return gulp.src([
         './public/js/controllers/*.js'
      ])
      .pipe(concat('ng-app.js'))
      .pipe(gulp.dest('./public/js/dist/'));
      
});

gulp.task('combineForProd', function () {
      return gulp.src([
            './public/js/controllers/*.js'
         ])
         .pipe(uglify())
         .pipe(concat('ng-app.js'))
         .pipe(gulp.dest('./public/js/dist/'));
         
   });

 


gulp.task('prod', gulp.parallel('combineForProd'));
gulp.task('dev', gulp.parallel('combineForDev'));