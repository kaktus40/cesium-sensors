import {
  Cartesian3,
  Color,
  HeadingPitchRange,
  Transforms,
  Viewer,
} from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import "./style.css";
import { ConicSensor } from "../src/ConicSensor.js";

window.CESIUM_BASE_URL = "/node_modules/cesium/Build/Cesium/";

const viewer = new Viewer("cesiumContainer", {
  animation: false,
  baseLayerPicker: false,
  geocoder: false,
  homeButton: false,
  infoBox: false,
  sceneModePicker: false,
  selectionIndicator: false,
  timeline: false,
  navigationHelpButton: false,
  baseLayer: false,
  requestRenderMode: false,
  skyBox: false,
  skyAtmosphere: false,
  fog: false,
});

viewer.scene.globe.show = false;
viewer.scene.backgroundColor = Color.fromCssColorString("#0a0a12");

// Capteur unique, orienté verticalement (radiale).
const sensorOrigin = Cartesian3.fromDegrees(-75.0, 40.0, 1200000.0);
const sensorMatrix = Transforms.eastNorthUpToFixedFrame(sensorOrigin);

const sensor = new ConicSensor({
  modelMatrix: sensorMatrix,
  maximumRadius: 900000.0,
  outerHalfAngle: 0.32,
  color: Color.CYAN.withAlpha(0.45),
  id: "sensor-minimal",
});
viewer.scene.primitives.add(sensor.primitive);

viewer.camera.lookAt(
  sensorOrigin,
  new HeadingPitchRange(0.0, 0.0, 1600000.0),
);

document.querySelector("#status").textContent =
  "Scène minimale — 1 capteur, caméra fixe, pas de fond atmosphérique";

document.querySelector("#btn-occlusion-on").addEventListener("click", () => {
  sensor.primitive.appearance.uniforms.u_ellipsoidOcclusion = true;
  viewer.scene.requestRender();
  document.querySelector("#status").textContent = "Occlusion ellipsoïde : activée";
});

document.querySelector("#btn-occlusion-off").addEventListener("click", () => {
  sensor.primitive.appearance.uniforms.u_ellipsoidOcclusion = false;
  viewer.scene.requestRender();
  document.querySelector("#status").textContent = "Occlusion ellipsoïde : désactivée";
});

window.openSensorMinimal = { viewer, sensor };
