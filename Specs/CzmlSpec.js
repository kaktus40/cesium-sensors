import { CzmlDataSource, DataSourceDisplay, TimeInterval } from "cesium";
import { processConicSensor, initialize, reset } from "../src/dataSources/czml.js";
import { ConicSensorGraphics } from "../src/dataSources/ConicSensorGraphics.js";

describe("czml processConicSensor", function () {
  const originalProcessPacketData = CzmlDataSource.processPacketData;

  function makeEntity(id) {
    return {
      id: id,
      conicSensor: undefined,
      addProperty: function (name) {
        this[name] = undefined;
      },
    };
  }

  function resetPacketData() {
    CzmlDataSource.processPacketData = originalProcessPacketData;
  }

  it("does nothing when packet has no agi_conicSensor", function () {
    let calls = [];
    CzmlDataSource.processPacketData = function () {
      calls.push(arguments);
      return undefined;
    };
    const entity = makeEntity("e1");
    processConicSensor(entity, {}, [], "test.czml");
    expect(calls.length).toBe(0);
    resetPacketData();
  });

  it("creates ConicSensorGraphics when entity has none", function () {
    let calls = [];
    CzmlDataSource.processPacketData = function () {
      calls.push(arguments);
      return undefined;
    };
    const entity = makeEntity("e1");
    processConicSensor(
      entity,
      { agi_conicSensor: { outerHalfAngle: 0.5 } },
      [],
      "test.czml",
    );
    expect(entity.conicSensor === undefined).toBe(false);
    expect(entity.conicSensor instanceof ConicSensorGraphics).toBe(true);
    resetPacketData();
  });

  it("reuses existing conicSensor", function () {
    let calls = [];
    CzmlDataSource.processPacketData = function () {
      calls.push(arguments);
      return undefined;
    };
    const existing = new ConicSensorGraphics();
    const entity = makeEntity("e2");
    entity.conicSensor = existing;
    processConicSensor(
      entity,
      { agi_conicSensor: { outerHalfAngle: 0.5 } },
      [],
      "test.czml",
    );
    expect(entity.conicSensor).toBe(existing);
    resetPacketData();
  });

  it("processes show property", function () {
    let calls = [];
    CzmlDataSource.processPacketData = function (
      type,
      target,
      propertyName,
      value,
    ) {
      calls.push({ type, target, propertyName, value });
      return undefined;
    };
    const entity = makeEntity("e3");
    processConicSensor(
      entity,
      { agi_conicSensor: { show: false } },
      [],
      "test.czml",
    );
    const showCall = calls.find(function (c) {
      return c.propertyName === "show";
    });
    expect(showCall === undefined).toBe(false);
    expect(showCall.value).toBe(false);
    resetPacketData();
  });

  it("processes outerHalfAngle property", function () {
    let calls = [];
    CzmlDataSource.processPacketData = function (
      type,
      target,
      propertyName,
      value,
    ) {
      calls.push({ type, target, propertyName, value });
      return undefined;
    };
    const entity = makeEntity("e4");
    processConicSensor(
      entity,
      { agi_conicSensor: { outerHalfAngle: 0.75 } },
      [],
      "test.czml",
    );
    const call = calls.find(function (c) {
      return c.propertyName === "outerHalfAngle";
    });
    expect(call === undefined).toBe(false);
    expect(call.value).toBe(0.75);
    resetPacketData();
  });

  it("processes maximumRadius property", function () {
    let calls = [];
    CzmlDataSource.processPacketData = function (
      type,
      target,
      propertyName,
      value,
    ) {
      calls.push({ type, target, propertyName, value });
      return undefined;
    };
    const entity = makeEntity("e5");
    processConicSensor(
      entity,
      { agi_conicSensor: { maximumRadius: 500000.0 } },
      [],
      "test.czml",
    );
    const call = calls.find(function (c) {
      return c.propertyName === "maximumRadius";
    });
    expect(call === undefined).toBe(false);
    expect(call.value).toBe(500000.0);
    resetPacketData();
  });

  it("processes occlusionMode property", function () {
    let calls = [];
    CzmlDataSource.processPacketData = function (
      type,
      target,
      propertyName,
      value,
    ) {
      calls.push({ type, target, propertyName, value });
      return undefined;
    };
    const entity = makeEntity("e6");
    processConicSensor(
      entity,
      { agi_conicSensor: { occlusionMode: "NONE" } },
      [],
      "test.czml",
    );
    const call = calls.find(function (c) {
      return c.propertyName === "occlusionMode";
    });
    expect(call === undefined).toBe(false);
    expect(call.value).toBe("NONE");
    resetPacketData();
  });

  it("processes color property", function () {
    let calls = [];
    CzmlDataSource.processPacketData = function (
      type,
      target,
      propertyName,
      value,
    ) {
      calls.push({ type, target, propertyName, value });
      return undefined;
    };
    const entity = makeEntity("e7");
    processConicSensor(
      entity,
      { agi_conicSensor: { color: { rgba: [255, 0, 0, 255] } } },
      [],
      "test.czml",
    );
    const call = calls.find(function (c) {
      return c.propertyName === "color";
    });
    expect(call === undefined).toBe(false);
    resetPacketData();
  });

  it("processes interval", function () {
    let calls = [];
    CzmlDataSource.processPacketData = function (
      type,
      target,
      propertyName,
      value,
      interval,
    ) {
      calls.push({ type, target, propertyName, value, interval });
      return undefined;
    };
    const entity = makeEntity("e8");
    processConicSensor(
      entity,
      {
        agi_conicSensor: {
          outerHalfAngle: 0.5,
          interval: "2020-01-01/2020-01-02",
        },
      },
      [],
      "test.czml",
    );
    const call = calls.find(function (c) {
      return c.propertyName === "outerHalfAngle";
    });
    expect(call === undefined).toBe(false);
    expect(call.interval instanceof TimeInterval).toBe(true);
    resetPacketData();
  });

  it("passes sourceUri and entityCollection", function () {
    let calls = [];
    CzmlDataSource.processPacketData = function (
      type,
      target,
      propertyName,
      value,
      interval,
      sourceUri,
      entityCollection,
    ) {
      calls.push({ type, target, propertyName, value, interval, sourceUri, entityCollection });
      return undefined;
    };
    const entity = makeEntity("e9");
    const entityCollection = { values: [entity] };
    processConicSensor(
      entity,
      { agi_conicSensor: { outerHalfAngle: 0.5 } },
      entityCollection,
      "https://example.com/test.czml",
    );
    const call = calls[0];
    expect(call.sourceUri).toBe("https://example.com/test.czml");
    expect(call.entityCollection).toBe(entityCollection);
    resetPacketData();
  });
});

describe("czml initialize", function () {
  it("adds processConicSensor to CzmlDataSource.updaters", function () {
    reset();
    initialize();
    var found = false;
    for (var i = 0; i < CzmlDataSource.updaters.length; i++) {
      if (CzmlDataSource.updaters[i] === processConicSensor) {
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
    reset();
  });

  it("wraps DataSourceDisplay.defaultVisualizersCallback", function () {
    reset();
    initialize();
    expect(typeof DataSourceDisplay.defaultVisualizersCallback).toBe("function");
    reset();
  });

  it("is idempotent", function () {
    reset();
    initialize();
    var lengthAfterFirst = CzmlDataSource.updaters.length;
    initialize();
    expect(CzmlDataSource.updaters.length).toBe(lengthAfterFirst);
    reset();
  });
});
