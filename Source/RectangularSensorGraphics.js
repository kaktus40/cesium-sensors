/*global define*/
define([
        'Cesium/Core/defaultValue',
        'Cesium/Core/defined',
        'Cesium/Core/defineProperties',
        'Cesium/Core/DeveloperError',
        'Cesium/Core/Event',
        'Cesium/DataSources/createPropertyDescriptor'
    ], function(
        defaultValue,
        defined,
        defineProperties,
        DeveloperError,
        Event,
        createPropertyDescriptor) {
    "use strict";

    /**
     * An optionally time-dynamic pyramid.
     *
     * @alias RectangularSensorGraphics
     * @constructor
     */
    var RectangularSensorGraphics = function() {
        this._xHalfAngle = undefined;
        this._xHalfAngleSubscription = undefined;
        this._yHalfAngle = undefined;
        this._yHalfAngleSubscription = undefined;

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
    };

    defineProperties(RectangularSensorGraphics.prototype, {
        /**
         * Gets the event that is raised whenever a new property is assigned.
         * @memberof RectangularSensorGraphics.prototype
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
         * A {@link Property} which returns an array of {@link Spherical} instances representing the pyramid's projection.
         * @memberof RectangularSensorGraphics.prototype
         * @type {Property}
         */
        xHalfAngle : createPropertyDescriptor('xHalfAngle'),

        /**
         * A {@link Property} which returns an array of {@link Spherical} instances representing the pyramid's projection.
         * @memberof RectangularSensorGraphics.prototype
         * @type {Property}
         */
        yHalfAngle : createPropertyDescriptor('yHalfAngle'),

        /**
         * Gets or sets the {@link MaterialProperty} specifying the the pyramid's appearance.
         * @memberof RectangularSensorGraphics.prototype
         * @type {MaterialProperty}
         */
        lateralSurfaceMaterial : createPropertyDescriptor('lateralSurfaceMaterial'),

        /**
         * Gets or sets the {@link Color} {@link Property} specifying the color of the line formed by the intersection of the pyramid and other central bodies.
         * @memberof RectangularSensorGraphics.prototype
         * @type {Property}
         */
        intersectionColor : createPropertyDescriptor('intersectionColor'),

        /**
         * Gets or sets the numeric {@link Property} specifying the width of the line formed by the intersection of the pyramid and other central bodies.
         * @memberof RectangularSensorGraphics.prototype
         * @type {Property}
         */
        intersectionWidth : createPropertyDescriptor('intersectionWidth'),

        /**
         * Gets or sets the boolean {@link Property} specifying the visibility of the line formed by the intersection of the pyramid and other central bodies.
         * @memberof RectangularSensorGraphics.prototype
         * @type {Property}
         */
        showIntersection : createPropertyDescriptor('showIntersection'),

        /**
         * Gets or sets the numeric {@link Property} specifying the radius of the pyramid's projection.
         * @memberof RectangularSensorGraphics.prototype
         * @type {Property}
         */
        radius : createPropertyDescriptor('radius'),

        /**
         * Gets or sets the boolean {@link Property} specifying the visibility of the pyramid.
         * @memberof RectangularSensorGraphics.prototype
         * @type {Property}
         */
        show : createPropertyDescriptor('show')
    });

    /**
     * Duplicates a RectangularSensorGraphics instance.
     *
     * @param {RectangularSensorGraphics} [result] The object onto which to store the result.
     * @returns {RectangularSensorGraphics} The modified result parameter or a new instance if one was not provided.
     */
    RectangularSensorGraphics.prototype.clone = function(result) {
        if (!defined(result)) {
            result = new RectangularSensorGraphics();
        }
        result.xHalfAngle = this.xHalfAngle;
        result.yHalfAngle = this.yHalfAngle;
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
     * @param {RectangularSensorGraphics} source The object to be merged into this object.
     */
    RectangularSensorGraphics.prototype.merge = function(source) {
        //>>includeStart('debug', pragmas.debug);
        if (!defined(source)) {
            throw new DeveloperError('source is required.');
        }
        //>>includeEnd('debug');

        this.xHalfAngle = defaultValue(this.xHalfAngle, source.xHalfAngle);
        this.yHalfAngle = defaultValue(this.yHalfAngle, source.yHalfAngle);
        this.radius = defaultValue(this.radius, source.radius);
        this.show = defaultValue(this.show, source.show);
        this.showIntersection = defaultValue(this.showIntersection, source.showIntersection);
        this.intersectionColor = defaultValue(this.intersectionColor, source.intersectionColor);
        this.intersectionWidth = defaultValue(this.intersectionWidth, source.intersectionWidth);
        this.lateralSurfaceMaterial = defaultValue(this.lateralSurfaceMaterial, source.lateralSurfaceMaterial);
    };

    return RectangularSensorGraphics;
});
