// Specs/SensorOcclusionSpec.js
import { Cartesian3 as Cartesian32, Ellipsoid } from "cesium";

// src/core/SensorOcclusion.js
import { Cartesian3, Math as CesiumMath } from "cesium";
var tmpCartesian = new Cartesian3();
var tmpCartesianB = new Cartesian3();
function ellipsoidOcclusion(originWC, pointWC, inverseRadii, enabled) {
  if (!enabled) {
    return { occluded: false, t: null };
  }
  const originScaled = Cartesian3.multiplyComponents(inverseRadii, originWC, tmpCartesian);
  const pointScaled = Cartesian3.multiplyComponents(inverseRadii, pointWC, tmpCartesianB);
  const ray = Cartesian3.subtract(pointScaled, originScaled, tmpCartesian);
  const a = Cartesian3.dot(ray, ray);
  const b = 2 * Cartesian3.dot(originScaled, ray);
  const c = Cartesian3.dot(originScaled, originScaled) - 1;
  const discriminant = b * b - 4 * a * c;
  if (Cartesian3.dot(pointScaled, pointScaled) < 1) {
    return { occluded: true, t: 1 };
  }
  if (discriminant >= 0 && a > 0) {
    const sqrtDisc = Math.sqrt(discriminant);
    const t = (-b - sqrtDisc) / (2 * a);
    if (t > 1e-5 && t < 0.99999) {
      return { occluded: true, t };
    }
  }
  return { occluded: false, t: null };
}
function ellipsoidRayOcclusion(originWC, rayDir, maxDistance, inverseRadii, enabled) {
  if (!enabled) {
    return { occluded: false, t: null };
  }
  const originScaled = Cartesian3.multiplyComponents(inverseRadii, originWC, tmpCartesian);
  const rayScaled = Cartesian3.multiplyComponents(inverseRadii, rayDir, tmpCartesianB);
  const a = Cartesian3.dot(rayScaled, rayScaled);
  const b = 2 * Cartesian3.dot(originScaled, rayScaled);
  const c = Cartesian3.dot(originScaled, originScaled) - 1;
  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0 || a <= 0) {
    return { occluded: false, t: null };
  }
  const sqrtDisc = Math.sqrt(discriminant);
  const t0 = (-b - sqrtDisc) / (2 * a);
  const t1 = (-b + sqrtDisc) / (2 * a);
  let hitT = null;
  if (t0 > 1e-5) hitT = t0;
  else if (t1 > 1e-5) hitT = t1;
  if (hitT !== null && hitT <= maxDistance) {
    return { occluded: true, t: hitT };
  }
  return { occluded: false, t: null };
}

// Specs/SensorOcclusionSpec.js
describe("SensorOcclusion.ellipsoidOcclusion", function() {
  const ellipsoid = Ellipsoid.WGS84;
  const inverseRadii = ellipsoid.inverseRadii;
  const origin = Cartesian32.fromDegrees(-75, 40, 12e5);
  it("returns { occluded: false, t: null } when disabled", function() {
    const point = Cartesian32.fromDegrees(-75, 40, 13e5);
    const result = ellipsoidOcclusion(origin, point, inverseRadii, false);
    expect(result.occluded).toBe(false);
    expect(result.t).toBeNull();
  });
  it("returns occluded true when target point is inside ellipsoid", function() {
    const point = Cartesian32.fromDegrees(-75, 40, 100);
    const result = ellipsoidOcclusion(origin, point, inverseRadii, true);
    expect(result.occluded).toBe(true);
  });
  it("returns occluded false for segment entirely outside ellipsoid", function() {
    const point = Cartesian32.fromDegrees(-75, 40, 2e6);
    const result = ellipsoidOcclusion(origin, point, inverseRadii, true);
    expect(result.occluded).toBe(false);
  });
  it("throws on invalid inverseRadii", function() {
    expect(function() {
      ellipsoidOcclusion(origin, origin, void 0, true);
    }).toThrow();
  });
});
describe("SensorOcclusion.ellipsoidRayOcclusion", function() {
  const ellipsoid = Ellipsoid.WGS84;
  const inverseRadii = ellipsoid.inverseRadii;
  const origin = Cartesian32.fromDegrees(-75, 40, 12e5);
  it("returns { occluded: false, t: null } when disabled", function() {
    const dir = Cartesian32.UNIT_Z;
    const result = ellipsoidRayOcclusion(origin, dir, 1e6, inverseRadii, false);
    expect(result.occluded).toBe(false);
    expect(result.t).toBeNull();
  });
  it("returns occluded false when ray does not hit ellipsoid within maxDistance", function() {
    const dir = Cartesian32.UNIT_Z;
    const result = ellipsoidRayOcclusion(origin, dir, 1e5, inverseRadii, true);
    expect(result.occluded).toBe(false);
  });
  it("returns occluded true when ray hits ellipsoid within maxDistance", function() {
    const dir = Cartesian32.negate(Cartesian32.UNIT_Z, new Cartesian32());
    const result = ellipsoidRayOcclusion(origin, dir, 2e6, inverseRadii, true);
    expect(result.occluded).toBe(true);
    expect(result.t).toBeGreaterThan(0);
  });
});
