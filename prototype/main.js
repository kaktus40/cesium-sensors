import {
  Cartesian3,
  Color,
  CzmlDataSource,
  HeadingPitchRange,
  Transforms,
  Viewer,
} from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import "./style.css";
import { createConicSensorPrimitive } from "../src/ConicSensor.js";

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
});

viewer.scene.globe.show = false;
viewer.scene.backgroundColor = Color.fromCssColorString("#101923");

const source = await CzmlDataSource.load("/Specs/fixtures/benchmark-500.czml");
await viewer.dataSources.add(source);
viewer.clock.shouldAnimate = true;
viewer.clock.multiplier = 1;

const sensorOrigin = Cartesian3.fromDegrees(-75.0, 40.0, 1200000.0);
const sensorMatrix = Transforms.eastNorthUpToFixedFrame(sensorOrigin);
const prototypeSensor = createConicSensorPrimitive({
  modelMatrix: sensorMatrix,
  maximumRadius: 900000.0,
  outerHalfAngle: 0.32,
  color: Color.CYAN.withAlpha(0.45),
});
viewer.scene.primitives.add(prototypeSensor);
viewer.camera.lookAt(
  sensorOrigin,
  new HeadingPitchRange(0.0, 0.1, 1800000.0),
);

window.openSensorPrototype = { viewer, source, prototypeSensor };
document.querySelector("#status").textContent = `Loaded ${source.entities.values.length} benchmark entities`;
