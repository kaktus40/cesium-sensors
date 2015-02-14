/*global define*/
define([
        'Cesium/Core/AssociativeArray',
        'Cesium/Core/Cartesian3',
        'Cesium/Core/Color',
        'Cesium/Core/defined',
        'Cesium/Core/destroyObject',
        'Cesium/Core/DeveloperError',
        'Cesium/Core/Matrix3',
        'Cesium/Core/Matrix4',
        'Cesium/Core/Quaternion',
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
        Matrix3,
        Matrix4,
        Quaternion,
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

    /**
     * A {@link Visualizer} which maps {@link Entity#customPatternSensor} to a {@link CustomPatternSensor}.
     * @alias CustomPatternSensorVisualizer
     * @constructor
     *
     * @param {Scene} scene The scene the primitives will be rendered in.
     * @param {EntityCollection} entityCollection The entityCollection to visualize.
     */
    var CustomPatternSensorVisualizer = function(scene, entityCollection) {
        //>>includeStart('debug', pragmas.debug);
        if (!defined(scene)) {
            throw new DeveloperError('scene is required.');
        }
        if (!defined(entityCollection)) {
            throw new DeveloperError('entityCollection is required.');
        }
        //>>includeEnd('debug');

        entityCollection.collectionChanged.addEventListener(CustomPatternSensorVisualizer.prototype._onCollectionChanged, this);

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
    CustomPatternSensorVisualizer.prototype.update = function(time) {
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
            var customPatternSensorGraphics = entity._customPatternSensor;

            var position;
            var orientation;
            var directions;
            var data = hash[entity.id];
            var show = entity.isAvailable(time) && Property.getValueOrDefault(customPatternSensorGraphics._show, time, true);

            if (show) {
                position = Property.getValueOrUndefined(entity._position, time, cachedPosition);
                orientation = Property.getValueOrUndefined(entity._orientation, time, cachedOrientation);
                directions = Property.getValueOrUndefined(customPatternSensorGraphics._directions, time);
                show = defined(position) && defined(orientation) && defined(directions);
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
                    orientation : undefined
                };
                hash[entity.id] = data;
            }

            if (!Cartesian3.equals(position, data.position) || !Quaternion.equals(orientation, data.orientation)) {
                Matrix4.fromRotationTranslation(Matrix3.fromQuaternion(orientation, matrix3Scratch), position, primitive.modelMatrix);
                data.position = Cartesian3.clone(position, data.position);
                data.orientation = Quaternion.clone(orientation, data.orientation);
            }

            primitive.show = true;
            primitive.directions = directions;
            primitive.radius = Property.getValueOrDefault(customPatternSensorGraphics._radius, time, defaultRadius);
            primitive.lateralSurfaceMaterial = MaterialProperty.getValue(time, customPatternSensorGraphics._lateralSurfaceMaterial, primitive.lateralSurfaceMaterial);
            primitive.intersectionColor = Property.getValueOrClonedDefault(customPatternSensorGraphics._intersectionColor, time, defaultIntersectionColor, primitive.intersectionColor);
            primitive.intersectionWidth = Property.getValueOrDefault(customPatternSensorGraphics._intersectionWidth, time, defaultIntersectionWidth);
        }
        return true;
    };

    /**
     * Returns true if this object was destroyed; otherwise, false.
     *
     * @returns {Boolean} True if this object was destroyed; otherwise, false.
     */
    CustomPatternSensorVisualizer.prototype.isDestroyed = function() {
        return false;
    };

    /**
     * Removes and destroys all primitives created by this instance.
     */
    CustomPatternSensorVisualizer.prototype.destroy = function() {
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
    CustomPatternSensorVisualizer.prototype._onCollectionChanged = function(entityCollection, added, removed, changed) {
        var i;
        var entity;
        var entities = this._entitiesToVisualize;
        var hash = this._hash;
        var primitives = this._primitives;

        for (i = added.length - 1; i > -1; i--) {
            entity = added[i];
            if (defined(entity._customPatternSensor) && defined(entity._position) && defined(entity._orientation)) {
                entities.set(entity.id, entity);
            }
        }

        for (i = changed.length - 1; i > -1; i--) {
            entity = changed[i];
            if (defined(entity._customPatternSensor) && defined(entity._position) && defined(entity._orientation)) {
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

    return CustomPatternSensorVisualizer;
});