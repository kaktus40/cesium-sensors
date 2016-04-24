'use strict';

var gutil = require('gulp-util');
var pluginStream = require('./plugin-stream');

var PLUGIN_NAME = 'cesium-sensors-process-shaders';

module.exports = function() {
	var shaderLicenseComments = [];
	
	return pluginStream(PLUGIN_NAME, function(file, enc, cb) {
		
		var contents = file.contents.toString();
		contents = contents.replace(/\r\n/gm, '\n');

		var licenseComments = contents.match(/\/\*\*(?:[^*\/]|\*(?!\/)|\n)*?@license(?:.|\n)*?\*\//gm);
		if (licenseComments !== null) {
			shaderLicenseComments = shaderLicenseComments.concat(licenseComments);
		}

		var newContents = [];
		// Remove comments. Code ported from
		// https://github.com/apache/ant/blob/master/src/main/org/apache/tools/ant/filters/StripJavaComments.java
		for (var i = 0; i < contents.length; ++i) {
			var c = contents.charAt(i);
			if (c === '/') {
				c = contents.charAt(++i);
				if (c === '/') {
					while (c !== '\r' && c !== '\n' && i < contents.length) {
						c = contents.charAt(++i);
					}
				} else if (c === '*') {
					while (i < contents.length) {
						c = contents.charAt(++i);
						if (c === '*') {
							c = contents.charAt(++i);
							while (c === '*') {
								c = contents.charAt(++i);
							}
							if (c === '/') {
								c = contents.charAt(++i);
								break;
							}
						}
					}
				} else {
					--i;
					c = '/';
				}
			}
			newContents.push(c);
		}

		newContents = newContents.join('');
		newContents = newContents.replace(/\s+$/gm, '').replace(/^\s+/gm, '').replace(/\n+/gm, '\n');

		cb(null, new gutil.File({
			path: file.relative,
			contents: new Buffer(newContents)
		}));
	}, function(cb) {
		this.push(new gutil.File({
			path: 'shaderCopyrightHeader.js',
			contents: new Buffer(shaderLicenseComments.join('\n'))
		}));
		cb();
	});
};
