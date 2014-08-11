/*global define*/
define([
        'Cesium/Core/clone',
        'Cesium/Core/defaultValue',
        'Cesium/Core/defined',
        'Cesium/Core/defineProperties',
        'Cesium/Core/destroyObject',
        'Cesium/Core/DeveloperError',
        'Cesium/Core/Math',
        'Cesium/Core/Spherical',
        './CustomSensorVolume'
    ], function(
        clone,
        defaultValue,
        defined,
        defineProperties,
        destroyObject,
        DeveloperError,
        CesiumMath,
        Spherical,
        CustomSensorVolume) {
    "use strict";

    function assignSpherical(index, array, clock, cone) {
        var spherical = array[index];
        if (!defined(spherical)) {
            array[index] = spherical = new Spherical();
        }
        spherical.clock = clock;
        spherical.cone = cone;
        spherical.magnitude = 1.0;
    }

    function updateDirections(rectangularSensor) {
        var directions = rectangularSensor._customSensor.directions;

        // At 90 degrees the sensor is completely open, and tan() goes to infinity.
        var tanX = Math.tan(Math.min(rectangularSensor._xHalfAngle, CesiumMath.toRadians(89.0)));
        var tanY = Math.tan(Math.min(rectangularSensor._yHalfAngle, CesiumMath.toRadians(89.0)));
        var theta = Math.atan(tanX / tanY);
        var cone = Math.atan(Math.sqrt(tanX * tanX + tanY * tanY));

        assignSpherical(0, directions, theta, cone);
        assignSpherical(1, directions, CesiumMath.toRadians(180.0) - theta, cone);
        assignSpherical(2, directions, CesiumMath.toRadians(180.0) + theta, cone);
        assignSpherical(3, directions, -theta, cone);

        directions.length = 4;
        rectangularSensor._customSensor.directions = directions;
    }

    var RectangularPyramidSensorVolume = function(options) {
        options = defaultValue(options, defaultValue.EMPTY_OBJECT);

        var customSensorOptions = clone(options);
        customSensorOptions._pickPrimitive = defaultValue(options._pickPrimitive, this);
        customSensorOptions.directions = undefined;
        this._customSensor = new CustomSensorVolume(customSensorOptions);

        this._xHalfAngle = defaultValue(options.xHalfAngle, CesiumMath.PI_OVER_TWO);
        this._yHalfAngle = defaultValue(options.yHalfAngle, CesiumMath.PI_OVER_TWO);

        updateDirections(this);
    };

    defineProperties(RectangularPyramidSensorVolume.prototype, {
        xHalfAngle : {
            get : function() {
                return this._xHalfAngle;
            },
            set : function(value) {
                //>>includeStart('debug', pragmas.debug)
                if (value > CesiumMath.PI_OVER_TWO) {
                    throw new DeveloperError('xHalfAngle must be less than or equal to 90 degrees.');
                }
                //>>includeEnd('debug');

                if (this._xHalfAngle !== value) {
                    this._xHalfAngle = value;
                    updateDirections(this);
                }
            }
        },
        yHalfAngle : {
            get : function() {
                return this._yHalfAngle;
            },
            set : function(value) {
                //>>includeStart('debug', pragmas.debug)
                if (value > CesiumMath.PI_OVER_TWO) {
                    throw new DeveloperError('yHalfAngle must be less than or equal to 90 degrees.');
                }
                //>>includeEnd('debug');

                if (this._yHalfAngle !== value) {
                    this._yHalfAngle = value;
                    updateDirections(this);
                }
            }
        },
        show : {
            get : function() {
                return this._customSensor.show;
            },
            set : function(value) {
                this._customSensor.show = value;
            }
        },
        showIntersection : {
            get : function() {
                return this._customSensor.showIntersection;
            },
            set : function(value) {
                this._customSensor.showIntersection = value;
            }
        },
        showThroughEllipsoid : {
            get : function() {
                return this._customSensor.showThroughEllipsoid;
            },
            set : function(value) {
                this._customSensor.showThroughEllipsoid = value;
            }
        },
        modelMatrix : {
            get : function() {
                return this._customSensor.modelMatrix;
            },
            set : function(value) {
                this._customSensor.modelMatrix = value;
            }
        },
        radius : {
            get : function() {
                return this._customSensor.radius;
            },
            set : function(value) {
                this._customSensor.radius = value;
            }
        },
        lateralSurfaceMaterial : {
            get : function() {
                return this._customSensor.lateralSurfaceMaterial;
            },
            set : function(value) {
                this._customSensor.lateralSurfaceMaterial = value;
            }
        },
        intersectionColor : {
            get : function() {
                return this._customSensor.intersectionColor;
            },
            set : function(value) {
                this._customSensor.intersectionColor = value;
            }
        },
        intersectionWidth : {
            get : function() {
                return this._customSensor.intersectionWidth;
            },
            set : function(value) {
                this._customSensor.intersectionWidth = value;
            }
        },
        id : {
            get : function() {
                return this._customSensor.id;
            },
            set : function(value) {
                this._customSensor.id = value;
            }
        }
    });

    RectangularPyramidSensorVolume.prototype.update = function(context, frameState, commandList) {
        this._customSensor.update(context, frameState, commandList);
    };

    RectangularPyramidSensorVolume.prototype.isDestroyed = function() {
        return false;
    };

    RectangularPyramidSensorVolume.prototype.destroy = function() {
        this._customSensor = this._customSensor && this._customSensor.destroy();
        return destroyObject(this);
    };

    return RectangularPyramidSensorVolume;
});