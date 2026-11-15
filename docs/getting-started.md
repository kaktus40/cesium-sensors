# Guide de démarrage `open-sensor`

Guide pratique pour utiliser `open-sensor` (v1.0.0) : installation, premier senseur, requête de visibilité et intégration Entity/CZML.

## 1. Installation

```bash
npm install cesium open-sensor
```

## 2. Premier senseur (primitive directe)

Créez un `Viewer` Cesium, un `SensorSystem`, puis ajoutez un `ConicSensor` :

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>open-sensor — premier senseur</title>
    <link href="node_modules/cesium/Build/Cesium/Widgets/widgets.css" rel="stylesheet" />
    <style>
      #cesiumContainer { width: 100vw; height: 100vh; margin: 0; }
      #toolbar { position: absolute; top: 12px; left: 12px; z-index: 10;
        font: 14px sans-serif; color: white; background: rgba(0,0,0,0.7);
        padding: 8px 12px; border-radius: 4px; }
      #results { margin-top: 8px; white-space: pre-wrap; }
    </style>
  </head>
  <body>
    <div id="cesiumContainer"></div>
    <div id="toolbar">
      <div id="status">Chargement…</div>
      <div id="results"></div>
    </div>
    <script type="module">
      window.CESIUM_BASE_URL = "node_modules/cesium/Build/Cesium/";

      import { Cartesian3, Color, Transforms, Viewer } from "cesium";
      import {
        ConicSensor,
        SensorSystem,
      } from "open-sensor";

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
        skyBox: false,
        skyAtmosphere: false,
        fog: false,
      });

      const statusEl = document.getElementById("status");
      const resultsEl = document.getElementById("results");

      const sensorSystem = new SensorSystem({ scene: viewer.scene });

      // Capteur orienté vers le haut (radiale), à 1200 km d'altitude.
      const origin = Cartesian3.fromDegrees(-75.0, 40.0, 1200000.0);
      const modelMatrix = Transforms.eastNorthUpToFixedFrame(origin);

      const sensor = new ConicSensor({
        modelMatrix,
        maximumRadius: 900000.0,
        outerHalfAngle: 0.32,
        color: Color.CYAN.withAlpha(0.45),
        occlusionMode: ConicSensor.OcclusionMode.NONE,
        id: "sensor-principal",
      });
      viewer.scene.primitives.add(sensor.primitive);
      sensorSystem.addSensor(sensor);

      viewer.camera.lookAt(
        origin,
        new Cesium.HeadingPitchRange(0.0, 0.0, 1600000.0),
      );

      statusEl.textContent = "Senseur prêt. Ouvrez la console pour la requête.";

      // Requête de visibilité : cible située 100 km au-dessus du capteur.
      const target = Cartesian3.fromDegrees(-75.0, 40.0, 1300000.0);
      sensorSystem.getSensorsSeeing(target, { includeOccludedVolume: false }).then((views) => {
        resultsEl.textContent = views.length + " senseur(s) voit(ent) la cible.\n" +
          views.map((v) =>
            `• ${v.sensor.id} — distance: ${Math.round(v.distance)} m, ` +
            `dansVolume: ${v.inVolume}, occulté: ${v.occluded}`
          ).join("\n");
      });
    </script>
  </body>
</html>
```

Ouvrez ce fichier avec un serveur local (ex: `npx vite`) et consultez la console / la zone `#results`.

## 3. Imagerie et terrain (ellipsoïde + surface)

Par défaut, le globe Cesium utilise un ellipsoïde nu. Pour ajouter une imagerie et du relief :

```js
import {
  Cartesian3,
  Color,
  CesiumTerrainProvider,
  GeographicTilingScheme,
  TileMapServiceImageryProvider,
  buildModuleUrl,
  Viewer,
} from "cesium";

const viewer = new Viewer("cesiumContainer", {
  baseLayer: false,           // on fournit notre propre imagerie
  baseLayerPicker: false,
  geocoder: false,
  // ...
});

// --- Imagerie : Natural Earth II (intégrée à Cesium, pas de clé API) ---
const naturalEarth = new TileMapServiceImageryProvider({
  url: buildModuleUrl("Assets/Textures/NaturalEarthII"),
  tilingScheme: new GeographicTilingScheme(),
  maximumLevel: 5,
});
viewer.imageryLayers.addImageryProvider(naturalEarth);

// --- Terrain : fournisseur de tuiles de terrain ---
// Remplacez l'URL par votre propre serveur de tuiles (Quantized Mesh ou
// Height Map : Cesium ion, GeoServer, etc.).
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
```

### Politique de chargement des tuiles de terrain

