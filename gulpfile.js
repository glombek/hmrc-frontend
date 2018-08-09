'use strict'

const paths = require('./config/paths.json')
const gulp = require('gulp')
const runsequence = require('run-sequence')
const taskArguments = require('./tasks/gulp/task-arguments')

// Gulp sub-tasks
require('./tasks/gulp/clean.js')
require('./tasks/gulp/lint.js')
require('./tasks/gulp/compile-assets.js')
// new tasks
require('./tasks/gulp/copy-to-destination.js')
require('./tasks/gulp/asset-version.js')
require('./tasks/gulp/sassdoc.js')

// Umbrella scripts tasks for preview ---
// Runs js lint and compilation
// --------------------------------------
gulp.task('scripts', cb => {
  runsequence('js:compile', cb)
})

// Umbrella styles tasks for preview ----
// Runs js lint and compilation
// --------------------------------------
gulp.task('styles', cb => {
  runsequence('scss:lint', 'scss:compile', cb)
})

// Copy assets task ----------------------
// Copies assets to taskArguments.destination (public)
// --------------------------------------
gulp.task('copy:assets', () => {
  return gulp.src(paths.src + 'assets/**/*')
    .pipe(gulp.dest(taskArguments.destination + '/assets/'))
})

gulp.task('copy:README', () => {
  return gulp.src(paths.src + '../README.md')
    .pipe(gulp.dest(taskArguments.destination))
})

gulp.task('copy:packageJson', () => {
  return gulp.src(paths.src + '../package.json')
    .pipe(gulp.dest(taskArguments.destination))
})

// All test combined --------------------
// Runs js, scss and accessibility tests
// --------------------------------------
gulp.task('test', cb => {
  runsequence(
    'scss:lint',
    'scss:compile',
    cb
  )
})

// Copy assets task for local & heroku --
// Copies files to
// taskArguments.destination (public)
// --------------------------------------
gulp.task('copy-assets', cb => {
  runsequence(
    'styles',
    'scripts',
    cb
  )
})

// Build package task -----------------
// Prepare package folder for publishing
// -------------------------------------
gulp.task('build:package', cb => {
  runsequence(
    'clean',
    'copy-files',
    'js:compile',
    'copy:README',
    'copy:packageJson',
    cb
  )
})

gulp.task('build:dist', cb => {
  runsequence(
    'clean',
    'copy-assets',
    'copy:assets',
    'update-assets-version',
    cb
  )
})
