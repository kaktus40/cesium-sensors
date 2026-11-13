import { Event } from "cesium";
import { computeSensorViews } from "../queries/SensorView.js";

const errorEvent = new Event();

/**
 * SensorSystem centralizes sensors associated with a Scene and exposes
 * visibility queries such as `getSensorsSeeing`.
 *
 * A `SensorSystem` is created per `Scene`. It owns no sensors directly;
 * sensors register themselves with the system. The system centralizes
 * shared GPU resources, scheduling, occlusion quality, and visibility queries.
 *
 * @param {object} options Constructor options.
 * @param {object} options.scene The Cesium Scene this system belongs to.
 */
export function SensorSystem(options) {
  if (!(options && options.scene)) {
    throw new Error("SensorSystem requires a `scene`.");
  }

  this.scene = options.scene;
  this._sensors = [];
  this._occlusionQuality = "AUTO"; // LOW, BALANCED, HIGH, AUTO
  this.destroyed = false;
}

/**
 * Error event published for per-sensor validation errors without
 * preventing other sensors from being processed.
 * @type {Event}
 */
SensorSystem.errorEvent = errorEvent;

/**
 * Register a sensor with this system.
 * @param {object} sensor A sensor instance (ConicSensor, etc.).
 */
SensorSystem.prototype.addSensor = function (sensor) {
  if (this.destroyed) {
    throw new Error("SensorSystem is destroyed.");
  }
  if (this._sensors.indexOf(sensor) === -1) {
    this._sensors.push(sensor);
  }
};

/**
 * Unregister a sensor from this system.
 * @param {object} sensor
 */
SensorSystem.prototype.removeSensor = function (sensor) {
  const idx = this._sensors.indexOf(sensor);
  if (idx !== -1) {
    this._sensors.splice(idx, 1);
  }
};

/**
 * Get the number of registered sensors.
 * @returns {number}
 */
SensorSystem.prototype.getSensorCount = function () {
  return this._sensors.length;
};

/**
 * Which sensors see a target (Entity, Primitive, or Cartesian3).
 *
 * @param {object|Cartesian3} target Target with a position.
 * @param {object} [options]
 * @param {boolean} [options.includeOccludedVolume=false] Include sensors whose line of sight is occluded.
 * @param {Cesium.JulianDate} [options.time] Time for temporal properties (default: scene clock).
 * @param {Cartesian3} [options.inverseRadii] Ellipsoid inverse radii.
 * @returns {Promise<SensorView[]>} Results sorted by distance ascending.
 */
SensorSystem.prototype.getSensorsSeeing = function (target, options = {}) {
  return Promise.resolve().then(() => {
    if (this.destroyed) {
      throw new Error("SensorSystem is destroyed.");
    }

    const time = options.time || (this.scene.clock ? this.scene.clock.currentTime : undefined);
    const inverseRadii = options.inverseRadii;

    return computeSensorViews(this._sensors, target, {
      includeOccludedVolume: options.includeOccludedVolume,
      time,
      inverseRadii,
    });
  });
};

/**
 * Destroy the system and release references.
 */
SensorSystem.prototype.destroy = function () {
  this._sensors.length = 0;
  this.destroyed = true;
};