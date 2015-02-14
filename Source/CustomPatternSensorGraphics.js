/*global define*/
define([
        'Cesium/Core/defaultValue',
        'Cesium/Core/defined',
        'Cesium/Core/defineProperties',
        'Cesium/Core/DeveloperError',
        'Cesium/Core/Event',
        'Cesium/DataSources/createMaterialPropertyDescriptor',
        'Cesium/DataSources/createPropertyDescriptor'
    ], function(
        defaultValue,
        defined,
        defineProperties,
        DeveloperError,
        Event,
        createMaterialPropertyDescriptor,
        createPropertyDescriptor) {
    "use strict";

    /**
     * An optionally time-dynamic custom patterned sensor.
     *
     * @alias CustomPatternSensorGraphics
     * @constructor
     */
    var CustomPatternSensorGraphics = function(options) {
        this._directions = undefined;
        this._directionsSubscription = undefined;

        this._lateralSurfaceMaterial = undefined;
        this._lateralSurfaceMaterialSubscription = undefined;

        this._intersectionColor = undefined;
        this._intersectionColorSubscription = undefined;
        this._intersectionWidth = undefined;
        this._intersectionWidthSubscription = undefined;
        this._showIntersection = undefined;
        this._showIntersectionSubscription = undefined;
        this._radius = undefined;
        this._radiusSubscription = undefined;
        this._show = undefined;
        this._showSubscription = undefined;
        this._definitionChanged = new Event();

        this.merge(defaultValue(options, defaultValue.EMPTY_OBJECT));
    };

    defineProperties(CustomPatternSensorGraphics.prototype, {
        /**
         * Gets the event that is raised whenever a new property is assigned.
         * @memberof CustomPatternSensorGraphics.prototype
         *
         * @type {Event}
         * @readonly
         */
        definitionChanged : {
            get : function() {
                return this._definitionChanged;
            }
        },

        /**
         * A {@link Property} which returns an array of {@link Spherical} instances representing the sensor's projection.
         * @memberof CustomPatternSensorGraphics.prototype
         * @type {Property}
         */
        directions : createPropertyDescriptor('directions'),

        /**
         * Gets or sets the {@link MaterialProperty} specifying the the sensor's appearance.
         * @memberof CustomPatternSensorGraphics.prototype
         * @type {MaterialProperty}
         */
        lateralSurfaceMaterial : createMaterialPropertyDescriptor('lateralSurfaceMaterial'),

        /**
         * Gets or sets the {@link Color} {@link Property} specifying the color of the line formed by the intersection of the sensor and other central bodies.
         * @memberof CustomPatternSensorGraphics.prototype
         * @type {Property}
         */
        intersectionColor : createPropertyDescriptor('intersectionColor'),

        /**
         * Gets or sets the numeric {@link Property} specifying the width of the line formed by the intersection of the sensor and other central bodies.
         * @memberof CustomPatternSensorGraphics.prototype
         * @type {Property}
         */
        intersectionWidth : createPropertyDescriptor('intersectionWidth'),

        /**
         * Gets or sets the boolean {@link Property} specifying the visibility of the line formed by the intersection of the sensor and other central bodies.
         * @memberof CustomPatternSensorGraphics.prototype
         * @type {Property}
         */
        showIntersection : createPropertyDescriptor('showIntersection'),

        /**
         * Gets or sets the numeric {@link Property} specifying the radius of the sensor's projection.
         * @memberof CustomPatternSensorGraphics.prototype
         * @type {Property}
         */
        radius : createPropertyDescriptor('radius'),

        /**
         * Gets or sets the boolean {@link Property} specifying the visibility of the sensor.
         * @memberof CustomPatternSensorGraphics.prototype
         * @type {Property}
         */
        show : createPropertyDescriptor('show')
    });

    /**
     * Duplicates a CustomPatternSensorGraphics instance.
     *
     * @param {CustomPatternSensorGraphics} [result] The object onto which to store the result.
     * @returns {CustomPatternSensorGraphics} The modified result parameter or a new instance if one was not provided.
     */
    CustomPatternSensorGraphics.prototype.clone = function(result) {
        if (!defined(result)) {
            result = new CustomPatternSensorGraphics();
        }
        result.directions = this.directions;
        result.radius = this.radius;
        result.show = this.show;
        result.showIntersection = this.showIntersection;
        result.intersectionColor = this.intersectionColor;
        result.intersectionWidth = this.intersectionWidth;
        result.lateralSurfaceMaterial = this.lateralSurfaceMaterial;
        return result;
    };

    /**
     * Assigns each unassigned property on this object to the value
     * of the same property on the provided source object.
     *
     * @param {CustomPatternSensorGraphics} source The object to be merged into this object.
     */
    CustomPatternSensorGraphics.prototype.merge = function(source) {
        //>>includeStart('debug', pragmas.debug);
        if (!defined(source)) {
            throw new DeveloperError('source is required.');
        }
        //>>includeEnd('debug');

        this.directions = defaultValue(this.directions, source.directions);
        this.radius = defaultValue(this.radius, source.radius);
        this.show = defaultValue(this.show, source.show);
        this.showIntersection = defaultValue(this.showIntersection, source.showIntersection);
        this.intersectionColor = defaultValue(this.intersectionColor, source.intersectionColor);
        this.intersectionWidth = defaultValue(this.intersectionWidth, source.intersectionWidth);
        this.lateralSurfaceMaterial = defaultValue(this.lateralSurfaceMaterial, source.lateralSurfaceMaterial);
    };

    return CustomPatternSensorGraphics;
});