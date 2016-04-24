require([
	'CesiumSensors'
], function(
	CesiumSensors
) {
	'use strict';
	/* global window, self */

	var scope;
	if (typeof window === 'undefined') {
		if (typeof self === 'undefined') {
			scope = {};
		} else {
			scope = self;
		}
	} else {
		scope = window;
	}

	scope.CesiumSensors = CesiumSensors;
}, undefined, true);
