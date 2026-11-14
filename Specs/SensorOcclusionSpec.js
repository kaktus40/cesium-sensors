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

  it("returns occluded true when segment enters ellipsoid before reaching target outside", function() {
    // Ray from 1200km altitude toward Earth center; target is on far side of ellipsoid.
    const target = Cartesian3.negate(origin, new Cartesian3());
    Cartesian3.multiplyByScalar(target, 2.0, target); // far side, outside ellipsoid
    const result = ellipsoidOcclusion(origin, target, inverseRadii, true);
    expect(result.occluded).toBe(true);
    expect(result.t).toBeGreaterThan(0);
  });

  it("returns occluded false when ray points away from ellipsoid", function() {
    // Ray pointing directly away from Earth's center.
    const dir = Cartesian3.clone(origin, new Cartesian3());
    Cartesian3.normalize(dir, dir);
    const target = Cartesian3.add(
      origin,
      Cartesian3.multiplyByScalar(dir, 500000.0, new Cartesian3()),
      new Cartesian3(),
    );
    const result = ellipsoidOcclusion(origin, target, inverseRadii, true);
    expect(result.occluded).toBe(false);
    expect(result.t).toBeNull();
  });

  it("returns occluded true when both origin and target are inside ellipsoid", function() {
    // Both points below surface (inside ellipsoid).
    const originInside = Cartesian3.fromDegrees(-75.0, 40.0, -100.0);
    const targetInside = Cartesian3.fromDegrees(-75.0, 40.0, -200.0);
    const result = ellipsoidOcclusion(originInside, targetInside, inverseRadii, true);
    expect(result.occluded).toBe(true);
    expect(result.t).toBe(1.0);
  });

  it("matches fragment shader ellipsoid occlusion logic on equivalent cases", function() {
    // Reproduit exactement le fragment shader de ConicSensor.js (lignes 105-119).
    function simulateShaderOcclusion(originWC, pointWC, inverseRadii, enabled) {
      if (!enabled) {
        return { occluded: false, discard: false };
      }
      const originScaled = Cartesian3.multiplyComponents(
        inverseRadii,
        originWC,
        new Cartesian3(),
      );
      const pointScaled = Cartesian3.multiplyComponents(
        inverseRadii,
        pointWC,
        new Cartesian3(),
      );
      const ray = Cartesian3.subtract(pointScaled, originScaled, new Cartesian3());

      const a = Cartesian3.dot(ray, ray);
      const b = 2.0 * Cartesian3.dot(originScaled, ray);
      const c = Cartesian3.dot(originScaled, originScaled) - 1.0;
      const discriminant = b * b - 4.0 * a * c;

      // Shader: if (discriminant >= 0.0 && a > 0.0) { t = ...; if (t > 0.00001 && t < 0.99999) discard; }
      let t = null;
      if (discriminant >= 0.0 && a > 0.0) {
        const sqrtDisc = Math.sqrt(discriminant);
        t = (-b - sqrtDisc) / (2.0 * a);
      }
      const shaderDiscard =
        discriminant >= 0.0 &&
        a > 0.0 &&
        t !== null &&
        t > 0.00001 &&
        t < 0.99999;

      // Shader: if (dot(pointScaled, pointScaled) < 1.0) discard;
      const pointInside = Cartesian3.dot(pointScaled, pointScaled) < 1.0;

      return { occluded: shaderDiscard || pointInside, discard: shaderDiscard };
    }

    const cases = [
      // [originLat, originLon, originAlt, targetLat, targetLon, targetAlt, expectedOccluded]
      [-75.0, 40.0, 1200000.0, -75.0, 40.0, 1300000.0, false], // outside to outside, up
      [-75.0, 40.0, 1200000.0, -75.0, 40.0, -100.0, true], // target inside
      [-75.0, 40.0, 1200000.0, -75.0, 40.0, 2000000.0, false], // entirely outside
      [-75.0, 40.0, 1200000.0, 75.0, -40.0, 1200000.0, true], // through Earth
      [-75.0, 40.0, -100.0, -75.0, 40.0, -200.0, true], // both inside
    ];

    for (let i = 0; i < cases.length; i++) {
      const [olat, olon, oalt, tlat, tlon, talt, expected] = cases[i];
      const originWC = Cartesian3.fromDegrees(olat, olon, oalt);
      const pointWC = Cartesian3.fromDegrees(tlat, tlon, talt);

      const cpu = ellipsoidOcclusion(originWC, pointWC, inverseRadii, true);
      const shader = simulateShaderOcclusion(
        originWC,
        pointWC,
        inverseRadii,
        true,
      );

      expect(cpu.occluded).toBe(
        expected,
        `case ${i}: CPU ${cpu.occluded} vs expected ${expected}`,
      );
      expect(shader.occluded).toBe(
        expected,
        `case ${i}: shader ${shader.occluded} vs expected ${expected}`,
      );
      // CPU et shader doivent s'accorder entre eux.
      expect(cpu.occluded).toBe(shader.occluded, `case ${i}: CPU/shader mismatch`);
    }
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

  it("returns occluded false when ray points away from ellipsoid", function() {
    const dir = Cartesian3.clone(origin, new Cartesian3());
    Cartesian3.normalize(dir, dir);
    const result = ellipsoidRayOcclusion(origin, dir, 2000000.0, inverseRadii, true);
    expect(result.occluded).toBe(false);
    expect(result.t).toBeNull();
  });

  it("returns occluded false when hit is beyond maxDistance", function() {
    const dir = Cartesian3.negate(origin, new Cartesian3());
    Cartesian3.normalize(dir, dir);
    const result = ellipsoidRayOcclusion(origin, dir, 100.0, inverseRadii, true);
    expect(result.occluded).toBe(false);
    expect(result.t).toBeNull();
  });

  it("returns occluded true when origin is inside ellipsoid", function() {
    const originInside = Cartesian3.fromDegrees(-75.0, 40.0, -100.0);
    const dir = Cartesian3.UNIT_Z;
    const result = ellipsoidRayOcclusion(originInside, dir, 2000000.0, inverseRadii, true);
    expect(result.occluded).toBe(true);
  });
});
