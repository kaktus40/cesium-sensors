/*global define*/
define([
        'Cesium/Core/Cartesian3',
        'Cesium/Core/Color',
        'Cesium/Core/defined',
        'Cesium/Core/Spherical',
        'Cesium/Core/TimeInterval',
        'Cesium/DataSources/CzmlDataSource',
        'Cesium/DataSources/DataSourceDisplay',
        './ConicSensorGraphics',
        './ConicSensorVisualizer',
        './CustomPatternSensorGraphics',
        './CustomPatternSensorVisualizer',
        './RectangularSensorGraphics',
        './RectangularSensorVisualizer'
    ], function(
        Cartesian3,
        Color,
        defined,
        Spherical,
        TimeInterval,
        CzmlDataSource,
        DataSourceDisplay,
        ConicSensorGraphics,
        ConicSensorVisualizer,
        CustomPatternSensorGraphics,
        CustomPatternSensorVisualizer,
        RectangularSensorGraphics,
        RectangularSensorVisualizer) {
    "use strict";

    var processPacketData = CzmlDataSource.processPacketData;
    var processMaterialPacketData = CzmlDataSource.processMaterialPacketData;

    function processDirectionData(customPatternSensor, directions, interval, sourceUri, entityCollection) {
        var i;
        var len;
        var values = [];
        var unitSphericals = directions.unitSpherical;
        var sphericals = directions.spherical;
        var unitCartesians = directions.unitCartesian;
        var cartesians = directions.cartesian;

        if (defined(unitSphericals)) {
            for (i = 0, len = unitSphericals.length; i < len; i += 2) {
                values.push(new Spherical(unitSphericals[i], unitSphericals[i + 1]));
            }
            directions.array = values;
        } else if (defined(sphericals)) {
            for (i = 0, len = sphericals.length; i < len; i += 3) {
                values.push(new Spherical(sphericals[i], sphericals[i + 1], sphericals[i + 2]));
            }
            directions.array = values;
        } else if (defined(unitCartesians)) {
            for (i = 0, len = unitCartesians.length; i < len; i += 3) {
                var tmp = Spherical.fromCartesian3(new Cartesian3(unitCartesians[i], unitCartesians[i + 1], unitCartesians[i + 2]));
                Spherical.normalize(tmp, tmp);
                values.push(tmp);
            }
            directions.array = values;
        } else if (defined(cartesians)) {
            for (i = 0, len = cartesians.length; i < len; i += 3) {
                values.push(Spherical.fromCartesian3(new Cartesian3(cartesians[i], cartesians[i + 1], cartesians[i + 2])));
            }
            directions.array = values;
        }
        processPacketData(Array, customPatternSensor, 'directions', directions, interval, sourceUri, entityCollection);
    }

    function processCommonSensorProperties(sensor, sensorData, interval, sourceUri, entityCollection) {
        processPacketData(Boolean, sensor, 'show', sensorData.show, interval, sourceUri, entityCollection);
        processPacketData(Number, sensor, 'radius', sensorData.radius, interval, sourceUri, entityCollection);
        processPacketData(Boolean, sensor, 'showIntersection', sensorData.showIntersection, interval, sourceUri, entityCollection);
        processPacketData(Color, sensor, 'intersectionColor', sensorData.intersectionColor, interval, sourceUri, entityCollection);
        processPacketData(Number, sensor, 'intersectionWidth', sensorData.intersectionWidth, interval, sourceUri, entityCollection);
        processMaterialPacketData(sensor, 'lateralSurfaceMaterial', sensorData.lateralSurfaceMaterial, interval, sourceUri, entityCollection);
    }

    var iso8601Scratch = {
        iso8601 : undefined
    };

    function processConicSensor(entity, packet, entityCollection, sourceUri) {
        var conicSensorData = packet.agi_conicSensor;
        if (!defined(conicSensorData)) {
            return;
        }

        var interval;
        var intervalString = conicSensorData.interval;
        if (defined(intervalString)) {
            iso8601Scratch.iso8601 = intervalString;
            interval = TimeInterval.fromIso8601(iso8601Scratch);
        }

        var conicSensor = entity.conicSensor;
        if (!defined(conicSensor)) {
            entity.addProperty('conicSensor');
            entity.conicSensor = conicSensor = new ConicSensorGraphics();
        }

        processCommonSensorProperties(conicSensor, conicSensorData, interval, sourceUri, entityCollection);
        processPacketData(Number, conicSensor, 'innerHalfAngle', conicSensorData.innerHalfAngle, interval, sourceUri, entityCollection);
        processPacketData(Number, conicSensor, 'outerHalfAngle', conicSensorData.outerHalfAngle, interval, sourceUri, entityCollection);
        processPacketData(Number, conicSensor, 'minimumClockAngle', conicSensorData.minimumClockAngle, interval, sourceUri, entityCollection);
        processPacketData(Number, conicSensor, 'maximumClockAngle', conicSensorData.maximumClockAngle, interval, sourceUri, entityCollection);
    }

    function processCustomPatternSensor(entity, packet, entityCollection, sourceUri) {
        var customPatternSensorData = packet.agi_customPatternSensor;
        if (!defined(customPatternSensorData)) {
            return;
        }

        var interval;
        var intervalString = customPatternSensorData.interval;
        if (defined(intervalString)) {
            iso8601Scratch.iso8601 = intervalString;
            interval = TimeInterval.fromIso8601(iso8601Scratch);
        }

        var customPatternSensor = entity.customPatternSensor;
        if (!defined(customPatternSensor)) {
            entity.addProperty('customPatternSensor');
            entity.customPatternSensor = customPatternSensor = new CustomPatternSensorGraphics();
        }

        processCommonSensorProperties(customPatternSensor, customPatternSensorData, interval, sourceUri, entityCollection);

        //The directions property is a special case value that can be an array of unitSpherical or unit Cartesians.
        //We pre-process this into Spherical instances and then process it like any other array.
        var directions = customPatternSensorData.directions;
        if (defined(directions)) {
            if (Array.isArray(directions)) {
                var length = directions.length;
                for (var i = 0; i < length; i++) {
                    processDirectionData(customPatternSensor, directions[i], interval, sourceUri, entityCollection);
                }
            } else {
                processDirectionData(customPatternSensor, directions, interval, sourceUri, entityCollection);
            }
        }
    }

    function processRectangularSensor(entity, packet, entityCollection, sourceUri) {
        var rectangularSensorData = packet.agi_rectangularSensor;
        if (!defined(rectangularSensorData)) {
            return;
        }

        var interval;
        var intervalString = rectangularSensorData.interval;
        if (defined(intervalString)) {
            iso8601Scratch.iso8601 = intervalString;
            interval = TimeInterval.fromIso8601(iso8601Scratch);
        }

        var rectangularSensor = entity.rectangularSensor;
        if (!defined(rectangularSensor)) {
            entity.addProperty('rectangularSensor');
            entity.rectangularSensor = rectangularSensor = new RectangularSensorGraphics();
        }

        processCommonSensorProperties(rectangularSensor, rectangularSensorData, interval, sourceUri, entityCollection);
        processPacketData(Number, rectangularSensor, 'xHalfAngle', rectangularSensorData.xHalfAngle, interval, sourceUri, entityCollection);
        processPacketData(Number, rectangularSensor, 'yHalfAngle', rectangularSensorData.yHalfAngle, interval, sourceUri, entityCollection);
    }

    var initialized = false;
    var initialize = function() {
        if (initialized) {
            return;
        }

        CzmlDataSource.updaters.push(processConicSensor, processCustomPatternSensor, processRectangularSensor);

        var originalDefaultVisualizersCallback = DataSourceDisplay.defaultVisualizersCallback;
        DataSourceDisplay.defaultVisualizersCallback = function(scene, dataSource) {
            var entities = dataSource.entities;
            var array = originalDefaultVisualizersCallback(scene, dataSource);
            return array.concat([new ConicSensorVisualizer(scene, entities),
                                 new CustomPatternSensorVisualizer(scene, entities),
                                 new RectangularSensorVisualizer(scene, entities)]);
        };

        initialized = true;
    };

    return initialize;
});