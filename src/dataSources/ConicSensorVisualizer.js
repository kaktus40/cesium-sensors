import {
  Cartesian3,
  Color,
  defined,
  DeveloperError,
  destroyObject,
  Matrix3,
  Matrix4,
  Property,
  Quaternion,
} from "cesium";
import { ConicSensor } from "../ConicSensor.js";
import { ConicSensorGraphics } from "./ConicSensorGraphics.js";
import { SensorSystem } from "../core/SensorSystem.js";

const scratchMatrix3 = new Matrix3();
const scratchPosition = new Cartesian3();
const scratchOrientation = new Quaternion();

/**
 * A {@link Visualizer} which maps {@link Entity#conicSensor} to a {@link ConicSensor}
 * primitive and registers it with a {@link SensorSystem}.
 *
 * @alias ConicSensorVisualizer
 * @constructor
 *
 * @param {Scene} scene The scene the primitives will be rendered in.
 * @param {EntityCollection} entityCollection The entityCollection to visualize.
 */
export function ConicSensorVisualizer(scene, entityCollection) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(scene)) {
    throw new DeveloperError("scene is required.");
  }
  if (!defined(entityCollection)) {
    throw new DeveloperError("entityCollection is required.");
  }
  //>>includeEnd('debug');

  entityCollection.collectionChanged.addEventListener(
    ConicSensorVisualizer.prototype._onCollectionChanged,
    this,
  );

  this._scene = scene;
  this._primitives = scene.primitives;
  this._entityCollection = entityCollection;
  this._sensorSystem = new SensorSystem({ scene });
  this._hash = {};
  this._entitiesToVisualize = new Map();

  this._onCollectionChanged(
    entityCollection,
    entityCollection.values,
    [],
    [],
  );
}

/**
 * Updates the primitives created by this visualizer to match their
 * Entity counterpart at the given time.
 *
 * @param {JulianDate} time The time to update to.
 * @returns {Boolean} This function always returns true.
 */
ConicSensorVisualizer.prototype.update = function (time) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(time)) {
    throw new DeveloperError("time is required.");
  }
  //>>includeEnd('debug');

  const entities = Array.from(this._entitiesToVisualize.values());
  const hash = this._hash;
  const primitives = this._primitives;

  for (let i = 0, len = entities.length; i < len; i++) {
    const entity = entities[i];
    const graphics = entity.conicSensor;

    let show =
      entity.isShowing &&
      entity.isAvailable(time) &&
      Property.getValueOrDefault(graphics.show, time, true);

    let position;
    let orientation;

    if (show) {
      position = Property.getValueOrUndefined(
        entity.position,
        time,
        scratchPosition,
      );
      orientation = Property.getValueOrUndefined(
        entity.orientation,
        time,
        scratchOrientation,
      );
      show = defined(position) && defined(orientation);
    }

    if (!show) {
      const data = hash[entity.id];
      if (defined(data) && defined(data.sensor)) {
        data.sensor.primitive.show = false;
      }
      continue;
    }

    const data = hash[entity.id];
    let sensor = defined(data) ? data.sensor : undefined;

    // Compute modelMatrix from position + orientation.
    const transform = Matrix4.fromRotationTranslation(
      Matrix3.fromQuaternion(orientation, scratchMatrix3),
      position,
      new Matrix4(),
    );

    if (!defined(sensor)) {
      sensor = new ConicSensor({
        modelMatrix: transform,
        maximumRadius: Property.getValueOrDefault(
          graphics.maximumRadius,
          time,
          900000.0,
        ),
        outerHalfAngle: Property.getValueOrDefault(
          graphics.outerHalfAngle,
          time,
          0.32,
        ),
        color: Property.getValueOrDefault(
          graphics.color,
          time,
          Color.WHITE.withAlpha(0.5),
        ),
        occlusionMode: Property.getValueOrDefault(
          graphics.occlusionMode,
          time,
          ConicSensorGraphics.OcclusionMode.ELLIPSOID,
        ),
        show: true,
        id: Property.getValueOrDefault(graphics.id, time, entity.id),
      });
      sensor.addTo(this._sensorSystem);
      primitives.add(sensor.primitive);

      hash[entity.id] = {
        sensor,
        graphics,
        position: Cartesian3.clone(position),
        orientation: Quaternion.clone(orientation),
      };
      continue;
    }

    // Update transform if changed.
    const prevPosition = data.position;
    const prevOrientation = data.orientation;
    if (
      !Cartesian3.equals(position, prevPosition) ||
      !Quaternion.equals(orientation, prevOrientation)
    ) {
      sensor.setModelMatrix(transform);
      Cartesian3.clone(position, prevPosition);
      Quaternion.clone(orientation, prevOrientation);
    }

    // Update dynamic properties.
    sensor.update({
      maximumRadius: Property.getValueOrDefault(
        graphics.maximumRadius,
        time,
        900000.0,
      ),
      outerHalfAngle: Property.getValueOrDefault(
        graphics.outerHalfAngle,
        time,
        0.32,
      ),
      color: Property.getValueOrDefault(
        graphics.color,
        time,
        Color.WHITE.withAlpha(0.5),
      ),
      occlusionMode: Property.getValueOrDefault(
        graphics.occlusionMode,
        time,
        ConicSensorGraphics.OcclusionMode.ELLIPSOID,
      ),
    });

    sensor.primitive.show = graphics.show !== false;
    sensor.show = graphics.show !== false;

    data.position = Cartesian3.clone(position, prevPosition);
    data.orientation = Quaternion.clone(orientation, prevOrientation);
  }

  return true;
};

