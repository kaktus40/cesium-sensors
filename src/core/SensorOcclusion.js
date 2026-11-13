import { Cartesian3, Math as CesiumMath } from "cesium";

const tmpCartesian = new Cartesian3();
const tmpCartesianB = new Cartesian3();

/**
 * Evaluate ellipsoid occlusion for a segment from sensor origin to a target point.
 *
 * Mirrors the fragment shader logic in ConicSensor.js but executes on the CPU
 * so that `getSensorsSeeing` can decide visibility without a GPU pass.
 *
 * The ellipsoid test is performed in scaled space where the ellipsoid becomes
 * a unit sphere centered at the origin.
 *
 * @param {Cartesian3} originWC Sensor origin in world coordinates.
 * @param {Cartesian3} pointWC Target point in world coordinates.
 * @param {Cartesian3} inverseRadii Ellipsoid inverse radii (czm_ellipsoidInverseRadii).
 * @param {boolean} enabled Whether ellipsoid occlusion is active.
 * @returns {{ occluded: boolean, t: number|null }} `occluded` is true if the segment
 *   intersects the ellipsoid before reaching `pointWC`. `t` is the parametric hit
 *   distance along the segment (0 = origin, 1 = point).
 */
export function ellipsoidOcclusion(originWC, pointWC, inverseRadii, enabled) {
  if (!enabled) {
    return { occluded: false, t: null };
  }

  const originScaled = Cartesian3.multiplyComponents(inverseRadii, originWC, tmpCartesian);
  const pointScaled = Cartesian3.multiplyComponents(inverseRadii, pointWC, tmpCartesianB);
  const ray = Cartesian3.subtract(pointScaled, originScaled, tmpCartesian);

  const a = Cartesian3.dot(ray, ray);
  const b = 2.0 * Cartesian3.dot(originScaled, ray);
  const c = Cartesian3.dot(originScaled, originScaled) - 1.0;

  const discriminant = b * b - 4.0 * a * c;

  // Point inside the ellipsoid.
  if (Cartesian3.dot(pointScaled, pointScaled) < 1.0) {
    return { occluded: true, t: 1.0 };
  }

  if (discriminant >= 0.0 && a > 0.0) {
    const sqrtDisc = Math.sqrt(discriminant);
    const t = (-b - sqrtDisc) / (2.0 * a);
    // The segment enters the ellipsoid strictly between origin and point.
    if (t > 0.00001 && t < 0.99999) {
      return { occluded: true, t };
    }
  }

  return { occluded: false, t: null };
}

/**
 * Test whether a ray from the sensor origin is occluded by the ellipsoid
 * before reaching a given distance along the ray.
 *
 * @param {Cartesian3} originWC Sensor origin in world coordinates.
 * @param {Cartesian3} rayDir Unit world direction of the ray.
 * @param {number} maxDistance Maximum distance to consider.
 * @param {Cartesian3} inverseRadii Ellipsoid inverse radii.
 * @param {boolean} enabled Whether ellipsoid occlusion is active.
 * @returns {{ occluded: boolean, t: number|null }} `t` is distance along the ray
 *   where the ellipsoid is first hit (null if no hit).
 */
export function ellipsoidRayOcclusion(originWC, rayDir, maxDistance, inverseRadii, enabled) {
  if (!enabled) {
    return { occluded: false, t: null };
  }

  const originScaled = Cartesian3.multiplyComponents(inverseRadii, originWC, tmpCartesian);
  const rayScaled = Cartesian3.multiplyComponents(inverseRadii, rayDir, tmpCartesianB);

  const a = Cartesian3.dot(rayScaled, rayScaled);
  const b = 2.0 * Cartesian3.dot(originScaled, rayScaled);
  const c = Cartesian3.dot(originScaled, originScaled) - 1.0;

  const discriminant = b * b - 4.0 * a * c;

  if (discriminant < 0.0 || a <= 0.0) {
    return { occluded: false, t: null };
  }

  const sqrtDisc = Math.sqrt(discriminant);
  const t0 = (-b - sqrtDisc) / (2.0 * a);
  const t1 = (-b + sqrtDisc) / (2.0 * a);

  // First positive hit along the ray.
  let hitT = null;
  if (t0 > 0.00001) hitT = t0;
  else if (t1 > 0.00001) hitT = t1;

  if (hitT !== null && hitT <= maxDistance) {
    return { occluded: true, t: hitT };
  }

  return { occluded: false, t: null };
}

/**
 * Normalize an orientation matrix into a cone axis (local +Z in world).
 *
 * @param {Matrix4} modelMatrix Sensor model matrix.
 * @param {Cartesian3} result Output axis.
 * @returns {Cartesian3} The cone axis direction in world coordinates.
 */
export function coneAxisFromModelMatrix(modelMatrix, result) {
  // Column 2 of the upper 3x3 is the local +Z axis.
  result.x = modelMatrix[2];
  result.y = modelMatrix[6];
  result.z = modelMatrix[10];
  return Cartesian3.normalize(result, result);
}