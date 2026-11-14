import { Cartesian3, defined } from "cesium";
import { resolveTargetPosition } from "../core/EntityAdapter.js";
import { intersectCone } from "../core/SensorGeometry.js";
import { ellipsoidOcclusion } from "../core/SensorOcclusion.js";
import { rayVsTerrain, createRay } from "../core/SceneOcclusion.js";

const tmpDirection = new Cartesian3();
const tmpAxis = new Cartesian3();
const tmpConeAxis = new Cartesian3();

/**
 * Result of a visibility query for a single sensor.
 *
 * @typedef {Object} SensorView
 * @property {object} sensor - Reference to the sensor (ConicSensor, RectangularSensor, CustomPatternSensor).
 * @property {number} distance - Meters along the ray to the surface of the volume.
 * @property {boolean} inVolume - Whether the target is inside the sensor volume.
 * @property {boolean} occluded - Whether the line of sight is occluded.
 */

/**
 * Compute whether a sensor sees a target, and the associated metadata.
 *
 * @param {object} sensor - A sensor instance with `modelMatrix`, `maximumRadius`, `outerHalfAngle`,
 *   `occlusionMode`, `show`, and `getOcclusionUniforms`/`appearance` accessors.
 * @param {object|Cartesian3} target - Entity, Primitive, or Cartesian3 target.
 * @param {object} [options]
 * @param {boolean} [options.includeOccludedVolume=false] - Include sensors whose line of sight is occluded.
 * @param {Cesium.JulianDate} [options.time] - Time for temporal properties.
 * @param {Cartesian3} [options.inverseRadii] - Ellipsoid inverse radii (from Cesium).
 * @param {boolean} [options.sceneOcclusion=false] - Enable terrain/scene occlusion test.
 * @param {object} [options.scene] - Cesium Scene (required if sceneOcclusion is true).
 * @returns {SensorView|null} null if the sensor cannot see the target (and includeOccludedVolume is false).
 */
export function computeSensorView(sensor, target, options = {}) {
  const {
    includeOccludedVolume = false,
    time,
    inverseRadii,
    sceneOcclusion = false,
    scene,
  } = options;

  if (!sensor.show) {
    return null;
  }

  const targetPos = resolveTargetPosition(target, time);
  if (!targetPos) {
    return null;
  }

  const sensorOrigin = Cartesian3.fromArray(
    [sensor.modelMatrix[12], sensor.modelMatrix[13], sensor.modelMatrix[14]],
    0,
    tmpDirection
  );

  const direction = Cartesian3.subtract(targetPos, sensorOrigin, tmpAxis);
  const distToTarget = Cartesian3.magnitude(direction);
  if (distToTarget < 1e-9) {
    // Target coincides with sensor origin: inside volume, not occluded.
    return {
      sensor,
      distance: 0.0,
      inVolume: true,
      occluded: false,
    };
  }
  Cartesian3.normalize(direction, direction);

  // Cone axis from model matrix.
  const coneAxis = Cartesian3.fromArray([sensor.modelMatrix[8], sensor.modelMatrix[9], sensor.modelMatrix[10]], 0, tmpConeAxis);

  // Intersection with the sensor volume.
  const hitDistance = intersectCone(
    sensorOrigin,
    direction,
    coneAxis,
    sensor.maximumRadius,
    sensor.outerHalfAngle
  );

  const inVolume = hitDistance !== null;
  if (!inVolume) {
    return null; // Target is outside the volume.
  }

  // Distance along the ray to the surface of the volume.
  const distance = hitDistance;

  // Occlusion test (ellipsoid reference).
  let occluded = false;
  if (sensor.occlusionMode !== "NONE" && inverseRadii) {
    const result = ellipsoidOcclusion(
      sensorOrigin,
      targetPos,
      inverseRadii,
      sensor.occlusionMode !== "NONE"
    );
    occluded = result.occluded;
  }

  // Occlusion test (terrain/scene).
  if (!occluded && sceneOcclusion && defined(scene)) {
    const ray = createRay(sensorOrigin, targetPos);
    const terrainResult = rayVsTerrain(ray, scene, distToTarget);
    occluded = terrainResult.occluded;
  }

  // If occluded and we don't include occluded volumes, skip.
  if (occluded && !includeOccludedVolume) {
    return null;
  }

  return {
    sensor,
    distance,
    inVolume,
    occluded,
  };
}

/**
 * Compute SensorView results for a list of sensors against a single target.
 *
 * @param {object[]} sensors - Array of sensor instances.
 * @param {object|Cartesian3} target - Entity, Primitive, or Cartesian3 target.
 * @param {object} [options]
 * @param {boolean} [options.includeOccludedVolume=false] - Include sensors whose line of sight is occluded.
 * @param {Cesium.JulianDate} [options.time] - Time for temporal properties.
 * @param {Cartesian3} [options.inverseRadii] - Ellipsoid inverse radii (from Cesium).
 * @param {boolean} [options.sceneOcclusion=false] - Enable terrain/scene occlusion test.
 * @param {object} [options.scene] - Cesium Scene (required if sceneOcclusion is true).
 * @returns {SensorView[]} Array of SensorView results, sorted by distance ascending.
 */
export function computeSensorViews(sensors, target, options = {}) {
  const results = [];
  for (let i = 0; i < sensors.length; i++) {
    const view = computeSensorView(sensors[i], target, options);
    if (view) {
      results.push(view);
    }
  }
  results.sort((a, b) => a.distance - b.distance);
  return results;
}