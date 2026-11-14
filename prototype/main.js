import {
  Cartesian3,
  Color,
  CzmlDataSource,
  Entity,
  HeadingPitchRange,
  HeadingPitchRoll,
  JulianDate,
  Transforms,
  Viewer,
} from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import "./style.css";
import { ConicSensorGraphics } from "../src/dataSources/ConicSensorGraphics.js";
import { ConicSensorVisualizer } from "../src/dataSources/ConicSensorVisualizer.js";

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

const statusEl = document.querySelector("#status");
statusEl.textContent = "Initializing prototype…";

window.addEventListener("error", (event) => {
  statusEl.textContent = `Error: ${String(event.message)}`;
  console.error("Prototype error:", event.message);
});
window.addEventListener("unhandledrejection", (event) => {
  statusEl.textContent = `Error: ${String(event.reason)}`;
  console.error("Prototype unhandled rejection:", event.reason);
});

async function init() {
  try {
    const source = await CzmlDataSource.load(
      "/Specs/fixtures/benchmark-500.czml",
    );
    await viewer.dataSources.add(source);
    viewer.clock.shouldAnimate = true;
    viewer.clock.multiplier = 1;

    const sensorOrigin = Cartesian3.fromDegrees(-75.0, 40.0, 1200000.0);

    const sensorEntity = viewer.entities.add({
      id: "sensor-principal",
      position: Cartesian3.fromDegrees(-75.0, 40.0, 1200000.0),
      orientation: Transforms.headingPitchRollQuaternion(
        Cartesian3.fromDegrees(-75.0, 40.0, 1200000.0),
        new HeadingPitchRoll(0.0, -0.1, 0.0),
      ),
      conicSensor: new ConicSensorGraphics({
        maximumRadius: 900000.0,
        outerHalfAngle: 0.32,
        color: Color.CYAN.withAlpha(0.45),
        occlusionMode: ConicSensorGraphics.OcclusionMode.ELLIPSOID,
        show: true,
        id: "sensor-principal",
      }),
    });

    const sensor2Origin = Cartesian3.fromDegrees(-75.05, 40.05, 1200000.0);
    const sensor2Entity = viewer.entities.add({
      id: "sensor-secondaire",
      position: sensor2Origin,
      orientation: Transforms.headingPitchRollQuaternion(
        sensor2Origin,
        new HeadingPitchRoll(0.0, -0.1, 0.0),
      ),
      conicSensor: new ConicSensorGraphics({
        maximumRadius: 900000.0,
        outerHalfAngle: 0.4,
        color: Color.MAGENTA.withAlpha(0.45),
        occlusionMode: ConicSensorGraphics.OcclusionMode.NONE,
        show: true,
        id: "sensor-secondaire",
      }),
    });

    const visualizer = new ConicSensorVisualizer(viewer.scene, viewer.entities);
    const sensorSystem = visualizer._sensorSystem;

    // Process entities already in the collection (our 2 sensor entities).
    visualizer.update(JulianDate.now());

    viewer.camera.lookAt(
      sensorOrigin,
      new HeadingPitchRange(0.0, 0.1, 1800000.0),
    );

    const targetEntity = viewer.entities.add({
      id: "query-target",
      position: Cartesian3.fromDegrees(
        -75.0,
        40.0,
        1200000.0 + 100000.0,
      ),
      point: { pixelSize: 6, color: Color.YELLOW },
      label: {
        text: "Cible de requête",
        font: "14px sans-serif",
        fillColor: Color.YELLOW,
      },
    });

    window.openSensorPrototype = {
      viewer,
      source,
      sensorEntity,
      sensor2Entity,
      visualizer,
      sensorSystem,
      targetEntity,
    };
    statusEl.textContent = `Loaded ${source.entities.values.length} benchmark entities`;

    document.querySelector("#btn-query").addEventListener("click", async () => {
      const results = await sensorSystem.getSensorsSeeing(targetEntity, {
        includeOccludedVolume: false,
      });
      const resultsEl = document.querySelector("#query-results");
      const lines = [
        `<div><strong>${results.length}</strong> senseur(s) voit(ent) la cible</div>`,
      ];
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
  } catch (err) {
    statusEl.textContent = `Error: ${String(err)}`;
    console.error("Prototype init error:", err);
  }
}

init();
