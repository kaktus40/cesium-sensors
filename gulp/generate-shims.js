'use strict';

var gutil = require('gulp-util');
var pluginStream = require('./plugin-stream');

var PLUGIN_NAME = 'cesium-sensors-generate-shims';

module.exports = function() {
	var shims = {};

	return pluginStream(PLUGIN_NAME, function(file, enc, cb) {
		var contents = file.contents.toString();
		// Search for Cesium modules and add shim
		// modules that pull from the Cesium global

		var cesiumRequireRegex = /'Cesium\/\w*\/(\w*)'/g;
		var match;
		while ((match = cesiumRequireRegex.exec(contents)) !== null) {
			if (match[0] in shims) {
				continue;
			}

			shims[match[0]] = 'define(' + match[0] + ', function() { return Cesium[\'' + match[1] + '\']; });';
		}

		cb();
	}, function(cb) {
		var shimContents = Object.keys(shims).map(function(key) {
			return shims[key];
		}).join('\n');

		shimContents = '\'use strict\';\n' +
			'/* global Cesium */\n' +
			shimContents;

		this.push(new gutil.File({
			path: 'cesiumShims.js',
			contents: new Buffer(shimContents)
		}));

		cb();
	});
};
