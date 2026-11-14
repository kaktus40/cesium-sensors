import { Cartesian3, Ray, Ellipsoid } from "cesium";
import { rayVsTerrain, rayVs3DTiles, createRay } from "../src/core/SceneOcclusion.js";
import { DepthPass } from "../src/core/DepthPass.js";

describe("SceneOcclusion.createRay", function () {
  it("creates a ray from origin to target", function () {
    const origin = Cartesian3.fromDegrees(-75.0, 40.0, 1200000.0);
    const target = Cartesian3.fromDegrees(-75.0, 40.0, 1300000.0);
    const ray = createRay(origin, target);

    expect(ray.origin.x).toBeCloseTo(origin.x, 6);
    expect(ray.origin.y).toBeCloseTo(origin.y, 6);
    expect(ray.origin.z).toBeCloseTo(origin.z, 6);
    // Direction is normalized.
    const mag = Cartesian3.magnitude(ray.direction);
    expect(mag).toBeCloseTo(1.0, 6);
  });

  it("normalizes the direction", function () {
    const origin = Cartesian3.fromDegrees(-75.0, 40.0, 1200000.0);
    const target = Cartesian3.fromDegrees(-74.0, 41.0, 1300000.0);
    const ray = createRay(origin, target);
    const mag = Cartesian3.magnitude(ray.direction);
    expect(mag).toBeCloseTo(1.0, 6);
  });
});

describe("SceneOcclusion.rayVsTerrain", function () {
  const origin = Cartesian3.fromDegrees(-75.0, 40.0, 1200000.0);

  function makeScene(globePickResult) {
    return {
      globe: {
        show: true,
        pick: function (ray, scene) {
          return globePickResult;
        },
      },
    };
  }

  it("returns occluded false when globe is hidden", function () {
    const scene = { globe: { show: false } };
    const ray = new Ray(origin, Cartesian3.UNIT_Z);
    const result = rayVsTerrain(ray, scene, 2000000.0);
    expect(result.occluded).toBe(false);
    expect(result.hit).toBeNull();
  });

  it("returns occluded false when globe.pick returns undefined", function () {
    const scene = makeScene(undefined);
    const ray = new Ray(origin, Cartesian3.negate(Cartesian3.UNIT_Z, new Cartesian3()));
    const result = rayVsTerrain(ray, scene, 2000000.0);
    expect(result.occluded).toBe(false);
    expect(result.hit).toBeNull();
  });

  it("returns occluded true when hit is within maxDistance", function () {
    const hit = Cartesian3.fromDegrees(-75.0, 40.0, 1100000.0); // 100km below origin
    const scene = makeScene(hit);
    const ray = new Ray(origin, Cartesian3.negate(Cartesian3.UNIT_Z, new Cartesian3()));
    const result = rayVsTerrain(ray, scene, 2000000.0);
    expect(result.occluded).toBe(true);
    expect(result.hit).toBe(hit);
  });

  it("returns occluded false when hit is beyond maxDistance", function () {
    const hit = Cartesian3.fromDegrees(-75.0, 40.0, 0.0); // far below origin
    const scene = makeScene(hit);
    const ray = new Ray(origin, Cartesian3.negate(Cartesian3.UNIT_Z, new Cartesian3()));
    const result = rayVsTerrain(ray, scene, 500000.0); // only 500km max
    expect(result.occluded).toBe(false);
    expect(result.hit).toBeNull();
  });

  it("throws on invalid scene", function () {
    let threw = false;
    try {
      rayVsTerrain(new Ray(origin, Cartesian3.UNIT_Z), undefined, 2000000.0);
    } catch (e) {
      threw = true;
    }
    expect(threw).toBe(true);
  });

  it("throws on invalid ray", function () {
    let threw = false;
    try {
      rayVsTerrain(undefined, { globe: { show: true, pick: () => undefined } }, 1000.0);
    } catch (e) {
      threw = true;
    }
    expect(threw).toBe(true);
  });

  it("throws on invalid scene", function () {
    let threw = false;
    try {
      rayVsTerrain(new Ray(origin, Cartesian3.UNIT_Z), undefined, 1000.0);
    } catch (e) {
      threw = true;
    }
    expect(threw).toBe(true);
  });
});

describe("SceneOcclusion.rayVs3DTiles", function () {
  const origin = Cartesian3.fromDegrees(-75.0, 40.0, 1200000.0);

  it("delegates to depthPass.testRay and returns its result", function () {
    const scene = { context: {}, globe: { show: true } };
    const ray = new Ray(origin, Cartesian3.UNIT_Z);
    const expected = { occluded: true, hitDistance: 123456.0 };
    const depthPass = {
      testRay: function () {
        return expected;
      },
      destroy: function () {},
    };
    const result = rayVs3DTiles(ray, scene, 2000000.0, { depthPass });
    expect(result).toBe(expected);
    expect(result.occluded).toBe(true);
    expect(result.hitDistance).toBe(123456.0);
  });

  it("does not destroy a provided depthPass", function () {
    const scene = { context: {}, globe: { show: true } };
    const ray = new Ray(origin, Cartesian3.UNIT_Z);
    let destroyed = false;
    const depthPass = {
      testRay: function () {
        return { occluded: false, hitDistance: null };
      },
      destroy: function () {
        destroyed = true;
      },
    };
    rayVs3DTiles(ray, scene, 2000000.0, { depthPass });
    expect(destroyed).toBe(false);
  });

  it("throws on invalid ray", function () {
    let threw = false;
    try {
      rayVs3DTiles(undefined, {}, 1000.0);
    } catch (e) {
      threw = true;
    }
    expect(threw).toBe(true);
  });

  it("throws on invalid scene", function () {
    let threw = false;
    try {
      rayVs3DTiles(new Ray(origin, Cartesian3.UNIT_Z), undefined, 1000.0);
    } catch (e) {
      threw = true;
    }
    expect(threw).toBe(true);
  });
});
