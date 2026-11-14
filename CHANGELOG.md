# Changelog

Toutes les modifications notables de `open-sensor` seront documentées ici.

## [Unreleased]

### Ajouté

- `src/core/SceneOcclusion.js` — `rayVsTerrain()`, `rayVs3DTiles()` (stub), `createRay()` ;
- `src/dataSources/ConicSensorGraphics.js` — Graphics déclarative avec support `Property` ;
- `src/dataSources/ConicSensorVisualizer.js` — Visualizer Entity-driven avec `SensorSystem` ;
- `src/dataSources/czml.js` — intégration CZML (`processConicSensor`, `initialize`, `reset`) ;
- `prototype/minimal.html` + `prototype/minimal.js` — scène minimale avec boutons occlusion ON/OFF ;
- 8 tests e2e Playwright dont 1 test de comparaison pixel occlusion ON/OFF.

### Modifié

- `src/ConicSensor.js` — `setModelMatrix()`, `update()` pour mise à jour dynamique ;
- `src/queries/SensorView.js` — options `sceneOcclusion` + `scene` dans `computeSensorView()`/`computeSensorViews()` ;
- `src/core/SensorSystem.js` — `getSensorsSeeing()` accepte `sceneOcclusion` + `scene` ;
- `prototype/main.js` — utilise `ConicSensorVisualizer` avec 2 `Entity` au lieu de `ConicSensor` manuels.

### Corrigé

- `src/core/SensorOcclusion.js` — bug `tmpCartesian` réutilisé (calcul de `b` corrompu) ;
- `src/dataSources/ConicSensorVisualizer.js` — `getPropertyValue()` gère valeurs brutes et `Property` ;
- `npm audit fix --force` : jsdoc 3.6.11 → 4.0.5 ; `tsd-jsdoc` supprimé (orphelin) ; 0 vulnérabilités.

### Supprimé

- `pnpm-lock.yaml` (non pertinent, projet utilise npm) ;

## [1.0.0] — 2026-11-14

Première release stable de la nouvelle implémentation `open-sensor`.

### Fonctionnalités

- `SensorSystem` avec requête de visibilité `getSensorsSeeing()` (distance, inVolume, occluded, tri par distance) ;
- `ConicSensor` avec intersection rayon-cône et occlusion ellipsoïde (CPU) ;
- `ConicSensorGraphics` + `ConicSensorVisualizer` pour intégration Entity/CZML ;
- Intégration CZML (`processConicSensor`, `initialize`) pour les packets `agi_conicSensor` ;
- Prototype GPU avec scène minimale, boutons occlusion ON/OFF, requête de visibilité.

### Tests

- 71 tests unitaires Jasmine (SensorGeometry, SensorOcclusion, SensorView, SensorSystem, ConicSensorGraphics, ConicSensorVisualizer, Czml, SceneOcclusion) ;
- 8 tests e2e Playwright (chargement, rendu, shader occlusion, requête visibilité, comparaison pixel).

### Performance

- `getSensorsSeeing` : < 1 ms pour 500 senseurs (coût quasi linéaire).

La version `1.0.0` n'est pas compatible avec l'API historique `cesium-sensors`.

