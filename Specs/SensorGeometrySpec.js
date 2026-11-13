import { Cartesian3, Math as CesiumMath } from "cesium";
import { intersectCone } from "../src/core/SensorGeometry.js";

describe("SensorGeometry.intersectCone", function() {
  const origin = Cartesian3.fromDegrees(-75.0, 40.0, 1200000.0);
  const coneAxis = Cartesian3.UNIT_Z;
  const maximumRadius = 900000.0;
  const outerHalfAngle = 0.32;

  it("returns null for invalid inputs", function() {
    expect(function() {
      intersectCone(undefined, coneAxis, coneAxis, maximumRadius, outerHalfAngle);
    }).toThrow();
    expect(function() {
      intersectCone(origin, undefined, coneAxis, maximumRadius, outerHalfAngle);
    }).toThrow();
    expect(function() {
      intersectCone(origin, coneAxis, undefined, maximumRadius, outerHalfAngle);
    }).toThrow();
  });

  it("throws when maximumRadius is not positive", function() {
    expect(function() {
      intersectCone(origin, coneAxis, coneAxis, 0.0, outerHalfAngle);
    }).toThrow();
    expect(function() {
      intersectCone(origin, coneAxis, coneAxis, -100.0, outerHalfAngle);
    }).toThrow();
  });

  it("throws when outerHalfAngle is out of range", function() {
    expect(function() {
      intersectCone(origin, coneAxis, coneAxis, maximumRadius, 0.0);
    }).toThrow();
    expect(function() {
      intersectCone(origin, coneAxis, coneAxis, maximumRadius, CesiumMath.PI_OVER_TWO);
    }).toThrow();
  });

  it("ray along cone axis hits base cap at maximumRadius", function() {
    const dir = Cartesian3.clone(coneAxis);
    const t = intersectCone(origin, dir, coneAxis, maximumRadius, outerHalfAngle);
    expect(t).toBeCloseTo(maximumRadius, 0);
  });

  it("ray along negative cone axis returns null", function() {
    const dir = Cartesian3.negate(coneAxis, new Cartesian3());
    const t = intersectCone(origin, dir, coneAxis, maximumRadius, outerHalfAngle);
    expect(t).toBeNull();
  });

  it("ray perpendicular to cone axis returns null (does not reach base)", function() {
    const dir = Cartesian3.UNIT_X;
    const t = intersectCone(origin, dir, coneAxis, maximumRadius, outerHalfAngle);
    expect(t).toBeNull();
  });

  it("returns distance within valid range for rays inside the cone", function() {
    // Ray slightly tilted from axis should still hit the base cap within the disk.
    const dir = new Cartesian3(0.01, 0.0, 1.0);
    Cartesian3.normalize(dir, dir);
    const t = intersectCone(origin, dir, coneAxis, maximumRadius, outerHalfAngle);
    expect(t).not.toBeNull();
    expect(t).toBeGreaterThan(0);
    // For a slightly tilted ray, the intersection distance is approximately
    // maximumRadius / cos(tilt), which is slightly larger than maximumRadius.
    // The base cap is a disk, so the distance is bounded by maximumRadius / cos(outerHalfAngle).
    const maxExpected = maximumRadius / Math.cos(outerHalfAngle);
    expect(t).toBeLessThanOrEqual(maxExpected);
  });
});