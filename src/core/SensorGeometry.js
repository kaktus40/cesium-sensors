import { Cartesian3, Math as CesiumMath } from "cesium";

const tmpV3 = new Cartesian3();
const tmpV3b = new Cartesian3();

/**
 * Ray-cone intersection.
 *
 * The cone points along local positive Z, has a half-angle `outerHalfAngle`
 * and a length `maximumRadius`. The apex (origin) is at (0,0,0) in local space.
 *
 * @param {Cartesian3} origin World position of the sensor origin (apex).
 * @param {Cartesian3} rayDir Unit world direction of the ray.
 * @param {Cartesian3} coneAxis World direction of the cone's local +Z axis.
 * @param {number} maximumRadius Maximum cone length in meters.
 * @param {number} outerHalfAngle Cone half-angle in radians, in (0, π/2).
 * @returns {number|null} Distance along the ray to the cone surface, or null if no intersection.
 */
export function intersectCone(origin, rayDir, coneAxis, maximumRadius, outerHalfAngle) {
  if (!(origin instanceof Cartesian3) || !(rayDir instanceof Cartesian3) || !(coneAxis instanceof Cartesian3)) {
    throw new TypeError("origin, rayDir and coneAxis must be Cartesian3.");
  }
  if (!Number.isFinite(maximumRadius) || maximumRadius <= 0.0) {
    throw new Error("maximumRadius must be positive.");
  }
  if (!Number.isFinite(outerHalfAngle) || outerHalfAngle <= 0.0 || outerHalfAngle >= CesiumMath.PI_OVER_TWO) {
    throw new Error("outerHalfAngle must be in (0, π/2).");
  }

  const tanAngle = Math.tan(outerHalfAngle);
  const tanSq = tanAngle * tanAngle;

  // Ray direction in local cone space.
  // D_l.z = dot(rayDir, coneAxis); D_l.xyz perpendicular = rayDir - D_l.z * coneAxis.
  const dz = Cartesian3.dot(rayDir, coneAxis, tmpV3);
  const dPerp = Cartesian3.subtract(
    rayDir,
    Cartesian3.multiplyByScalar(coneAxis, dz, tmpV3b),
    tmpV3
  );
  const dx2 = Cartesian3.dot(dPerp, dPerp);
  const dz2 = dz * dz;

  // Cone equation in local space: rho^2 = z^2 * tan^2(theta), 0 <= z <= maximumRadius.
  // Ray: P_l = O_l + t * D_l = (t*dPerp.x, t*dPerp.y, t*dz).
  // rho^2 = t^2 * dx2; z = t*dz.
  // t^2 * dx2 = t^2 * dz^2 * tanSq  =>  t^2 * (dx2 - dz2 * tanSq) = 0.
  const A = dx2 - dz2 * tanSq;

  // Degenerate cases handled below.
  const eps = 1e-12;
  let t1 = null;

  if (Math.abs(A) < eps) {
    // Ray parallel to cone surface or along axis.
    if (Math.abs(dz) < eps) {
      // Ray perpendicular to cone axis -> no intersection unless origin on surface (origin is apex).
      return null;
    }
    // Ray along axis -> intersects base cap at z = maximumRadius.
    t1 = maximumRadius / dz;
  } else {
    // Quadratic: A*t^2 + B*t + C = 0  =>  A*t^2 = 0  =>  t = 0 (apex only).
    // Since origin IS the apex, the ray starts ON the cone surface.
    // We need the *far* intersection with the base cap or the side.
    // The side intersection for t>0 when A != 0 only exists at t=0 (apex).
    // So the only non-trivial intersection is the base cap at z = maximumRadius.
    if (Math.abs(dz) < eps) {
      return null; // never reaches base cap.
    }
    t1 = maximumRadius / dz;
  }

  // Clamp t to valid range: z in [0, maximumRadius].
  if (t1 !== null) {
    if (t1 < 0.0) return null;
    const z = t1 * dz;
    if (z < 0.0 || z > maximumRadius) return null;
    // Check side surface: at the base cap, rho = maximumRadius * tanAngle.
    // Verify the ray hits the disk, not outside.
    const rho2 = t1 * t1 * dx2;
    const rhoMax2 = maximumRadius * maximumRadius * tanSq;
    if (rho2 > rhoMax2 + eps) return null; // outside the base disk.
    return t1;
  }

  return null;
}