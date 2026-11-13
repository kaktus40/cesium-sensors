# Matrice de compatibilité

## Statut au 12 novembre 2026

Validation de démarrage uniquement. Le smoke test Playwright passe sous Chromium système avec SwiftShader; ce résultat ne constitue pas une garantie générale de compatibilité ou de performance.

| Élément | Cible initiale | Garantie |
|---|---|---|
| CesiumJS | `1.147.0` (prototype/e2e seulement) | démarrage testé; rendu sensoriel non validé |
| Package `cesium` | principal | oui |
| `@cesium/engine` | secondaire | à valider |
| WebGL 2 | backend officiel | création du contexte et compilation sans erreur dans le test ciblé; rendu visuel à valider |
| WebGPU | futur | non dans `0.1.0` |
| Brave | `/usr/bin/brave` disponible | non testé |
| Chromium | `/usr/bin/chromium`, SwiftShader | 3 tests Playwright passent; visuel du cône non validé |
| Firefox | à tester | à confirmer |
| Safari | à tester | à confirmer |
| 3D | garantie initiale | oui |
| 2D/Columbus/morph | selon prototype | à confirmer |
| Terrain | cible | à valider GPU |
| 3D Tiles opaques | cible | à valider GPU |
| Transparence | non occluder | oui |
| Imagery | non occluder | oui |

Chaque release devra mettre à jour ce document et préciser la version exacte de CesiumJS testée.
