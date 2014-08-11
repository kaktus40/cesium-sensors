/*global define*/
define([
        './initialize',
        './ConicSensorGraphics',
        './ConicSensorVisualizer',
        './CustomPatternSensorGraphics',
        './CustomPatternSensorVisualizer',
        './CustomSensorVolume',
        './RectangularPyramidSensorVolume',
        './RectangularSensorGraphics',
        './RectangularSensorVisualizer'
    ], function(
        initialize,
        ConicSensorGraphics,
        ConicSensorVisualizer,
        CustomPatternSensorGraphics,
        CustomPatternSensorVisualizer,
        CustomSensorVolume,
        RectangularPyramidSensorVolume,
        RectangularSensorGraphics,
        RectangularSensorVisualizer) {
    "use strict";

    initialize();

    return {
        ConicSensorGraphics : ConicSensorGraphics,
        ConicSensorVisualizer : ConicSensorVisualizer,
        CustomPatternSensorGraphics : CustomPatternSensorGraphics,
        CustomPatternSensorVisualizer : CustomPatternSensorVisualizer,
        CustomSensorVolume : CustomSensorVolume,
        RectangularPyramidSensorVolume : RectangularPyramidSensorVolume,
        RectangularSensorGraphics : RectangularSensorGraphics,
        RectangularSensorVisualizer : RectangularSensorVisualizer
    };
});