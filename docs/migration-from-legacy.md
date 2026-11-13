# Migration depuis `cesium-sensors`

## Statut

La nouvelle version `open-sensor` rompt volontairement l’API historique.

## Correspondances principales

| Ancien | Nouveau |
|---|---|
| `CesiumSensors.ConicSensorGraphics` | `OpenSensor.ConicSensorGraphics` |
| `CesiumSensors.RectangularSensorGraphics` | `OpenSensor.RectangularSensorGraphics` |
| `CesiumSensors.CustomPatternSensorGraphics` | `OpenSensor.CustomPatternSensorGraphics` |
| `CustomSensorVolume` | `OpenSensor.ConicSensor` ou classe spécialisée correspondante |
| `radius` | `maximumRadius` |
| `showThroughEllipsoid` | `occlusionMode: NONE` ou option explicitement documentée |
| `agi_*` | `openSensor_sensors` |
| AMD/RequireJS | ES modules |
| injection globale | `OpenSensor.install(viewer)` ou `SensorSystem` explicite |
| `Cesium.Spherical` | objets `{ clock, cone }` |
| séparateurs `null` | tableaux `patterns` explicites |

## Stratégie

Il n’y aura pas de couche de compatibilité automatique dans `0.1.0`. Une conversion des anciens CZML pourra être fournie comme outil séparé si le besoin est confirmé.

## À vérifier par l’application

- scénarios `agi_*` ;
- accès direct aux classes historiques ;
- hypothèses de projection 2D ;
- valeurs de rayon ;
- motifs avec `null` ;
- dépendances à des propriétés privées Cesium.
