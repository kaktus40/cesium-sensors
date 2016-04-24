define(function(require) {
	'use strict';

	var makeThrowFunction = require('./make-throw-function');
	var DeveloperError = require('Cesium/Core/DeveloperError');

	return function() {
		/* global jasmine */
		jasmine.addMatchers({
			toThrowDeveloperError: makeThrowFunction(true, DeveloperError, 'DeveloperError')
		});
	};
});
