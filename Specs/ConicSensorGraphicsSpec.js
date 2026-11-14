import { Cartesian3, Color, Ellipsoid, Property } from "cesium";
import { ConicSensorGraphics } from "../src/dataSources/ConicSensorGraphics.js";

function getPropValue(g, name) {
  return Property.getValueOrDefault(g[name], undefined, null);
}

describe("ConicSensorGraphics", function () {
  it("constructs with default values", function () {
    const g = new ConicSensorGraphics();
    expect(getPropValue(g, "maximumRadius")).toBeNull();
    expect(getPropValue(g, "outerHalfAngle")).toBeNull();
    expect(getPropValue(g, "occlusionMode")).toBeNull();
    expect(getPropValue(g, "show")).toBeNull();
    expect(getPropValue(g, "id")).toBeNull();
    expect(g.definitionChanged === undefined).toBe(false);
  });

  it("constructs with provided options", function () {
    const g = new ConicSensorGraphics({
      maximumRadius: 500000.0,
      outerHalfAngle: 0.25,
      color: Color.RED,
      occlusionMode: ConicSensorGraphics.OcclusionMode.NONE,
      show: false,
      id: "my-sensor",
    });
    expect(getPropValue(g, "maximumRadius")).toBe(500000.0);
    expect(getPropValue(g, "outerHalfAngle")).toBe(0.25);
    const c = getPropValue(g, "color");
    expect(c.red).toBe(Color.RED.red);
    expect(c.green).toBe(Color.RED.green);
    expect(c.blue).toBe(Color.RED.blue);
    expect(c.alpha).toBe(Color.RED.alpha);
    expect(getPropValue(g, "occlusionMode")).toBe("NONE");
    expect(getPropValue(g, "show")).toBe(false);
    expect(getPropValue(g, "id")).toBe("my-sensor");
  });

  it("clones properties", function () {
    const original = new ConicSensorGraphics({
      maximumRadius: 100000.0,
      outerHalfAngle: 0.5,
      color: Color.BLUE,
      occlusionMode: ConicSensorGraphics.OcclusionMode.SCENE,
      show: false,
      id: "clone-source",
    });
    const clone = original.clone();
    expect(clone).not.toBe(original);
    expect(getPropValue(clone, "maximumRadius")).toBe(100000.0);
    expect(getPropValue(clone, "outerHalfAngle")).toBe(0.5);
    const cc = getPropValue(clone, "color");
    expect(cc.red).toBe(Color.BLUE.red);
    expect(cc.green).toBe(Color.BLUE.green);
    expect(cc.blue).toBe(Color.BLUE.blue);
    expect(cc.alpha).toBe(Color.BLUE.alpha);
    expect(getPropValue(clone, "occlusionMode")).toBe("SCENE");
    expect(getPropValue(clone, "show")).toBe(false);
    expect(getPropValue(clone, "id")).toBe("clone-source");
  });

  it("supports Property instances as values", function () {
    const g = new ConicSensorGraphics({ maximumRadius: 123456.0 });
    expect(getPropValue(g, "maximumRadius")).toBe(123456.0);
  });
});
