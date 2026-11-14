import {
  Cartesian3,
  Color,
  CzmlDataSource,
  Entity,
  HeadingPitchRange,
  Transforms,
  Viewer,
} from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import "./style.css";
import { ConicSensor } from "../src/ConicSensor.js";
import { SensorSystem } from "../src/core/SensorSystem.js";

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

const sensorSystem = new SensorSystem({ scene: viewer.scene });

// Capteur principal orienté vers le haut (radiale).
const prototypeSensor = new ConicSensor({
  modelMatrix: sensorMatrix,
  maximumRadius: 900000.0,
  outerHalfAngle: 0.32,
  color: Color.CYAN.withAlpha(0.45),
  id: "sensor-principal",
});
viewer.scene.primitives.add(prototypeSensor.primitive);
sensorSystem.addSensor(prototypeSensor);

// Deuxième capteur décalé, orienté vers l'origine du premier.
const sensor2Origin = Cartesian3.fromDegrees(-75.05, 40.05, 1200000.0);
const sensor2Matrix = Transforms.eastNorthUpToFixedFrame(sensor2Origin);
const prototypeSensor2 = new ConicSensor({
  modelMatrix: sensor2Matrix,
  maximumRadius: 900000.0,
  outerHalfAngle: 0.4,
  color: Color.MAGENTA.withAlpha(0.45),
  occlusionMode: ConicSensor.OcclusionMode.NONE,
  id: "sensor-secondaire",
});
viewer.scene.primitives.add(prototypeSensor2.primitive);
sensorSystem.addSensor(prototypeSensor2);

viewer.camera.lookAt(
  sensorOrigin,
  new HeadingPitchRange(0.0, 0.1, 1800000.0),
);

// Cible mobile placée dans le volume du premier capteur.
const targetEntity = viewer.entities.add({
  id: "query-target",
  position: Cartesian3.fromDegrees(-75.0, 40.0, 1200000.0 + 100000.0),
  point: { pixelSize: 6, color: Color.YELLOW },
  label: { text: "Cible de requête", font: "14px sans-serif", fillColor: Color.YELLOW },
});

window.openSensorPrototype = {
  viewer,
  source,
  prototypeSensor,
  prototypeSensor2,
  sensorSystem,
  targetEntity,
};
document.querySelector("#status").textContent = `Loaded ${source.entities.values.length} benchmark entities`;

document.querySelector("#btn-query").addEventListener("click", async () => {
  const results = await sensorSystem.getSensorsSeeing(targetEntity, {
    includeOccludedVolume: false,
  });
  const resultsEl = document.querySelector("#query-results");
  const lines = [`<div><strong>${results.length}</strong> senseur(s) voit(ent) la cible</div>`];
  for (let i = 0; i < results.length; i++) {
    const v = results[i];
    lines.push(
      `<div>• ${v.sensor.id} — distance: ${Math.round(v.distance)} m, dansVolume: ${v.inVolume}, occulté: ${v.occluded}</div>`,
    );
  }
  if (results.length === 0) {
    lines.push("<div>aucun</div>");
  }
  resultsEl.innerHTML = lines.join("");
});
