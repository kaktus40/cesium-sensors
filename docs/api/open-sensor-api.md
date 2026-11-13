# API publique `open-sensor`

## Statut

Spécification de cadrage pour `0.1.0`. Les signatures peuvent évoluer pendant le prototype.

## Installation

```bash
npm install cesium open-sensor
```

```js
import * as Cesium from "cesium";
import * as OpenSensor from "open-sensor";
```

## Installation dans un Viewer

```js
const sensorSystem = OpenSensor.install(viewer);
```

L’installation doit être idempotente. Une gestion explicite est également disponible :

```js
const sensorSystem = new OpenSensor.SensorSystem({
  scene: viewer.scene
});
```

## Classes publiques

```text
OpenSensor.ConicSensor
OpenSensor.RectangularSensor
OpenSensor.CustomPatternSensor
OpenSensor.ConicSensorGraphics
OpenSensor.RectangularSensorGraphics
OpenSensor.CustomPatternSensorGraphics
OpenSensor.SensorSystem
OpenSensor.OcclusionMode
OpenSensor.OcclusionQuality
```

## Types

### `SensorView`

Résultat d'une requête de visibilité pour un senseur donné :

```ts
{
  sensor: ConicSensor | RectangularSensor | CustomPatternSensor;
  distance: number;   // mètres, le long du rayon jusqu'à la surface du volume
  inVolume: boolean;  // la cible est-elle à l'intérieur du volume du senseur ?
  occluded: boolean;  // la ligne de visée est-elle occultée ?
}
```

## Propriétés communes

| Propriété | Statut | Description |
|---|---|---|
| `modelMatrix` | dynamique primitive | pose monde du senseur |
| `minimumRadius` | dynamique | portée interne, mètres |
| `maximumRadius` | dynamique | portée externe, mètres |
| `show` | dynamique | affichage du senseur |
| `occlusionMode` | immutable | `NONE`, `ELLIPSOID`, `SCENE` |
| `occlusionQuality` | fixe | `LOW`, `BALANCED`, `HIGH`, `AUTO` |
| `occlusionPriority` | fixe | priorité dans le budget GPU |
| `showOccludedVolume` | dynamique | affiche la partie occultée |
| `color` | dynamique | couleur de la partie visible |
| `opacity` | dynamique | opacité de la partie visible |
| `showIntersection` | dynamique | affiche la ligne d’intersection |
| `intersectionColor` | dynamique | couleur de l’intersection |
| `intersectionWidth` | dynamique | largeur de l’intersection |
| `localPosition` | fixe | décalage dans l’Entity porteuse |
| `localOrientation` | fixe | orientation locale |
| `id` | fixe | identifiant métier du senseur |

## Valeurs par défaut

```js
minimumRadius: 0.0
maximumRadius: Number.POSITIVE_INFINITY
occlusionMode: OpenSensor.OcclusionMode.SCENE
occlusionQuality: OpenSensor.OcclusionQuality.AUTO
show: true
showOccludedVolume: false
color: Cesium.Color.WHITE
opacity: 0.5
showIntersection: true
intersectionColor: Cesium.Color.WHITE
intersectionWidth: 5.0
```

La partie occultée utilise par défaut une couleur rouge avec une opacité de `0.15` lorsqu’elle est affichée.

## Pose Entity

Les Entities utilisent les propriétés standard Cesium :

```js
entity.position = positionProperty;
entity.orientation = orientationProperty;
```

Une orientation `eastNorthUp` est utilisée si l’orientation est absente. La transformation locale du senseur est ensuite composée avec la pose de l’Entity.

## `SensorSystem`

Le système centralise les ressources partagées :

```js
sensorSystem.occlusionQuality = OpenSensor.OcclusionQuality.AUTO;
sensorSystem.errorEvent.addEventListener((error) => {});
```

Le système ordonne les mises à jour selon la visibilité, la distance, la taille à l'écran, la priorité et la qualité du senseur.

### `getSensorsSeeing(target, options?)`

Identifie les senseurs du système qui voient une cible donnée, avec la distance le long du rayon jusqu'à la surface du volume de chaque senseur.

```js
const views = await sensorSystem.getSensorsSeeing(targetEntity);
```

| Paramètre | Type | Description |
|---|---|---|
| `target` | `Entity \| Primitive \| Cartesian3` | Objet doté d'une position (adapté par `EntityAdapter`). |
| `options.includeOccludedVolume` | `boolean` | Défaut `false`. Inclut les senseurs dont la ligne de visée est occultée. |
| `options.time` | `Cesium.JulianDate` | Défaut `scene.clock.currentTime`. Instant d'évaluation des propriétés temporelles. |
| `options.inverseRadii` | `Cesium.Cartesian3` | Rayons inverses de l'ellipsoïde de la scène. |

Retourne une `Promise<SensorView[]>` triée par distance croissante.

**Sémantique :** un senseur "voit" la cible si celle-ci est à l'intérieur de son volume (cône, pyramide ou motif) et que la ligne de visée origine→cible n'est pas occultée par l'ellipsoïde, le terrain ou les modèles selon le `occlusionMode` du senseur. La distance retournée est mesurée le long du rayon, jusqu'à l'intersection avec la surface du volume.

Exemple :

```js
const views = await sensorSystem.getSensorsSeeing(satelliteEntity, {
  includeOccludedVolume: false
});
views.forEach((v) => {
  console.log(v.sensor.id, "distance:", v.distance, "occluded:", v.occluded);
});
```

## Picking

Le picking retourne une identité structurée :

```js
{
  entityId: "satellite-001",
  sensorId: "radar-front",
  part: "visible" // ou "occluded", "intersection"
}
```

## Erreurs

Les erreurs de validation utilisent des codes stables :

```text
INVALID_PATTERN
INVALID_RADIUS
INVALID_OCCLUSION_CONFIGURATION
UNSUPPORTED_SCENE_MODE
GPU_RESOURCE_ERROR
TARGET_POSITION_UNAVAILABLE
```

En CZML, une erreur de senseur n’empêche pas le chargement des autres senseurs. Elle est publiée via `SensorSystem.errorEvent`.
