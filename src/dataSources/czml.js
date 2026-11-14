import {
  Color,
  defined,
  TimeInterval,
} from "cesium";
import { CzmlDataSource } from "cesium";
import { DataSourceDisplay } from "cesium";
import { ConicSensorGraphics } from "./ConicSensorGraphics.js";
import { ConicSensorVisualizer } from "./ConicSensorVisualizer.js";

const iso8601Scratch = {
  iso8601: undefined,
};

/**
 * Process an `agi_conicSensor` packet from a CZML data source and apply its
 * properties to the entity's `conicSensor` graphics object.
 *
 * @param {Entity} entity The entity to update.
 * @param {object} packet The CZML packet.
 * @param {EntityCollection} entityCollection The entity collection.
 * @param {string} sourceUri The source URI of the CZML data.
 * @private
 */
function processConicSensor(entity, packet, entityCollection, sourceUri) {
  const conicSensorData = packet.agi_conicSensor;
  if (!defined(conicSensorData)) {
    return;
  }

  let interval;
  const intervalString = conicSensorData.interval;
  if (defined(intervalString)) {
    iso8601Scratch.iso8601 = intervalString;
    interval = TimeInterval.fromIso8601(iso8601Scratch);
  }

  let conicSensor = entity.conicSensor;
  if (!defined(conicSensor)) {
    entity.addProperty("conicSensor");
    conicSensor = entity.conicSensor = new ConicSensorGraphics();
  }

  // Show
  CzmlDataSource.processPacketData(
    Boolean,
    conicSensor,
    "show",
    conicSensorData.show,
    interval,
    sourceUri,
    entityCollection,
  );

  // Outer half-angle (radians)
  CzmlDataSource.processPacketData(
    Number,
    conicSensor,
    "outerHalfAngle",
    conicSensorData.outerHalfAngle,
    interval,
    sourceUri,
    entityCollection,
  );

  // Maximum radius
  CzmlDataSource.processPacketData(
    Number,
    conicSensor,
    "maximumRadius",
    conicSensorData.maximumRadius,
    interval,
    sourceUri,
    entityCollection,
  );

  // Color (from lateralSurfaceMaterial or direct color property)
  if (defined(conicSensorData.color)) {
    CzmlDataSource.processPacketData(
      Color,
      conicSensor,
      "color",
      conicSensorData.color,
      interval,
      sourceUri,
      entityCollection,
    );
  }

  // Occlusion mode
  CzmlDataSource.processPacketData(
    String,
    conicSensor,
    "occlusionMode",
    conicSensorData.occlusionMode,
    interval,
    sourceUri,
    entityCollection,
  );

  // Id
  CzmlDataSource.processPacketData(
    String,
    conicSensor,
    "id",
    conicSensorData.id,
    interval,
    sourceUri,
    entityCollection,
  );
}

/**
 * Initialize CZML integration for conic sensors.  This must be called before
 * loading CZML data that contains `agi_conicSensor` packets.
 *
 * This function:
 *  1. Pushes `processConicSensor` onto `CzmlDataSource.updaters` so that
 *     `agi_conicSensor` packets are processed when a CZML data source loads.
 *  2. Wraps `DataSourceDisplay.defaultVisualizersCallback` so that a
 *     `ConicSensorVisualizer` is added to every data source display.
 *
 * @function
 * @returns {void}
 */
let initialized = false;

/**
 * Reset module state for testing purposes.  Clears the `initialized` flag so
 * that a subsequent call to `initialize()` will re-register the updater and
 * visualizer callback.
 *
 * @private
 */
export function reset() {
  initialized = false;
}
function initialize() {
  if (initialized) {
    return;
  }

  CzmlDataSource.updaters.push(processConicSensor);

  const originalDefaultVisualizersCallback =
    DataSourceDisplay.defaultVisualizersCallback;
  DataSourceDisplay.defaultVisualizersCallback = function (
    scene,
    entityCluster,
    dataSource,
  ) {
    const entities = dataSource.entities;
    const array = originalDefaultVisualizersCallback(
      scene,
      entityCluster,
      dataSource,
    );
    return array.concat([
      new ConicSensorVisualizer(scene, entities),
    ]);
  };

  initialized = true;
}

export { initialize, processConicSensor };
