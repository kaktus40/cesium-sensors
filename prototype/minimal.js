import {
  Cartesian3,
  Color,
  CesiumTerrainProvider,
  OpenStreetMapImageryProvider,
  Transforms,
  Viewer,
} from "cesium";
import "./style.css";

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

const statusEl = document.getElementById("status");

window.addEventListener("error", (event) => {
  statusEl.textContent = `Erreur JS: ${String(event.message)}`;
  console.error("Prototype error:", event.message);
});
window.addEventListener("unhandledrejection", (event) => {
  statusEl.textContent = `Erreur: ${String(event.reason)}`;
  console.error("Prototype unhandled rejection:", event.reason);
});

async function init() {
  try {
    // --- Imagerie : OpenStreetMap ---
    const osm = new OpenStreetMapImageryProvider({
      url: "https://tile.openstreetmap.org/",
      maximumLevel: 19,
      credit: "OpenStreetMap contributors",
    });
    viewer.imageryLayers.addImageryProvider(osm);

    // --- Terrain ---
    const terrainProvider = new CesiumTerrainProvider({
      url: "https://assets.agi.com/stk-terrain/v1/tilesets/world/tiles",
      requestVertexNormals: true,
      minimumLevel: 1,
      maximumLevel: 14,
    });
    viewer.terrainProvider = terrainProvider;

    viewer.scene.globe.show = true;
    viewer.scene.backgroundColor = Color.fromCssColorString("#101923");

    // Caméra au niveau du sol (Paris, 5 km d'altitude)
    const origin = Cartesian3.fromDegrees(2.3522, 48.8566, 5000);
    viewer.camera.setView({
      destination: origin,
      orientation: {
        heading: 0.0,
        pitch: -0.8, // ~ -45 degrés en radians
        roll: 0.0,
      },
    });

    statusEl.textContent = "Imagerie OpenStreetMap + terrain activés";

    window.openSensorMinimal = {
      viewer,
      terrainProvider,
      imageryLayersCount: viewer.imageryLayers.length,
    };
  } catch (err) {
    statusEl.textContent = `Erreur: ${String(err)}`;
    console.error("Prototype init error:", err);
  }
}

init();
