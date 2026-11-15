import {
  Cartesian3,
  Color,
  CesiumTerrainProvider,
  GeographicTilingScheme,
  HeadingPitchRange,
  TileMapServiceImageryProvider,
  Transforms,
  Viewer,
  UrlTemplateImageryProvider,
  buildModuleUrl,
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
const resultsEl = document.getElementById("results");

// --- Imagerie : Natural Earth II (intégrée à Cesium, pas de clé API) ---
const naturalEarth = new TileMapServiceImageryProvider({
  url: buildModuleUrl("Assets/Textures/NaturalEarthII"),
  tilingScheme: new GeographicTilingScheme(),
  maximumLevel: 5,
});

viewer.imageryLayers.addImageryProvider(naturalEarth);

// --- Terrain : fournisseur de tuiles de terrain ---
// Remplacez l'URL ci-dessous par votre propre serveur de tuiles terrain
// (format Quantized Mesh ou Height Map, ex: Cesium ion, GeoServer, etc.).
const terrainProvider = new CesiumTerrainProvider({
  url: "https://assets.agi.com/stk-terrain/v1/tilesets/world/tiles",
  requestVertexNormals: true,
  // Politique de chargement : ignorer le niveau 0 (trop gros, peu détaillé)
  // et ne demander que les niveaux à partir de 1.
  minimumLevel: 1,
  maximumLevel: 14,
});

viewer.terrainProvider = terrainProvider;

viewer.scene.globe.show = true;
viewer.scene.backgroundColor = Color.fromCssColorString("#101923");

statusEl.textContent = "Imagerie Natural Earth + terrain activés";

window.openSensorMinimal = {
  viewer,
  terrainProvider,
  imageryLayersCount: viewer.imageryLayers.length,
};
