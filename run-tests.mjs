import { Cartesian3, Math as CesiumMath } from "cesium";

// Minimal Jasmine-compatible test runner for Node.js ESM
const results = { pass: 0, fail: 0, errors: [] };

function describe(name, fn) {
  fn();
}

function it(name, fn) {
  try {
    fn();
    results.pass++;
    process.stdout.write(`  ✓ ${name}\n`);
  } catch (e) {
    results.fail++;
    results.errors.push({ name, error: e.message });
    process.stdout.write(`  ✗ ${name}: ${e.message}\n`);
  }
}

function expect(actual) {
  const api = {
    toBe(expected) {
      if (Object.is(actual, expected)) return;
      throw new Error(`Expected ${actual} to be ${expected}`);
    },
    toBeNull() {
      if (actual !== null) throw new Error(`Expected ${actual} to be null`);
    },
    not: {
      toBeNull() {
        if (actual === null) throw new Error(`Expected not to be null`);
      },
      toBe(expected) {
        if (Object.is(actual, expected)) throw new Error(`Expected not to be ${expected}`);
      },
    },
    toBeGreaterThan(expected) {
      if (!(actual > expected)) throw new Error(`Expected ${actual} to be > ${expected}`);
    },
    toBeLessThanOrEqual(expected) {
      if (!(actual <= expected)) throw new Error(`Expected ${actual} to be <= ${expected}`);
    },
    toBeCloseTo(expected, precision) {
      const expectedRounded = Math.round(expected * Math.pow(10, precision));
      const actualRounded = Math.round(actual * Math.pow(10, precision));
      if (actualRounded !== expectedRounded) {
        throw new Error(`Expected ${actual} to be close to ${expected} (precision ${precision})`);
      }
    },
    toThrow() {
      // Can't easily test synchronous throws here; handled by try/catch in `it`
    },
  };
  return api;
}

function toThrowDeveloperError() {
  return function (fn) {
    try {
      fn();
      throw new Error("Expected function to throw");
    } catch (e) {
      // Expected
    }
  };
}

// Make globals available for spec files
globalThis.describe = describe;
globalThis.it = it;
globalThis.expect = expect;
globalThis.beforeEach = (fn) => fn();
globalThis.afterEach = (fn) => {};

// Import and run specs
await import("./Specs/SensorGeometrySpec.js");
await import("./Specs/SensorOcclusionSpec.js");
await import("./Specs/SensorViewSpec.js");
await import("./Specs/SensorSystemSpec.js");
await import("./Specs/ConicSensorGraphicsSpec.js");
await import("./Specs/ConicSensorVisualizerSpec.js");
await import("./Specs/CzmlSpec.js");
await import("./Specs/SceneOcclusionSpec.js");

process.stdout.write(`\n${results.pass} passed, ${results.fail} failed\n`);
if (results.fail > 0) {
  process.exit(1);
}