/**
 * Returns true if this object was destroyed; otherwise, false.
 *
 * @returns {Boolean} True if this object was destroyed; otherwise, false.
 */
ConicSensorVisualizer.prototype.isDestroyed = function () {
  return false;
};

/**
 * Removes and destroys all primitives created by this instance.
 */
ConicSensorVisualizer.prototype.destroy = function () {
  const entities = Array.from(this._entitiesToVisualize.values());
  const hash = this._hash;
  const primitives = this._primitives;

  for (let i = entities.length - 1; i > -1; i--) {
    removeEntity(entities[i], hash, primitives, this._sensorSystem);
  }

  this._sensorSystem.destroy();
  return destroyObject(this);
};

/**
 * @private
 */
ConicSensorVisualizer.prototype._onCollectionChanged = function (
  entityCollection,
  added,
  removed,
  changed,
) {
  let i;
  let entity;
  const entities = this._entitiesToVisualize;
  const hash = this._hash;
  const primitives = this._primitives;
  const sensorSystem = this._sensorSystem;

  for (i = added.length - 1; i > -1; i--) {
    entity = added[i];
    if (
      defined(entity.conicSensor) &&
      defined(entity.position) &&
      defined(entity.orientation)
    ) {
      entities.set(entity.id, entity);
    }
  }

  for (i = changed.length - 1; i > -1; i--) {
    entity = changed[i];
    if (
      defined(entity.conicSensor) &&
      defined(entity.position) &&
      defined(entity.orientation)
    ) {
      entities.set(entity.id, entity);
    } else {
      removeEntity(entity, hash, primitives, sensorSystem);
      entities.delete(entity.id);
    }
  }

  for (i = removed.length - 1; i > -1; i--) {
    entity = removed[i];
    removeEntity(entity, hash, primitives, sensorSystem);
    entities.delete(entity.id);
  }
};

function removeEntity(entity, hash, primitives, _sensorSystem) {
  const data = hash[entity.id];
  if (defined(data) && defined(data.sensor)) {
    data.sensor.destroy();
    primitives.remove(data.sensor.primitive);
    delete hash[entity.id];
  }
}
