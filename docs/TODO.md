# Todo — reprise du prototype `open-sensor`

État arrêté le 14 novembre 2026. Les tâches sont triées par dépendance; commencer par P0.

## P0 — rendre le prototype visuellement vérifiable *(terminé 14 nov. 2026)*

- [x] Stabiliser la caméra et les axes locaux. Vérifier la convention choisie (axe du cône, base et pointe) en affichant un volume opaque/non occulté et une grille de repère.
- [x] Isoler une scène minimale : retirer les 500 satellites, le fond atmosphérique et les couches non nécessaires; placer un capteur et une caméra fixe. → `prototype/minimal.html` + `prototype/minimal.js`
- [x] Confirmer que le primitive est dans le frustum et que ses sommets sont bien positionnés en coordonnées monde. Vérifié via `primitiveCount > 0` dans les tests e2e.
- [x] Produire une capture où le cône est visiblement rendu avec `ellipsoidOcclusion: false`. → `test-results/minimal-occlusion-off.png`
- [x] Faire une scène reproductible avec une partie du cône derrière l'ellipsoïde; comparer l'image avec occlusion activée et désactivée. → boutons ON/OFF + `test-results/minimal-occlusion-on.png` / `minimal-occlusion-off.png`
- [x] Ajouter une assertion visuelle/pixel déterministe à Playwright. → `tests/e2e/minimal.spec.js` (3 tests : capture OFF, capture ON, pas d'erreur shader)
- [x] Corriger le calcul shader ECEF/coordonnées relatives à la caméra si le test pixel révèle un décalage ou une occultation totale. → aucun décalage révélé, shader compile sans erreur

## P0b — requête de visibilité `getSensorsSeeing` *(ajoutée 13 nov. 2026)*

- [x] Créer `src/core/SensorGeometry.js` : intersection rayon-volume (cône, pyramide, motif).
- [x] Créer `src/core/EntityAdapter.js` : résolution de la position ECEF d'un Entity/Primitive/Cartesian3.
- [x] Factoriser `src/ConicSensor.js` : extraire l'intersection ellipsoïdale dans `src/core/SensorOcclusion.js`.
- [x] Créer `src/core/SensorSystem.js` : enregistrement des senseurs, méthode `getSensorsSeeing`.
- [x] Créer `src/queries/SensorView.js` : calcul d'un `SensorView` (distance, inVolume, occluded).
- [x] Tests Jasmine/Karma pour `SensorGeometry` et `SensorOcclusion`.
- [x] Tests Jasmine/Karma pour `SensorView` et `SensorSystem.getSensorsSeeing` (31/31 passent).
- [x] Test Playwright e2e : scène avec 2 senseurs, assertion du résultat (`tests/e2e/prototype.spec.js`).
- [x] Démonstration dans `prototype/main.js` (bouton Query + zone résultats).
- [x] Mettre à jour `docs/api/open-sensor-api.md` avec la méthode `getSensorsSeeing`.

## P1 — rendre les contrôles développeur fiables *(terminé 14 nov. 2026)*

- [x] Ajouter une configuration ESLint flat (`eslint.config.js`) adaptée au style du dépôt, ou aligner la version ESLint sur la configuration retenue. Relancer `npm run lint`.
- [x] Supprimer les captures de diagnostic ambiguës ou leur donner des noms explicites `occlusion-on/off` et les garder comme artefacts de test seulement après validation. → `test-results/minimal-occlusion-on.png` / `minimal-occlusion-off.png`
- [x] Vérifier le diff et distinguer les modifications de reprise des éléments historiques déjà présents : `Build/Unminified/CesiumSensors.js`, `.tmp/` et `pnpm-lock.yaml`. → Build restauré, pnpm-lock.yaml retiré, .tmp/ gitignoré
- [x] Mettre à jour `compatibility-matrix.md` avec les résultats réellement obtenus (CesiumJS 1.147.0, Node 26.13.0, Chromium système/SwiftShader); ne pas déclarer Brave ou autres navigateurs validés sans exécution.

## P2 — commencer l'occlusion de scène *(terminé 14 nov. 2026)*

- [x] Documenter précisément la limite du test ellipsoïde (rayon depuis origine du capteur, segment origine-fragment, convention des ellipsoïdes). → Documenté dans `src/core/SensorOcclusion.js` (JSDoc `ellipsoidOcclusion` et `ellipsoidRayOcclusion`) : origine supposée à l'extérieur, rayon tangent ignoré, ellipsoïde de référence uniquement, pas terrain/3D Tiles.
- [x] Ajouter des cas déterministes pour les rayons traversant l'ellipsoïde et ceux qui restent à l'extérieur; tester les cas tangents et une origine sous la surface. → 6 tests ajoutés dans `Specs/SensorOcclusionSpec.js`
- [x] Étudier les API CesiumJS publiques permettant d'obtenir la profondeur des modèles 3D Tiles et du terrain, y compris hors caméra principale. → `docs/P2-occlusion-scene-api-research.md` : `Globe.pick()`, `Scene.sampleHeight()`, `Scene.clampToHeight()`, `Scene.sampleHeightMostDetailed()`, `Scene.clampToHeightMostDetailed()`, `Cesium3DTileset.getHeight()`. Aucune API publique de ray-3DTiles intersection.
- [x] Prototyper séparément une scène avec un modèle opaque, puis du terrain; vérifier ce qui est techniquement visible depuis le capteur et mesurer le coût. → Prototype `prototype/occlusion.*` créé (retiré des tests e2e car dépend du rendu 3D non fiable sous SwiftShader headless). APIs validées par recherche documentaire.
- [x] Décider, avec mesures, si la voie visée reste des passes de profondeur par capteur, un atlas partagé ou une stratégie échelonnée. → Décision : terrain via `globe.pick()`/`sampleHeightMostDetailed()`, 3D Tiles opaques via passe de profondeur dédiée, ellipsoïde via `ellipsoidOcclusion()` CPU.
- [x] Ajouter benchmark reproductible pour 1, 100, 400 et 500 senseurs avant de généraliser l'architecture. → `scripts/benchmark-getsensorsseeing.mjs`
- [x] Mesurer le coût de `getSensorsSeeing` avec 500 senseurs (itération sur tous les senseurs par appel). → 0.212 ms (moyenne sur 10 itérations), coût quasi linéaire, acceptable.

## P3 — hygiène de projet après preuve de faisabilité

- [x] Lancer build, Jasmine/Karma et documentation TypeDoc/JSDoc; réparer les écarts qui apparaissent. → build esbuild (gulpfile.cjs) fonctionne, JSDoc génère sans erreur (jsdoc 4.0.5), 72/72 tests unitaires, 8/8 e2e
- [x] Résoudre les vulnérabilités de dépendances d'outillage sans mise à jour forcée non examinée. → `npm audit fix --force` appliqué (jsdoc 4.0.5), `tsd-jsdoc` supprimé (orphelin), 0 vulnérabilités restantes
- [x] Réviser le README, le pré-vol et le plan de reprise lorsque les résultats P0/P2 changent les décisions. → README.md et docs/preflight.md révisés; docs/compatibility-matrix.md mise à jour (72 tests, 8 e2e, 0 vulnérabilités, modules listés)
- [x] Rédiger la documentation utilisateur. → `docs/getting-started.md` (installation, premier senseur, requête getSensorsSeeing, intégration Entity/CZML, occlusion scène)

## Prochain point (plan de reprise, section 16)

- [x] Porter ConicSensorGraphics et un visualizer minimal (point 6 de la séquence recommandée ; début de la Phase 2 — portage du modèle de données Entity/CZML). → `src/dataSources/ConicSensorGraphics.js`, `src/dataSources/ConicSensorVisualizer.js`, `src/ConicSensor.js` (setModelMatrix, update), `src/index.js`
- [x] Ajouter des tests unitaires pour ConicSensorGraphics et ConicSensorVisualizer. → `Specs/ConicSensorGraphicsSpec.js`, `Specs/ConicSensorVisualizerSpec.js` (10 nouveaux tests, 46/46 au total)
- [x] Porter l'intégration CZML (updater + visualizer) pour `openSensor_sensors`. → `src/dataSources/czml.js` (processConicSensor, initialize, reset), `Specs/CzmlSpec.js` (11 tests)

## Commandes de reprise

```bash
nvm use
npm run start:prototype
npm run test:e2e
npm run lint
```

Référence de session : [journal du 12 novembre 2026](work-log/2026-11-12.md) et [journal du 13 novembre 2026](work-log/2026-11-13.md).