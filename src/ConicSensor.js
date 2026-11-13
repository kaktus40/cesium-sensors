import {
  Cartesian3,
  Color,
  ColorGeometryInstanceAttribute,
  CylinderGeometry,
  GeometryInstance,
  Math as CesiumMath,
  Matrix3,
  Matrix4,
  Appearance,
  Primitive,
  RenderState,
} from "cesium";
import { intersectCone } from "./core/SensorGeometry.js";
import { ellipsoidOcclusion, coneAxisFromModelMatrix } from "./core/SensorOcclusion.js";

const OcclusionMode = {
  NONE: "NONE",
  ELLIPSOID: "ELLIPSOID",
  SCENE: "SCENE",
};

/**
 * Creates a Cesium primitive approximating a conic sensor volume.
 * The cone points along local positive Z and supports ellipsoid occlusion.
 *
 * @param {object} options Constructor options.
 * @param {number} options.maximumRadius Maximum cone length in meters.
 * @param {number} options.outerHalfAngle Cone half-angle in radians.
 * @param {Matrix4} [options.modelMatrix] Local-to-world transform.
 * @param {Color} [options.color] Cone color, including alpha.
 * @returns {Primitive} Cesium primitive to add to `scene.primitives`.
 */
export function createConicSensorPrimitive(options) {
  return new ConicSensor(options).primitive;
}

/**
 * A conic sensor volume with visibility-query support.
 *
 * Wraps a Cesium `Primitive` and exposes the properties needed by
 * `SensorSystem.getSensorsSeeing`. The cone points along local positive Z.
 */
export class ConicSensor {
  /**
   * @param {object} options Constructor options.
   * @param {number} options.maximumRadius Maximum cone length in meters.
   * @param {number} options.outerHalfAngle Cone half-angle in radians.
   * @param {Matrix4} [options.modelMatrix] Local-to-world transform.
   * @param {Color} [options.color] Cone color, including alpha.
   * @param {string} [options.occlusionMode] One of "NONE", "ELLIPSOID", "SCENE".
   * @param {boolean} [options.show] Whether the sensor is visible.
   */
  constructor(options) {
    if (
      !Number.isFinite(options?.maximumRadius) ||
      options.maximumRadius <= 0.0 ||
      !Number.isFinite(options?.outerHalfAngle) ||
      options.outerHalfAngle <= 0.0 ||
      options.outerHalfAngle >= CesiumMath.PI_OVER_TWO
    ) {
      throw new Error("maximumRadius must be positive and outerHalfAngle must be in (0, π/2).");
    }

    this.maximumRadius = options.maximumRadius;
    this.outerHalfAngle = options.outerHalfAngle;
    this.modelMatrix = options.modelMatrix || Matrix4.IDENTITY;
    this.occlusionMode = options.occlusionMode || OcclusionMode.ELLIPSOID;
    this.show = options.show !== false;
    this.color = options.color || Color.WHITE.withAlpha(0.5);
    this.opacity = this.color.alpha;
    this.id = options.id;
    this._primitive = null;
    this._sensorSystem = null;

    this._buildPrimitive();
  }

