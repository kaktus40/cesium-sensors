import { Cartesian3, JulianDate, Matrix4 } from "cesium";

const tmpCartesian = new Cartesian3();

/**
 * Resolve the world ECEF position of a target for visibility queries.
 *
 * Accepted target types:
 *   - Cesium Entity with a `position` property (ConstantProperty or sampled).
 *   - Cesium Primitive (uses modelMatrix translation).
 *   - Cartesian3 (used directly).
 *
 * @param {object|Cartesian3} target The target object or position.
 * @param {Cesium.JulianDate} [time] Time for temporal properties (default: now).
 * @returns {Cartesian3|null} The resolved position, or null if unavailable.
 */
export function resolveTargetPosition(target, time) {
  if (target instanceof Cartesian3) {
    return target;
  }

  if (target && typeof target === "object") {
    // Entity: use position property.
    if (target.position && typeof target.position.getValue === "function") {
      const pos = target.position.getValue(time || JulianDate.now(), tmpCartesian);
      return pos ? Cartesian3.clone(pos) : null;
    }
    // Primitive: use modelMatrix translation.
    if (target.modelMatrix instanceof Matrix4) {
      return Matrix4.getTranslation(target.modelMatrix, tmpCartesian);
    }
    // Fallback: look for a `position` field or `getPosition` method.
    if (target.getPosition && typeof target.getPosition === "function") {
      const pos = target.getPosition(time);
      return pos instanceof Cartesian3 ? Cartesian3.clone(pos) : null;
    }
    if (target.position instanceof Cartesian3) {
      return Cartesian3.clone(target.position);
    }
  }

  return null;
}

/**
 * Check whether a target has a resolvable position at the given time.
 * @param {object|Cartesian3} target
 * @param {Cesium.JulianDate} [time]
 * @returns {boolean}
 */
export function targetHasPosition(target, time) {
  return resolveTargetPosition(target, time) !== null;
}