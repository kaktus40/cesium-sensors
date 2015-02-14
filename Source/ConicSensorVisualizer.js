/*global define*/
define([
        'Cesium/Core/AssociativeArray',
        'Cesium/Core/Cartesian3',
        'Cesium/Core/Color',
        'Cesium/Core/defined',
        'Cesium/Core/destroyObject',
        'Cesium/Core/DeveloperError',
        'Cesium/Core/Math',
        'Cesium/Core/Matrix3',
        'Cesium/Core/Matrix4',
        'Cesium/Core/Quaternion',
        'Cesium/Core/Spherical',
        './CustomSensorVolume',
        'Cesium/DataSources/MaterialProperty',
        'Cesium/DataSources/Property'
    ], function(
        AssociativeArray,
        Cartesian3,
        Color,
        defined,
        destroyObject,
        DeveloperError,
        CesiumMath,
        Matrix3,
        Matrix4,
        Quaternion,
        Spherical,
        CustomSensorVolume,
        MaterialProperty,
        Property) {
    "use strict";

    var defaultIntersectionColor = Color.WHITE;
    var defaultIntersectionWidth = 1.0;
    var defaultRadius = Number.POSITIVE_INFINITY;

    var matrix3Scratch = new Matrix3();
    var cachedPosition = new Cartesian3();
    var cachedOrientation = new Quaternion();

    function assignSpherical(index, array, clock, cone) {
        var spherical = array[index];
        if (!defined(spherical)) {
            array[index] = spherical = new Spherical();
        }
        spherical.clock = clock;
        spherical.cone = cone;
        spherical.magnitude = 1.0;
    }

    function computeDirections(primitive, minimumClockAngle, maximumClockAngle, innerHalfAngle, outerHalfAngle) {
        var directions = primitive.directions;
        var angle;
        var i = 0;
        var angleStep = CesiumMath.toRadians(2.0);
        if (minimumClockAngle === 0.0 && maximumClockAngle === CesiumMath.TWO_PI) {
            // No clock angle limits, so this is just a circle.
            // There might be a hole but we're ignoring it for now.
            for (angle = 0.0; angle < CesiumMath.TWO_PI; angle += angleStep) {
                assignSpherical(i++, directions, angle, outerHalfAngle);
            }
        } else {
            // There are clock angle limits.
            for (angle = minimumClockAngle; angle < maximumClockAngle; angle += angleStep) {
                assignSpherical(i++, directions, angle, outerHalfAngle);
            }
            assignSpherical(i++, directions, maximumClockAngle, outerHalfAngle);
            if (innerHalfAngle) {
                for (angle = maximumClockAngle; angle > minimumClockAngle; angle -= angleStep) {
                    assignSpherical(i++, directions, angle, innerHalfAngle);
                }
                assignSpherical(i++, directions, minimumClockAngle, innerHalfAngle);
            } else {
                assignSpherical(i++, directions, maximumClockAngle, 0.0);
            }
        }
        directions.length = i;
        primitive.directions = directions;
    }

    /**
     * A {@link Visualizer} which maps {@link Entity#conicSensor} to a {@link ConicSensor}.
     * @alias ConicSensorVisualizer
     * @constructor
     *
     * @param {Scene} scene The scene the primitives will be rendered in.
     * @param {EntityCollection} entityCollection The entityCollection to visualize.
     */
    var ConicSensorVisualizer = function(scene, entityCollection) {
        //>>includeStart('debug', pragmas.debug);
        if (!defined(scene)) {
            throw new DeveloperError('scene is required.');
        }
        if (!defined(entityCollection)) {
            throw new DeveloperError('entityCollection is required.');
        }
        //>>includeEnd('debug');

        entityCollection.collectionChanged.addEventListener(ConicSensorVisualizer.prototype._onCollectionChanged, this);

        this._scene = scene;
        this._primitives = scene.primitives;
        this._entityCollection = entityCollection;
        this._hash = {};
        this._entitiesToVisualize = new AssociativeArray();

        this._onCollectionChanged(entityCollection, entityCollection.values, [], []);
    };

    /**
     * Updates the primitives created by this visualizer to match their
     * Entity counterpart at the given time.
     *
     * @param {JulianDate} time The time to update to.
     * @returns {Boolean} This function always returns true.
     */
    ConicSensorVisualizer.prototype.update = function(time) {
        //>>includeStart('debug', pragmas.debug);
        if (!defined(time)) {
            throw new DeveloperError('time is required.');
        }
        //>>includeEnd('debug');

        var entities = this._entitiesToVisualize.values;
        var hash = this._hash;
        var primitives = this._primitives;

        for (var i = 0, len = entities.length; i < len; i++) {
            var entity = entities[i];
            var conicSensorGraphics = entity._conicSensor;

            var position;
            var orientation;
            var data = hash[entity.id];
            var show = entity.isAvailable(time) && Property.getValueOrDefault(conicSensorGraphics._show, time, true);

            if (show) {
                position = Property.getValueOrUndefined(entity._position, time, cachedPosition);
                orientation = Property.getValueOrUndefined(entity._orientation, time, cachedOrientation);
                show = defined(position) && defined(orientation);
            }

            if (!show) {
                //don't bother creating or updating anything else
                if (defined(data)) {
                    data.primitive.show = false;
                }
                continue;
            }

            var primitive = defined(data) ? data.primitive : undefined;
            if (!defined(primitive)) {
                primitive = new CustomSensorVolume();
                primitive.id = entity;
                primitives.add(primitive);

                data = {
                    primitive : primitive,
                    position : undefined,
                    orientation : undefined,
                    minimumClockAngle : undefined,
                    maximumClockAngle : undefined,
                    innerHalfAngle : undefined,
                    outerHalfAngle : undefined
                };
                hash[entity.id] = data;
            }

            if (!Cartesian3.equals(position, data.position) || !Quaternion.equals(orientation, data.orientation)) {
                Matrix4.fromRotationTranslation(Matrix3.fromQuaternion(orientation, matrix3Scratch), position, primitive.modelMatrix);
                data.position = Cartesian3.clone(position, data.position);
                data.orientation = Quaternion.clone(orientation, data.orientation);
            }

            primitive.show = true;
            var minimumClockAngle = Property.getValueOrDefault(conicSensorGraphics._minimumClockAngle, time, 0);
            var maximumClockAngle = Property.getValueOrDefault(conicSensorGraphics._maximumClockAngle, time, CesiumMath.TWO_PI);
            var innerHalfAngle = Property.getValueOrDefault(conicSensorGraphics._innerHalfAngle, time, 0);
            var outerHalfAngle = Property.getValueOrDefault(conicSensorGraphics._outerHalfAngle, time, Math.PI);

            if (minimumClockAngle !== data.minimumClockAngle ||
                maximumClockAngle !== data.maximumClockAngle ||
                innerHalfAngle !== data.innerHalfAngle ||
                outerHalfAngle !== data.outerHalfAngle) {

                computeDirections(primitive, minimumClockAngle, maximumClockAngle, innerHalfAngle, outerHalfAngle);
                data.innerHalfAngle = innerHalfAngle;
                data.maximumClockAngle = maximumClockAngle;
                data.outerHalfAngle = outerHalfAngle;
                data.minimumClockAngle = minimumClockAngle;
            }

            primitive.radius = Property.getValueOrDefault(conicSensorGraphics._radius, time, defaultRadius);
            primitive.lateralSurfaceMaterial = MaterialProperty.getValue(time, conicSensorGraphics._lateralSurfaceMaterial, primitive.lateralSurfaceMaterial);
            primitive.intersectionColor = Property.getValueOrClonedDefault(conicSensorGraphics._intersectionColor, time, defaultIntersectionColor, primitive.intersectionColor);
            primitive.intersectionWidth = Property.getValueOrDefault(conicSensorGraphics._intersectionWidth, time, defaultIntersectionWidth);
        }
        return true;
    };

    /**
     * Returns true if this object was destroyed; otherwise, false.
     *
     * @returns {Boolean} True if this object was destroyed; otherwise, false.
     */
    ConicSensorVisualizer.prototype.isDestroyed = function() {
        return false;
    };

    /**
     * Removes and destroys all primitives created by this instance.
     */
    ConicSensorVisualizer.prototype.destroy = function() {
        var entities = this._entitiesToVisualize.values;
        var hash = this._hash;
        var primitives = this._primitives;
        for (var i = entities.length - 1; i > -1; i--) {
            removePrimitive(entities[i], hash, primitives);
        }
        return destroyObject(this);
    };

    /**
     * @private
     */
    ConicSensorVisualizer.prototype._onCollectionChanged = function(entityCollection, added, removed, changed) {
        var i;
        var entity;
        var entities = this._entitiesToVisualize;
        var hash = this._hash;
        var primitives = this._primitives;

        for (i = added.length - 1; i > -1; i--) {
            entity = added[i];
            if (defined(entity._conicSensor) && defined(entity._position) && defined(entity._orientation)) {
                entities.set(entity.id, entity);
            }
        }

        for (i = changed.length - 1; i > -1; i--) {
            entity = changed[i];
            if (defined(entity._conicSensor) && defined(entity._position) && defined(entity._orientation)) {
                entities.set(entity.id, entity);
            } else {
                removePrimitive(entity, hash, primitives);
                entities.remove(entity.id);
            }
        }

        for (i = removed.length - 1; i > -1; i--) {
            entity = removed[i];
            removePrimitive(entity, hash, primitives);
            entities.remove(entity.id);
        }
    };

    function removePrimitive(entity, hash, primitives) {
        var data = hash[entity.id];
        if (defined(data)) {
            var primitive = data.primitive;
            primitives.remove(primitive);
            if (!primitive.isDestroyed()) {
                primitive.destroy();
            }
            delete hash[entity.id];
        }
    }

    return ConicSensorVisualizer;
});