  _buildPrimitive() {
    const { maximumRadius, outerHalfAngle, modelMatrix, color } = this;
    const bottomRadius = maximumRadius * Math.tan(outerHalfAngle);
    const coneToLocal = Matrix4.fromRotationTranslation(
      Matrix3.fromRotationX(CesiumMath.PI_OVER_TWO),
      new Cartesian3(0.0, 0.0, maximumRadius * 0.5),
    );

    const vertexShaderSource = `
      in vec3 position3DHigh;
      in vec3 position3DLow;
      in vec3 normal;
      in vec4 color;
      in float batchId;
      out vec3 v_positionEC;
      out vec4 v_color;
      void main() {
        vec4 position = czm_computePosition();
        v_positionEC = (czm_modelViewRelativeToEye * position).xyz;
        v_color = color;
        gl_Position = czm_modelViewProjection * position;
      }
    `;
    const fragmentShaderSource = `
      in vec3 v_positionEC;
      in vec4 v_color;
      uniform vec3 u_sensorOriginWC;
      uniform bool u_ellipsoidOcclusion;
      void main() {
        vec3 pointWC = (czm_inverseView * vec4(v_positionEC, 1.0)).xyz;
        vec3 inverseRadii = czm_ellipsoidInverseRadii;
        vec3 originScaled = inverseRadii * u_sensorOriginWC;
        vec3 pointScaled = inverseRadii * pointWC;
        vec3 ray = pointScaled - originScaled;
        float a = dot(ray, ray);
        float b = 2.0 * dot(originScaled, ray);
        float c = dot(originScaled, originScaled) - 1.0;
        float discriminant = b * b - 4.0 * a * c;
        if (u_ellipsoidOcclusion && discriminant >= 0.0 && a > 0.0) {
          float t = (-b - sqrt(discriminant)) / (2.0 * a);
          if (t > 0.00001 && t < 0.99999) discard;
        }
        if (u_ellipsoidOcclusion && dot(pointScaled, pointScaled) < 1.0) discard;
        out_FragColor = v_color;
      }
    `;

    const appearance = new Appearance({
      vertexShaderSource,
      fragmentShaderSource,
      renderState: RenderState.fromCache({
        depthTest: { enabled: true },
        depthMask: false,
        blending: {
          enabled: color.alpha < 1.0,
          color: [0.0, 0.0, 0.0, 0.0],
          equationRgb: 32774,
          equationAlpha: 32774,
          functionSourceRgb: 770,
          functionSourceAlpha: 770,
          functionDestinationRgb: 771,
          functionDestinationAlpha: 771,
        },
      }),
      translucent: color.alpha < 1.0,
      closed: false,
    });
    appearance.uniforms = {
      u_sensorOriginWC: Matrix4.getTranslation(modelMatrix, new Cartesian3()),
      u_ellipsoidOcclusion: this.occlusionMode !== OcclusionMode.NONE,
    };

    this._primitive = new Primitive({
      geometryInstances: new GeometryInstance({
        geometry: new CylinderGeometry({
          length: maximumRadius,
          topRadius: 0.0,
          bottomRadius,
          vertexPartitions: 64,
          facePartitions: 1,
        }),
        modelMatrix: Matrix4.multiply(modelMatrix, coneToLocal, new Matrix4()),
        attributes: {
          color: ColorGeometryInstanceAttribute.fromColor(color),
        },
      }),
      appearance,
      asynchronous: false,
    });
  }

  /**
   * The underlying Cesium Primitive.
   * @type {Primitive}
   */
  get primitive() {
    return this._primitive;
  }

  /**
   * Register this sensor with a SensorSystem.
   * @param {import("./core/SensorSystem.js").SensorSystem} sensorSystem
   */
  addTo(sensorSystem) {
    if (this._sensorSystem) {
      this._sensorSystem.removeSensor(this);
    }
    sensorSystem.addSensor(this);
    this._sensorSystem = sensorSystem;
  }

  /**
   * Unregister this sensor from its SensorSystem.
   */
  removeFromSystem() {
    if (this._sensorSystem) {
      this._sensorSystem.removeSensor(this);
      this._sensorSystem = null;
    }
  }

  /**
   * Destroy the sensor and release its primitive.
   */
  destroy() {
    this.removeFromSystem();
    if (this._primitive) {
      this._primitive.destroy();
      this._primitive = null;
    }
  }

  /**
   * Get the ellipsoid inverse radii for this sensor's scene, if available.
   * @returns {Cartesian3|null}
   */
  getInverseRadii() {
    if (this._sensorSystem && this._sensorSystem.scene) {
      const globe = this._sensorSystem.scene.globe;
      if (globe && globe.ellipsoid) {
        return globe.ellipsoid.inverseRadii;
      }
    }
    return null;
  }
}

ConicSensor.OcclusionMode = OcclusionMode;