import { Cartesian3, Matrix4, Ellipsoid } from "cesium";
import { SensorSystem } from "../src/core/SensorSystem.js";
import { ConicSensor } from "../src/ConicSensor.js";

const defaultInverseRadii = Ellipsoid.WGS84.oneOverRadii;

function makeSensor(options = {}) {
  const origin = options.origin || Cartesian3.fromDegrees(-75.0, 40.0, 1200000.0);
  return new ConicSensor({
    modelMatrix: options.modelMatrix || Matrix4.fromTranslation(origin),
    maximumRadius: options.maximumRadius || 900000.0,
    outerHalfAngle: options.outerHalfAngle || 0.32,
    occlusionMode: options.occlusionMode || "NONE",
    show: options.show !== false,
    id: options.id || "test-sensor",
  });
}

const mockScene = { clock: { currentTime: undefined } };

describe("SensorSystem.getSensorsSeeing", function () {
  it("returns empty array when no sensors are registered", async function () {
    const system = new SensorSystem({ scene: mockScene });
    const target = Cartesian3.fromDegrees(-75.0, 40.0, 1200000.0 + 100000.0);
    const views = await system.getSensorsSeeing(target);
    expect(views.length).toBe(0);
  });

  it("returns SensorView for a sensor that sees the target", async function () {
    const system = new SensorSystem({ scene: mockScene });
    const sensor = makeSensor({ id: "radar" });
    system.addSensor(sensor);
    const target = Cartesian3.fromDegrees(-75.0, 40.0, 1200000.0 + 100000.0);
    const views = await system.getSensorsSeeing(target);
    expect(views.length).toBe(1);
    expect(views[0].sensor.id).toBe("radar");
    expect(views[0].inVolume).toBe(true);
    expect(views[0].occluded).toBe(false);
  });

  it("excludes disabled sensors", async function () {
    const system = new SensorSystem({ scene: mockScene });
    system.addSensor(makeSensor({ id: "active" }));
    system.addSensor(makeSensor({ id: "disabled", show: false }));
    const target = Cartesian3.fromDegrees(-75.0, 40.0, 1200000.0 + 100000.0);
    const views = await system.getSensorsSeeing(target);
    expect(views.length).toBe(1);
    expect(views[0].sensor.id).toBe("active");
  });

  it("returns results sorted by distance ascending", async function () {
    const system = new SensorSystem({ scene: mockScene });
    system.addSensor(makeSensor({ id: "far", maximumRadius: 900000.0 }));
    system.addSensor(makeSensor({ id: "near", maximumRadius: 100000.0 }));
    const target = Cartesian3.fromDegrees(-75.0, 40.0, 1200000.0 + 50000.0);
    const views = await system.getSensorsSeeing(target);
    expect(views.length).toBe(2);
    expect(views[0].distance).toBeLessThanOrEqual(views[1].distance);
  });

  it("includes occluded sensors when includeOccludedVolume is true", async function () {
    const system = new SensorSystem({ scene: mockScene });
    system.addSensor(makeSensor({ id: "occluded-sensor", occlusionMode: "ELLIPSOID" }));
    const target = Cartesian3.fromDegrees(-75.0, 40.0, -100.0);
    const inverseRadii = defaultInverseRadii;
    const views = await system.getSensorsSeeing(target, {
      includeOccludedVolume: true,
      inverseRadii,
    });
    expect(views.length).toBe(1);
    expect(views[0].occluded).toBe(true);
  });

  it("excludes occluded sensors when includeOccludedVolume is false", async function () {
    const system = new SensorSystem({ scene: mockScene });
    system.addSensor(makeSensor({ id: "occluded-sensor", occlusionMode: "ELLIPSOID" }));
    const target = Cartesian3.fromDegrees(-75.0, 40.0, -100.0);
    const inverseRadii = defaultInverseRadii;
    const views = await system.getSensorsSeeing(target, {
      includeOccludedVolume: false,
      inverseRadii,
    });
    expect(views.length).toBe(0);
  });

  it("throws when destroyed", async function () {
    const system = new SensorSystem({ scene: mockScene });
    system.destroy();
    const target = Cartesian3.fromDegrees(-75.0, 40.0, 1200000.0 + 100000.0);
    let threw = false;
    try {
      await system.getSensorsSeeing(target);
    } catch (e) {
      threw = true;
    }
    expect(threw).toBe(true);
  });

  it("throws when no scene is provided", function () {
    expect(function () {
      new SensorSystem({});
    }).toThrow();
  });
});