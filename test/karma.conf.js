module.exports = function(config) {
	'use strict';
	config.set({

		// base path that will be used to resolve all patterns (eg. files, exclude)
		basePath: '../',

		// frameworks to use
		// available frameworks: https://npmjs.org/browse/keyword/karma-adapter
		frameworks: ['jasmine', 'requirejs'],

		// list of files / patterns to load in the browser
		files: [
			{ pattern: 'node_modules/cesium/Source/**/*', included: false },
			{ pattern: 'node_modules/requirejs-text/*.js', included: false },
			{ pattern: 'lib/**/*.js', included: false },
			{ pattern: 'lib/**/*.glsl', included: false },
			{ pattern: 'test/**/*.js', included: false },
			'test/spec-main.js'
		],

		// list of files to exclude
		exclude: [
			'lib/main.js'
		],

		preprocessors: {
			'lib/**/*.js': ['coverage']
		},

		// test results reporter to use
		// possible values: 'dots', 'progress'
		// available reporters: https://npmjs.org/browse/keyword/karma-reporter
		reporters: ['progress', 'coverage'],

		junitReporter: {
			outputFile: 'spec_out/unit.xml',
			suite: 'unit'
		},

		// web server port
		port: 9876,

		// enable / disable colors in the output (reporters and logs)
		colors: true,

		// level of logging
		logLevel: config.LOG_INFO,

		// enable / disable watching file and executing tests whenever any file changes
		autoWatch: true,

		// start these browsers
		// available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
		browsers: ['Chrome'],

		// Continuous Integration mode
		// if true, Karma captures browsers, runs the tests and exits
		singleRun: false
	});
};
