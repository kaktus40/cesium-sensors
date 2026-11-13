import { Cartesian3, Ellipsoid } from "cesium";
import { ellipsoidOcclusion, ellipsoidRayOcclusion } from "../src/core/SensorOcclusion.js";

describe("SensorOcclusion.ellipsoidOcclusion", function() {
  const ellipsoid = Ellipsoid.WGS84;
  const inverseRadii = ellipsoid.oneOverRadii;
  const origin = Cartesian3.fromDegrees(-75.0, 40.0, 1200000.0);

  it("returns { occluded: false, t: null } when disabled", function() {
    const point = Cartesian3.fromDegrees(-75.0, 40.0, 1300000.0);
    const result = ellipsoidOcclusion(origin, point, inverseRadii, false);
    expect(result.occluded).toBe(false);
    expect(result.t).toBeNull();
  });

  it("returns occluded true when target point is inside ellipsoid", function() {
    // Point below the surface (negative altitude) is inside the ellipsoid.
    const point = Cartesian3.fromDegrees(-75.0, 40.0, -100.0);
    const result = ellipsoidOcclusion(origin, point, inverseRadii, true);
    expect(result.occluded).toBe(true);
  });

  it("returns occluded false for segment entirely outside ellipsoid", function() {
    const point = Cartesian3.fromDegrees(-75.0, 40.0, 2000000.0);
    const result = ellipsoidOcclusion(origin, point, inverseRadii, true);
    expect(result.occluded).toBe(false);
  });

  it("throws on invalid inverseRadii", function() {
    expect(function() {
      ellipsoidOcclusion(origin, origin, undefined, true);
    }).toThrow();
  });
});

describe("SensorOcclusion.ellipsoidRayOcclusion", function() {
  const ellipsoid = Ellipsoid.WGS84;
  const inverseRadii = ellipsoid.oneOverRadii;
  const origin = Cartesian3.fromDegrees(-75.0, 40.0, 1200000.0);

  it("returns { occluded: false, t: null } when disabled", function() {
    const dir = Cartesian3.UNIT_Z;
    const result = ellipsoidRayOcclusion(origin, dir, 1000000.0, inverseRadii, false);
    expect(result.occluded).toBe(false);
    expect(result.t).toBeNull();
  });

  it("returns occluded false when ray does not hit ellipsoid within maxDistance", function() {
    const dir = Cartesian3.UNIT_Z;
    const result = ellipsoidRayOcclusion(origin, dir, 100000.0, inverseRadii, true);
    expect(result.occluded).toBe(false);
  });

  it("returns occluded true when ray hits ellipsoid within maxDistance", function() {
    // Direction from sensor origin toward the center of the Earth.
    const dir = Cartesian3.negate(origin, new Cartesian3());
    Cartesian3.normalize(dir, dir);
    const result = ellipsoidRayOcclusion(origin, dir, 2000000.0, inverseRadii, true);
    expect(result.occluded).toBe(true);
    expect(result.t).toBeGreaterThan(0);
  });
});
