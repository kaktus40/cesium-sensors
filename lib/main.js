// eslint-disable-next-line import/no-dynamic-require
require([
	'cesium-sensor-volumes'
], function(
	CesiumSensorVolumes
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

	scope.CesiumSensorVolumes = CesiumSensorVolumes;
}, undefined, true);
