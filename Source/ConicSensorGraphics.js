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
     * An optionally time-dynamic cone.
     *
     * @alias ConicSensorGraphics
     * @constructor
     */
    var ConicSensorGraphics = function(options) {
        this._minimumClockAngle = undefined;
        this._minimumClockAngleSubscription = undefined;
        this._maximumClockAngle = undefined;
        this._maximumClockAngleSubscription = undefined;
        this._innerHalfAngle = undefined;
        this._innerHalfAngleSubscription = undefined;
        this._outerHalfAngle = undefined;
        this._outerHalfAngleSubscription = undefined;
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

    defineProperties(ConicSensorGraphics.prototype, {
        /**
         * Gets the event that is raised whenever a new property is assigned.
         * @memberof ConicSensorGraphics.prototype
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
         * Gets or sets the numeric {@link Property} specifying the the cone's minimum clock angle.
         * @memberof ConicSensorGraphics.prototype
         * @type {Property}
         */
        minimumClockAngle : createPropertyDescriptor('minimumClockAngle'),

        /**
         * Gets or sets the numeric {@link Property} specifying the the cone's maximum clock angle.
         * @memberof ConicSensorGraphics.prototype
         * @type {Property}
         */
        maximumClockAngle : createPropertyDescriptor('maximumClockAngle'),

        /**
         * Gets or sets the numeric {@link Property} specifying the the cone's inner half-angle.
         * @memberof ConicSensorGraphics.prototype
         * @type {Property}
         */
        innerHalfAngle : createPropertyDescriptor('innerHalfAngle'),

        /**
         * Gets or sets the numeric {@link Property} specifying the the cone's outer half-angle.
         * @memberof ConicSensorGraphics.prototype
         * @type {Property}
         */
        outerHalfAngle : createPropertyDescriptor('outerHalfAngle'),

        /**
         * Gets or sets the {@link MaterialProperty} specifying the the cone's appearance.
         * @memberof ConicSensorGraphics.prototype
         * @type {MaterialProperty}
         */
        lateralSurfaceMaterial : createMaterialPropertyDescriptor('lateralSurfaceMaterial'),

        /**
         * Gets or sets the {@link Color} {@link Property} specifying the color of the line formed by the intersection of the cone and other central bodies.
         * @memberof ConicSensorGraphics.prototype
         * @type {Property}
         */
        intersectionColor : createPropertyDescriptor('intersectionColor'),

        /**
         * Gets or sets the numeric {@link Property} specifying the width of the line formed by the intersection of the cone and other central bodies.
         * @memberof ConicSensorGraphics.prototype
         * @type {Property}
         */
        intersectionWidth : createPropertyDescriptor('intersectionWidth'),

        /**
         * Gets or sets the boolean {@link Property} specifying the visibility of the line formed by the intersection of the cone and other central bodies.
         * @memberof ConicSensorGraphics.prototype
         * @type {Property}
         */
        showIntersection : createPropertyDescriptor('showIntersection'),

        /**
         * Gets or sets the numeric {@link Property} specifying the radius of the cone's projection.
         * @memberof ConicSensorGraphics.prototype
         * @type {Property}
         */
        radius : createPropertyDescriptor('radius'),

        /**
         * Gets or sets the boolean {@link Property} specifying the visibility of the cone.
         * @memberof ConicSensorGraphics.prototype
         * @type {Property}
         */
        show : createPropertyDescriptor('show')
    });

    /**
     * Duplicates a ConicSensorGraphics instance.
     *
     * @param {ConicSensorGraphics} [result] The object onto which to store the result.
     * @returns {ConicSensorGraphics} The modified result parameter or a new instance if one was not provided.
     */
    ConicSensorGraphics.prototype.clone = function(result) {
        if (!defined(result)) {
            result = new ConicSensorGraphics();
        }
        result.show = this.show;
        result.innerHalfAngle = this.innerHalfAngle;
        result.outerHalfAngle = this.outerHalfAngle;
        result.minimumClockAngle = this.minimumClockAngle;
        result.maximumClockAngle = this.maximumClockAngle;
        result.radius = this.radius;
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
     * @param {ConicSensorGraphics} source The object to be merged into this object.
     */
    ConicSensorGraphics.prototype.merge = function(source) {
        //>>includeStart('debug', pragmas.debug);
        if (!defined(source)) {
            throw new DeveloperError('source is required.');
        }
        //>>includeEnd('debug');

        this.show = defaultValue(this.show, source.show);
        this.innerHalfAngle = defaultValue(this.innerHalfAngle, source.innerHalfAngle);
        this.outerHalfAngle = defaultValue(this.outerHalfAngle, source.outerHalfAngle);
        this.minimumClockAngle = defaultValue(this.minimumClockAngle, source.minimumClockAngle);
        this.maximumClockAngle = defaultValue(this.maximumClockAngle, source.maximumClockAngle);
        this.radius = defaultValue(this.radius, source.radius);
        this.showIntersection = defaultValue(this.showIntersection, source.showIntersection);
        this.intersectionColor = defaultValue(this.intersectionColor, source.intersectionColor);
        this.intersectionWidth = defaultValue(this.intersectionWidth, source.intersectionWidth);
        this.lateralSurfaceMaterial = defaultValue(this.lateralSurfaceMaterial, source.lateralSurfaceMaterial);
    };

    return ConicSensorGraphics;
});