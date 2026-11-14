import { Cartesian3, Matrix3, Matrix4, Ellipsoid } from "cesium";
import { computeSensorView, computeSensorViews } from "../src/queries/SensorView.js";

const defaultOrigin = Cartesian3.fromDegrees(-75.0, 40.0, 1200000.0);
const defaultInverseRadii = Ellipsoid.WGS84.oneOverRadii;

function makeSensor(options = {}) {
  const origin = options.origin || defaultOrigin;
  let modelMatrix = options.modelMatrix;
  if (!modelMatrix && options.aimAt) {
    // Orient the cone's +Z axis so it points at the aimAt target.
    const target = options.aimAt;
    const axis = Cartesian3.normalize(Cartesian3.subtract(target, origin, new Cartesian3()), new Cartesian3());
    const upRef = Math.abs(Cartesian3.dot(axis, Cartesian3.UNIT_Z)) > 0.9 ? Cartesian3.UNIT_X : Cartesian3.UNIT_Z;
    const right = Cartesian3.normalize(Cartesian3.cross(upRef, axis, new Cartesian3()), new Cartesian3());
    const trueUp = Cartesian3.cross(axis, right, new Cartesian3());
    const rot = new Matrix3(
      right.x, trueUp.x, axis.x,
      right.y, trueUp.y, axis.y,
      right.z, trueUp.z, axis.z
    );
    modelMatrix = Matrix4.fromRotationTranslation(rot, origin, new Matrix4());
  }
  return {
    modelMatrix: modelMatrix || Matrix4.fromTranslation(origin),
    maximumRadius: options.maximumRadius || 900000.0,
    outerHalfAngle: options.outerHalfAngle || 0.32,
    occlusionMode: options.occlusionMode || "NONE",
    show: options.show !== false,
    id: options.id || "test-sensor",
  };
}

describe("SensorView.computeSensorView", function () {
  const sensorOrigin = Cartesian3.fromDegrees(-75.0, 40.0, 1200000.0);

  it("returns null when target is outside the volume", function () {
    const sensor = makeSensor();
    // Target at a very different location, well outside the cone half-angle.
    const target = Cartesian3.fromDegrees(-75.0 + 10.0, 40.0 + 10.0, 1200000.0 + 100000.0);
    const view = computeSensorView(sensor, target);
    expect(view).toBeNull();
  });

  it("returns SensorView when target is inside the volume", function () {
    const sensor = makeSensor({ aimAt: Cartesian3.fromDegrees(-75.0, 40.0, 1200000.0 + 100000.0) });
    const target = Cartesian3.fromDegrees(-75.0, 40.0, 1200000.0 + 100000.0);
    const view = computeSensorView(sensor, target);
    expect(view).not.toBeNull();
    expect(view.inVolume).toBe(true);
    expect(view.occluded).toBe(false);
    expect(view.distance).toBeGreaterThan(0);
  });

  it("returns null when sensor is disabled", function () {
    const sensor = makeSensor({ show: false });
    const target = Cartesian3.fromDegrees(-75.0, 40.0, 1200000.0 + 100000.0);
    const view = computeSensorView(sensor, target);
    expect(view).toBeNull();
  });

  it("returns null when target has no position", function () {
    const sensor = makeSensor();
    const view = computeSensorView(sensor, {});
    expect(view).toBeNull();
  });

  it("returns occluded view when includeOccludedVolume is true", function () {
    const sensor = makeSensor({ occlusionMode: "ELLIPSOID", aimAt: Cartesian3.fromDegrees(-75.0, 40.0, -100.0) });
    // Target inside the ellipsoid (below surface).
    const target = Cartesian3.fromDegrees(-75.0, 40.0, -100.0);
    const inverseRadii = defaultInverseRadii;
    const view = computeSensorView(sensor, target, {
      includeOccludedVolume: true,
      inverseRadii,
    });
    expect(view).not.toBeNull();
    expect(view.occluded).toBe(true);
  });

  it("returns null when occluded and includeOccludedVolume is false", function () {
    const sensor = makeSensor({ occlusionMode: "ELLIPSOID", aimAt: Cartesian3.fromDegrees(-75.0, 40.0, -100.0) });
    const target = Cartesian3.fromDegrees(-75.0, 40.0, -100.0);
    const inverseRadii = defaultInverseRadii;
    const view = computeSensorView(sensor, target, {
      includeOccludedVolume: false,
      inverseRadii,
    });
    expect(view).toBeNull();
  });

  it("returns null when occlusionMode is NONE and target is inside ellipsoid", function () {
    const sensor = makeSensor({ occlusionMode: "NONE", aimAt: Cartesian3.fromDegrees(-75.0, 40.0, -100.0) });
    const target = Cartesian3.fromDegrees(-75.0, 40.0, -100.0);
    const inverseRadii = defaultInverseRadii;
    const view = computeSensorView(sensor, target, {
      includeOccludedVolume: true,
      inverseRadii,
    });
    expect(view).not.toBeNull();
    expect(view.occluded).toBe(false);
  });
});

describe("SensorView.computeSensorViews", function () {
  it("returns results sorted by distance ascending", function () {
    const target = Cartesian3.fromDegrees(-75.0, 40.0, 1200000.0 + 50000.0);
    const sensors = [
      makeSensor({ id: "far", maximumRadius: 900000.0, aimAt: target }),
      makeSensor({ id: "near", maximumRadius: 100000.0, aimAt: target }),
    ];
    const views = computeSensorViews(sensors, target);
    expect(views.length).toBe(2);
    expect(views[0].distance).toBeLessThanOrEqual(views[1].distance);
  });

  it("excludes disabled sensors", function () {
    const target = Cartesian3.fromDegrees(-75.0, 40.0, 1200000.0 + 100000.0);
    const sensors = [
      makeSensor({ id: "active", aimAt: target }),
      makeSensor({ id: "disabled", show: false, aimAt: target }),
    ];
    const views = computeSensorViews(sensors, target);
    expect(views.length).toBe(1);
    expect(views[0].sensor.id).toBe("active");
  });
});