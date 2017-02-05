define(function(require) {
	'use strict';

	var initialize = require('./initialize');
	var ConicSensorGraphics = require('./conic/conic-sensor-graphics');
	var ConicSensorVisualizer = require('./conic/conic-sensor-visualizer');
	var CustomPatternSensorGraphics = require('./custom/custom-pattern-sensor-graphics');
	var CustomPatternSensorVisualizer = require('./custom/custom-pattern-sensor-visualizer');
	var CustomSensorVolume = require('./custom/custom-sensor-volume');
	var RectangularPyramidSensorVolume = require('./rectangular/rectangular-pyramid-sensor-volume');
	var RectangularSensorGraphics = require('./rectangular/rectangular-sensor-graphics');
	var RectangularSensorVisualizer = require('./rectangular/rectangular-sensor-visualizer');

	initialize();

	return {
		ConicSensorGraphics: ConicSensorGraphics,
		ConicSensorVisualizer: ConicSensorVisualizer,
		CustomPatternSensorGraphics: CustomPatternSensorGraphics,
		CustomPatternSensorVisualizer: CustomPatternSensorVisualizer,
		CustomSensorVolume: CustomSensorVolume,
		RectangularPyramidSensorVolume: RectangularPyramidSensorVolume,
		RectangularSensorGraphics: RectangularSensorGraphics,
		RectangularSensorVisualizer: RectangularSensorVisualizer
	};
});
