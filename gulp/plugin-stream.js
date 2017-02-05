'use strict';

var gutil = require('gulp-util');
var through = require('through2');

module.exports = function(PLUGIN_NAME, transform, flush) {
	return through.obj(function(file, enc, cb) {
		if (file.isNull()) {
			cb(null, file);
			return;
		}

		if (file.isStream()) {
			cb(new gutil.PluginError(PLUGIN_NAME, 'Streaming not supported'));
			return;
		}

		transform(file, enc, cb);
	}, flush);
};
