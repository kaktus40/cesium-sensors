# Matrice de compatibilité

## Statut au 14 novembre 2026

Validation P3 (intégration Entity/CZML + scène minimale) complète. 71 tests unitaires et 8 tests e2e Playwright passent sous Chromium système avec SwiftShader. 0 vulnérabilités npm.

| Élément | Version testée | Résultat |
|---|---|---|
| Node.js | `26.13.0` (`.nvmrc`) / `27.0.0-alpha` (shell) | `npm test` et `npm run test:e2e` passent |
| CesiumJS | `1.147.0` (peerDependency) | import ESM OK, rendu sensoriel OK |
| `@cesium/engine` | secondaire | création du contexte WebGL2 et compilation shader sans erreur |
| WebGL 2 | backend officiel | contexte créé, shaders compilés sans erreur dans les tests ciblés |
| WebGPU | futur | non dans `0.1.0` |
| Chromium | `/usr/bin/chromium`, SwiftShader | 8 tests e2e passent (chargement, rendu, occlusion, requête visibilité, comparaison pixel) |
| Brave | `/usr/bin/brave` disponible | non testé |
| Firefox | à tester | à confirmer |
| Safari | à tester | à confirmer |
| 3D | garantie initiale | oui |
| 2D/Columbus/morph | selon prototype | à confirmer |
| Terrain | cible | `rayVsTerrain()` via `Globe.pick()`, non validé GPU sous scène complexe |
| 3D Tiles opaques | cible | Aucune API publique de ray-tileset intersection; `rayVs3DTiles()` stub (passe de profondeur à implémenter) |
| Transparence | non occluder | oui |
| Imagery | non occluder | oui |
| Tests unitaires | `node run-tests.mjs` | 71/71 passent |
| Tests e2e | `npm run test:e2e` | 8/8 passent |
| Lint | `npm run lint` | 0 erreur (eslint.config.js flat) |
| Build | `npm run build` (esbuild) | `dist/open-sensor.js` généré |
| Documentation | `npx jsdoc` | génère sans erreur (jsdoc 4.0.5) |
| Vulnérabilités | `npm audit` | 0 vulnérabilités |
| Benchmark `getSensorsSeeing` | 1/100/400/500 senseurs | 0.023/0.132/0.225/0.212 ms (avg sur 10 itérations), coût quasi linéaire, < 1 ms pour 500 |

Modules créés :
- `src/core/SensorSystem.js` — enregistrement des senseurs, `getSensorsSeeing()`
- `src/core/SensorGeometry.js` — intersection rayon-cône
- `src/core/SensorOcclusion.js` — occlusion ellipsoïde (CPU, validée vs shader fragment)
- `src/core/SceneOcclusion.js` — `rayVsTerrain()`, `rayVs3DTiles()` (stub), `createRay()`
- `src/core/EntityAdapter.js` — résolution de position d'Entity/Primitive/Cartesian3
- `src/queries/SensorView.js` — `computeSensorView()`, `computeSensorViews()` avec support `sceneOcclusion`
- `src/ConicSensor.js` — classe `ConicSensor` avec `setModelMatrix()`, `update()`
- `src/dataSources/ConicSensorGraphics.js` — Graphics déclarative (Property support)
- `src/dataSources/ConicSensorVisualizer.js` — Visualizer Entity-driven avec `SensorSystem`
- `src/dataSources/czml.js` — `processConicSensor()`, `initialize()`, `reset()` (intégration CZML)
- `src/index.js` — point d'export de l'API publique

Chaque release devra mettre à jour ce document et préciser la version exacte de CesiumJS testée.
