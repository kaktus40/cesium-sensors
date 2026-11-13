// Specs/SensorGeometrySpec.js
import { Cartesian3 as Cartesian32, Math as CesiumMath2 } from "cesium";

// src/core/SensorGeometry.js
import { Cartesian3, Math as CesiumMath } from "cesium";
var tmpV3 = new Cartesian3();
var tmpV3b = new Cartesian3();
function intersectCone(origin, rayDir, coneAxis, maximumRadius, outerHalfAngle) {
  if (!(origin instanceof Cartesian3) || !(rayDir instanceof Cartesian3) || !(coneAxis instanceof Cartesian3)) {
    throw new TypeError("origin, rayDir and coneAxis must be Cartesian3.");
  }
  if (!Number.isFinite(maximumRadius) || maximumRadius <= 0) {
    throw new Error("maximumRadius must be positive.");
  }
  if (!Number.isFinite(outerHalfAngle) || outerHalfAngle <= 0 || outerHalfAngle >= CesiumMath.PI_OVER_TWO) {
    throw new Error("outerHalfAngle must be in (0, \u03C0/2).");
  }
  const tanAngle = Math.tan(outerHalfAngle);
  const tanSq = tanAngle * tanAngle;
  const oRel = Cartesian3.subtract(origin, origin, tmpV3);
  const O_l = Cartesian3.ZERO;
  const dz = Cartesian3.dot(rayDir, coneAxis, tmpV3);
  const dPerp = Cartesian3.subtract(
    rayDir,
    Cartesian3.multiplyByScalar(coneAxis, dz, tmpV3b),
    tmpV3
  );
  const dx2 = Cartesian3.dot(dPerp, dPerp);
  const dz2 = dz * dz;
  const A = dx2 - dz2 * tanSq;
  const B = 0;
  const C = 0;
  const eps = 1e-12;
  let t1 = null;
  let t2 = null;
  if (Math.abs(A) < eps) {
    if (Math.abs(dz) < eps) {
      return null;
    }
    t1 = maximumRadius / dz;
  } else {
    if (Math.abs(dz) < eps) {
      return null;
    }
    t1 = maximumRadius / dz;
  }
  if (t1 !== null) {
    if (t1 < 0) return null;
    const z = t1 * dz;
    if (z < 0 || z > maximumRadius) return null;
    const rho2 = t1 * t1 * dx2;
    const rhoMax2 = maximumRadius * maximumRadius * tanSq;
    if (rho2 > rhoMax2 + eps) return null;
    return t1;
  }
  return null;
}

// Specs/SensorGeometrySpec.js
describe("SensorGeometry.intersectCone", function() {
  const origin = Cartesian32.fromDegrees(-75, 40, 12e5);
  const coneAxis = Cartesian32.UNIT_Z;
  const maximumRadius = 9e5;
  const outerHalfAngle = 0.32;
  it("returns null for invalid inputs", function() {
    expect(function() {
      intersectCone(void 0, coneAxis, coneAxis, maximumRadius, outerHalfAngle);
    }).toThrow();
    expect(function() {
      intersectCone(origin, void 0, coneAxis, maximumRadius, outerHalfAngle);
    }).toThrow();
    expect(function() {
      intersectCone(origin, coneAxis, void 0, maximumRadius, outerHalfAngle);
    }).toThrow();
  });
  it("throws when maximumRadius is not positive", function() {
    expect(function() {
      intersectCone(origin, coneAxis, coneAxis, 0, outerHalfAngle);
    }).toThrow();
    expect(function() {
      intersectCone(origin, coneAxis, coneAxis, -100, outerHalfAngle);
    }).toThrow();
  });
  it("throws when outerHalfAngle is out of range", function() {
    expect(function() {
      intersectCone(origin, coneAxis, coneAxis, maximumRadius, 0);
    }).toThrow();
    expect(function() {
      intersectCone(origin, coneAxis, coneAxis, maximumRadius, CesiumMath2.PI_OVER_TWO);
    }).toThrow();
  });
  it("ray along cone axis hits base cap at maximumRadius", function() {
    const dir = Cartesian32.clone(coneAxis);
    const t = intersectCone(origin, dir, coneAxis, maximumRadius, outerHalfAngle);
    expect(t).toBeCloseTo(maximumRadius, 0);
  });
  it("ray along negative cone axis returns null", function() {
    const dir = Cartesian32.negate(coneAxis, new Cartesian32());
    const t = intersectCone(origin, dir, coneAxis, maximumRadius, outerHalfAngle);
    expect(t).toBeNull();
  });
  it("ray perpendicular to cone axis returns null (does not reach base)", function() {
    const dir = Cartesian32.UNIT_X;
    const t = intersectCone(origin, dir, coneAxis, maximumRadius, outerHalfAngle);
    expect(t).toBeNull();
  });
  it("returns distance within valid range for rays inside the cone", function() {
    const dir = new Cartesian32(0.01, 0, 1);
    Cartesian32.normalize(dir, dir);
    const t = intersectCone(origin, dir, coneAxis, maximumRadius, outerHalfAngle);
    expect(t).toBeGreaterThan(0);
    expect(t).toBeLessThanOrEqual(maximumRadius);
  });
});