`minimumLevel` évite que Cesium ne tente de charger les tuiles du niveau 0
(qui couvrent la planète entière et sont lourdes). Vous pouvez aussi restreindre
la zone d'intérêt avec `rectangle` sur le provider pour ne charger que les tuiles
les plus proches de votre zone de travail.

```js
const terrainProvider = new CesiumTerrainProvider({
  url: "https://assets.agi.com/stk-terrain/v1/tilesets/world/tiles",
  minimumLevel: 1,
  maximumLevel: 14,
  // Optionnel : restreindre à un rectangle géographique
  // rectangle: Cesium.Rectangle.fromDegrees(-10, 40, 10, 50),
});
```

### Configuration Vite pour servir les assets Cesium

Les assets statiques de Cesium (Natural Earth II, shaders, etc.) sont dans
`node_modules/cesium/Build/Cesium/Assets/`. Pour que Vite les serve, créez un
`vite.config.js` à la racine :

```js
import { defineConfig } from "vite";
import path from "path";
import fs from "fs";

export default defineConfig({
  server: {
    port: 5173,
    configureServer: (server) => {
      server.middlewares.use("/Assets/", (req, res, next) => {
        const urlPath = req.url.replace(/^\/Assets\//, "");
        const filePath = path.join(
          "node_modules/cesium/Build/Cesium/Assets",
          urlPath
        );
        if (fs.existsSync(filePath)) {
          res.sendFile(filePath);
        } else {
          res.status(404).end();
        }
      });
    },
  },
});
```

Sans cette configuration, `buildModuleUrl("Assets/Textures/NaturalEarthII")`
génère des URLs que Vite ne sait pas servir (404 sur les tuiles).

```js
const views = await sensorSystem.getSensorsSeeing(target, {
  includeOccludedVolume: false,   // inclut les senseurs occultés
  time: viewer.clock.currentTime, // instant d'évaluation (défaut: scene.clock)
  inverseRadii: Ellipsoid.WGS84.oneOverRadii,
});
```

Chaque `SensorView` contient :
- `sensor` — référence au `ConicSensor`
- `distance` — mètres, le long du rayon jusqu'à la surface du volume
- `inVolume` — cible à l'intérieur du volume
- `occluded` — ligne de visée occultée

## 4. Intégration Entity / CZML

Utilisez `ConicSensorGraphics` + `ConicSensorVisualizer` pour lier des `Entity` Cesium à des senseurs :

```js
import {
  Cartesian3,
  HeadingPitchRange,
  Transforms,
  Viewer,
} from "cesium";
import {
  ConicSensorGraphics,
  ConicSensorVisualizer,
} from "open-sensor";

const viewer = new Viewer("cesiumContainer", { ... });

const sensorEntity = viewer.entities.add({
  id: "mon-senseur",
  position: Cartesian3.fromDegrees(-75.0, 40.0, 1200000.0),
  orientation: Transforms.headingPitchRollQuaternion(
    Cartesian3.fromDegrees(-75.0, 40.0, 1200000.0),
    new Cesium.HeadingPitchRoll(0.0, -0.1, 0.0),
  ),
  conicSensor: new ConicSensorGraphics({
    maximumRadius: 900000.0,
    outerHalfAngle: 0.32,
    color: Color.CYAN.withAlpha(0.45),
    occlusionMode: ConicSensorGraphics.OcclusionMode.ELLIPSOID,
    id: "mon-senseur",
  }),
});

const visualizer = new ConicSensorVisualizer(viewer.scene, viewer.entities);
const sensorSystem = visualizer._sensorSystem;
visualizer.update(viewer.clock.currentTime);
```

Pour le CZML, appelez `initialize()` avant le chargement :

```js
import { initialize } from "open-sensor";

initialize(); // enregistre l'updater CZML et le visualizer
await viewer.dataSources.add(await CzmlDataSource.load("scene.czml"));
```

Le schéma CZML attendu : `packet.agi_conicSensor` avec les champs `outerHalfAngle`, `maximumRadius`, `color`, `occlusionMode`, `show`, `id`, `interval`.

## 5. Occlusion de scène (terrain + 3D Tiles)

Par défaut, `getSensorsSeeing` teste l'occlusion par l'ellipsoïde de référence (CPU). Pour activer le test de terrain :

```js
const views = await sensorSystem.getSensorsSeeing(target, {
  sceneOcclusion: true,
  scene: viewer.scene,
});
```

L'occlusion par modèles 3D Tiles opaques utilise une passe de profondeur dédiée (`DepthPass`, `rayVs3DTiles`) pour lire la profondeur des tuiles le long du rayon.

## Référence

- Référence API complète : `docs/api/open-sensor-api.md`
- Schéma CZML : `docs/api/czml-schema.md`
- Décisions d'architecture : `docs/decisions/`
- Matrice de compatibilité : `docs/compatibility-matrix.md`
