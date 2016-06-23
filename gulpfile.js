var gulp = require('gulp')
var sourcemaps = require('gulp-sourcemaps')
var babel = require('gulp-babel')

var path = require('path')

var paths = {
  src: ['src/**/*.js'],
  dest: 'lib',
  // Must be absolute or relative to source map
  sourceRoot: path.join(__dirname, 'src')
}

gulp.task('babel', function () {
  return gulp.src(paths.src)
    .pipe(sourcemaps.init())
    .pipe(babel({
      presets: ['es2015']
    }))
    .pipe(sourcemaps.write('.', {
      sourceRoot: paths.sourceRoot
    }))
    .pipe(gulp.dest(paths.dest))
})

gulp.task('watch', ['babel'], function () {
  gulp.watch(paths.src, ['babel'])
})

gulp.task('default', ['babel'])
