/*global define*/
define([
        './initialize',
        './ConicSensorGraphics',
        './ConicSensorVisualizer',
        './CustomPatternSensorGraphics',
        './CustomPatternSensorVisualizer',
        './CustomSensorVolume',
        './RectangularSensorGraphics',
        './RectangularSensorVisualizer'
    ], function(
        initialize,
        ConicSensorGraphics,
        ConicSensorVisualizer,
        CustomPatternSensorGraphics,
        CustomPatternSensorVisualizer,
        CustomSensorVolume,
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
        RectangularSensorGraphics : RectangularSensorGraphics,
        RectangularSensorVisualizer : RectangularSensorVisualizer
    };
});