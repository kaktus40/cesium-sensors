define([
	'./initialize',
	'./conic-sensor-graphics',
	'./conic-sensor-visualizer',
	'./custom-pattern-sensor-graphics',
	'./custom-pattern-sensor-visualizer',
	'./custom-sensor-volume',
	'./rectangular-pyramid-sensor-volume',
	'./rectangular-sensor-graphics',
	'./rectangular-sensor-visualizer'
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
