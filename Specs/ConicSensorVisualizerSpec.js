import { Cartesian3, Color, Ellipsoid, JulianDate, Quaternion, Property } from "cesium";
import { ConicSensorGraphics } from "../src/dataSources/ConicSensorGraphics.js";
import { ConicSensorVisualizer } from "../src/dataSources/ConicSensorVisualizer.js";
import { SensorSystem } from "../src/core/SensorSystem.js";

// --- Minimal mocks for Cesium scene/primitives/entity collection ---

function makeProperty(value) {
  return {
    getValue: function () {
      return value;
    },
    getValueOrDefault: function (_time, def) {
      return value !== undefined ? value : def;
    },
    getValueOrUndefined: function (_time, result) {
      return value !== undefined ? value : undefined;
    },
  };
}

function makeEntity(id, options = {}) {
  const graphics = new ConicSensorGraphics({
    maximumRadius: options.maximumRadius,
    outerHalfAngle: options.outerHalfAngle,
    color: options.color,
    occlusionMode: options.occlusionMode,
    show: options.show,
    id: options.id || id,
  });
  return {
    id: id,
    conicSensor: graphics,
    position: options.position !== undefined ? makeProperty(options.position) : undefined,
    orientation: options.orientation !== undefined ? makeProperty(options.orientation) : undefined,
    isShowing: options.show !== false,
    isAvailable: function () {
      return true;
    },
  };
}

function makeScene() {
  const primitives = {
    _list: [],
    add: function (primitive) {
      this._list.push(primitive);
    },
    remove: function (primitive) {
      const idx = this._list.indexOf(primitive);
      if (idx !== -1) {
        this._list.splice(idx, 1);
      }
    },
    get length() {
      return this._list.length;
    },
  };
  return {
    primitives: primitives,
    clock: { currentTime: undefined },
    globe: { ellipsoid: Ellipsoid.WGS84 },
  };
}

function makeEntityCollection(entities = []) {
  const listeners = [];
  return {
    values: entities,
    collectionChanged: {
      addEventListener: function (callback, thisArg) {
        listeners.push({ callback, thisArg });
      },
      fire: function (added, removed, changed) {
        for (let i = 0; i < listeners.length; i++) {
          listeners[i].callback.call(
            listeners[i].thisArg,
            { values: entities },
            added,
            removed,
            changed,
          );
        }
      },
    },
  };
}

// Mock ConicSensor that does not require WebGL primitive creation.
function makeMockSensor(options = {}) {
  return {
    modelMatrix: options.modelMatrix,
    maximumRadius: options.maximumRadius,
    outerHalfAngle: options.outerHalfAngle,
    color: options.color,
    occlusionMode: options.occlusionMode,
    show: options.show !== false,
    id: options.id,
    _primitive: { show: true, destroy: function () {} },
    addTo: function () {},
    destroy: function () {},
    setModelMatrix: function (m) {
      this.modelMatrix = m;
      this._primitive = { show: this.show, destroy: function () {} };
    },
    update: function (opts) {
      if (opts.maximumRadius !== undefined) this.maximumRadius = opts.maximumRadius;
      if (opts.outerHalfAngle !== undefined) this.outerHalfAngle = opts.outerHalfAngle;
      if (opts.color !== undefined) this.color = opts.color;
      if (opts.occlusionMode !== undefined) this.occlusionMode = opts.occlusionMode;
      if (opts.show !== undefined) this.show = opts.show;
    },
    get primitive() {
      return this._primitive;
    },
  };
}

describe("ConicSensorVisualizer", function () {
  it("creates a SensorSystem on construction", function () {
    const scene = makeScene();
    const collection = makeEntityCollection([]);
    const visualizer = new ConicSensorVisualizer(scene, collection);
    expect(visualizer === undefined).toBe(false);
    expect(visualizer._sensorSystem instanceof SensorSystem).toBe(true);
    visualizer.destroy();
  });

  it("skips hidden entities", function () {
    const scene = makeScene();
    const collection = makeEntityCollection([]);
    const visualizer = new ConicSensorVisualizer(scene, collection, function (o) {
      return makeMockSensor(o);
    });

    const entity = makeEntity("e5", {
      position: Cartesian3.fromDegrees(-75.0, 40.0, 1200000.0),
      orientation: Quaternion.IDENTITY,
      show: false,
    });
    collection.collectionChanged.fire([entity], [], []);
    visualizer.update(JulianDate.now());

    expect(scene.primitives.length).toBe(0);
    expect(visualizer._sensorSystem.getSensorCount()).toBe(0);
    visualizer.destroy();
  });

  it("destroy releases resources", function () {
    const scene = makeScene();
    const collection = makeEntityCollection([]);
    const visualizer = new ConicSensorVisualizer(scene, collection, function (o) {
      return makeMockSensor(o);
    });

    const entity = makeEntity("e6", {
      position: Cartesian3.fromDegrees(-75.0, 40.0, 1200000.0),
      orientation: Quaternion.IDENTITY,
    });
    collection.collectionChanged.fire([entity], [], []);
    visualizer.update(JulianDate.now());
    expect(scene.primitives.length).toBe(1);

    visualizer.destroy();
    expect(scene.primitives.length).toBe(0);
    expect(visualizer._sensorSystem.destroyed).toBe(true);
  });

  it("exposes SensorSystem for visibility queries", function () {
    const scene = makeScene();
    const collection = makeEntityCollection([]);
    const visualizer = new ConicSensorVisualizer(scene, collection);

    expect(visualizer._sensorSystem instanceof SensorSystem).toBe(true);
    visualizer.destroy();
  });
});
