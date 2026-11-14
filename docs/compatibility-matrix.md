# Matrice de compatibilité

## Statut au 14 novembre 2026

Validation P2 (occlusion de scène) complète. 37 tests unitaires et 7 tests e2e Playwright passent sous Chromium système avec SwiftShader.

| Élément | Version testée | Résultat |
|---|---|---|
| Node.js | `26.13.0` (`.nvmrc`) / `27.0.0-alpha` (shell) | `npm test` et `npm run test:e2e` passent |
| CesiumJS | `1.147.0` (peerDependency) | import ESM OK, rendu sensoriel OK |
| `@cesium/engine` | secondaire | création du contexte WebGL2 et compilation shader sans erreur |
| WebGL 2 | backend officiel | contexte créé, shaders compilés sans erreur dans les tests ciblés |
| WebGPU | futur | non dans `0.1.0` |
| Chromium | `/usr/bin/chromium`, SwiftShader | 7 tests e2e passent (chargement, rendu, occlusion, requête visibilité) |
| Brave | `/usr/bin/brave` disponible | non testé |
| Firefox | à tester | à confirmer |
| Safari | à tester | à confirmer |
| 3D | garantie initiale | oui |
| 2D/Columbus/morph | selon prototype | à confirmer |
| Terrain | cible | API identifiées (`globe.pick()`, `sampleHeightMostDetailed()`), non validées GPU |
| 3D Tiles opaques | cible | Aucune API publique de ray-tileset intersection; passe de profondeur dédiée requise |
| Transparence | non occluder | oui |
| Imagery | non occluder | oui |
| Tests unitaires | `node run-tests.mjs` | 37/37 passent |
| Tests e2e | `npm run test:e2e` | 7/7 passent |
| Lint | `npm run lint` | 0 erreur (eslint.config.js flat) |
| Benchmark `getSensorsSeeing` | 1/100/400/500 senseurs | 0.023/0.132/0.225/0.212 ms (avg sur 10 itérations), coût quasi linéaire, < 1 ms pour 500 |

Chaque release devra mettre à jour ce document et préciser la version exacte de CesiumJS testée.
