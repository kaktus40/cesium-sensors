import {
  defaultValue,
  defined,
  DeveloperError,
  Event,
  createPropertyDescriptor,
} from "cesium";

/**
 * Declarative graphics for a conic sensor attached to a Cesium {@link Entity}.
 *
 * Properties may be plain values or Cesium {@link Property} instances for
 * time-dynamic behavior.
 *
 * @alias ConicSensorGraphics
 * @constructor
 *
 * @param {object} [options] Object with the following properties:
 * @param {Property|number} [options.maximumRadius] Maximum cone length in meters.
 * @param {Property|number} [options.outerHalfAngle] Cone half-angle in radians.
 * @param {Property|Color} [options.color] Cone color, including alpha.
 * @param {Property|string} [options.occlusionMode] One of "NONE", "ELLIPSOID", "SCENE".
 * @param {Property|boolean} [options.show] Whether the sensor is visible.
 * @param {Property|string} [options.id] Sensor identifier.
 */
export function ConicSensorGraphics(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  this._maximumRadius = undefined;
  this._maximumRadiusSubscription = undefined;
  this._outerHalfAngle = undefined;
  this._outerHalfAngleSubscription = undefined;
  this._color = undefined;
  this._colorSubscription = undefined;
  this._occlusionMode = undefined;
  this._occlusionModeSubscription = undefined;
  this._show = undefined;
  this._showSubscription = undefined;
  this._id = undefined;
  this._idSubscription = undefined;
  this._definitionChanged = new Event();

  this.merge(options);
}

Object.defineProperties(ConicSensorGraphics.prototype, {
  /**
   * Gets the event that is raised whenever a new property is assigned.
   * @memberof ConicSensorGraphics.prototype
   * @type {Event}
   * @readonly
   */
  definitionChanged: {
    get: function () {
      return this._definitionChanged;
    },
  },

  /**
   * Gets or sets the numeric Property specifying the maximum cone length.
   * @memberof ConicSensorGraphics.prototype
   * @type {Property|number}
   */
  maximumRadius: createPropertyDescriptor("maximumRadius"),

  /**
   * Gets or sets the numeric Property specifying the cone half-angle in radians.
   * @memberof ConicSensorGraphics.prototype
   * @type {Property|number}
   */
  outerHalfAngle: createPropertyDescriptor("outerHalfAngle"),

  /**
   * Gets or sets the Color Property specifying the cone color.
   * @memberof ConicSensorGraphics.prototype
   * @type {Property|Color}
   */
  color: createPropertyDescriptor("color"),

  /**
   * Gets or sets the Property specifying the occlusion mode.
   * @memberof ConicSensorGraphics.prototype
   * @type {Property|string}
   */
  occlusionMode: createPropertyDescriptor("occlusionMode"),

  /**
   * Gets or sets the boolean Property specifying the sensor visibility.
   * @memberof ConicSensorGraphics.prototype
   * @type {Property|boolean}
   */
  show: createPropertyDescriptor("show"),

  /**
   * Gets or sets the Property specifying the sensor identifier.
   * @memberof ConicSensorGraphics.prototype
   * @type {Property|string}
   */
  id: createPropertyDescriptor("id"),
});

/**
 * Duplicates a ConicSensorGraphics instance.
 *
 * @param {ConicSensorGraphics} [result] The object onto which to store the result.
 * @returns {ConicSensorGraphics} The modified result parameter or a new instance.
 */
ConicSensorGraphics.prototype.clone = function (result) {
  if (!defined(result)) {
    result = new ConicSensorGraphics();
  }
  result.maximumRadius = this.maximumRadius;
  result.outerHalfAngle = this.outerHalfAngle;
  result.color = this.color;
  result.occlusionMode = this.occlusionMode;
  result.show = this.show;
  result.id = this.id;
  return result;
};

/**
 * Assigns each unassigned property on this object to the value
 * of the same property on the provided source object.
 *
 * @param {ConicSensorGraphics} source The object to be merged into this object.
 */
ConicSensorGraphics.prototype.merge = function (source) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(source)) {
    throw new DeveloperError("source is required.");
  }
  //>>includeEnd('debug');

  this.maximumRadius = defaultValue(this.maximumRadius, source.maximumRadius);
  this.outerHalfAngle = defaultValue(this.outerHalfAngle, source.outerHalfAngle);
  this.color = defaultValue(this.color, source.color);
  this.occlusionMode = defaultValue(
    this.occlusionMode,
    source.occlusionMode,
  );
  this.show = defaultValue(this.show, source.show);
  this.id = defaultValue(this.id, source.id);
};

/**
 * Occlusion modes supported by a conic sensor.
 * @type {{NONE: string, ELLIPSOID: string, SCENE: string}}
 * @readonly
 */
ConicSensorGraphics.OcclusionMode = {
  NONE: "NONE",
  ELLIPSOID: "ELLIPSOID",
  SCENE: "SCENE",
};
