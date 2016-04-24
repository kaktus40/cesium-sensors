define([
	'./initialize',
	'./conic/conic-sensor-graphics',
	'./conic/conic-sensor-visualizer',
	'./custom/custom-pattern-sensor-graphics',
	'./custom/custom-pattern-sensor-visualizer',
	'./custom/custom-sensor-volume',
	'./rectangular/rectangular-pyramid-sensor-volume',
	'./rectangular/rectangular-sensor-graphics',
	'./rectangular/rectangular-sensor-visualizer'
], function(
	initialize,
	ConicSensorGraphics,
	ConicSensorVisualizer,
	CustomPatternSensorGraphics,
	CustomPatternSensorVisualizer,
	CustomSensorVolume,
	RectangularPyramidSensorVolume,
	RectangularSensorGraphics,
	RectangularSensorVisualizer
) {
	'use strict';

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
