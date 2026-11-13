# Requête de visibilité `getSensorsSeeing`

## Statut

Spécification de cadrage pour `0.1.0`. Implémentée en P0b de la TODO.

## Objectif

Répondre à la question : *"quels senseurs du `SensorSystem` voient l'entité (ou le point) X ?"*, avec la distance le long du rayon jusqu'à la surface du volume.

## API

```ts
sensorSystem.getSensorsSeeing(target, options?): Promise<SensorView[]>
```

| Paramètre | Type | Description |
|---|---|---|
| `target` | `Entity \| Primitive \| Cartesian3` | Objet doté d'une position. Voir `EntityAdapter`. |
| `options.includeOccludedVolume` | `boolean` | Défaut `false`. Inclure les senseurs dont la ligne de visée est occultée. |
| `options.time` | `Cesium.JulianDate` | Défaut `clock.currentTime`. Instant d'évaluation des propriétés temporelles. |

## `SensorView`

```ts
{
  sensor: Sensor;          // référence au senseur concerné (ConicSensor, RectangularSensor, CustomPatternSensor)
  distance: number;        // mètres, le long du rayon jusqu'à la surface du volume
  inVolume: boolean;       // la cible est-elle à l'intérieur du volume du senseur ?
  occluded: boolean;       // la ligne de visée est-elle occultée ?
}
```

## Sémantique détaillée

Pour chaque senseur actif (`show: true`) du système :

1. **Résolution de la cible** (`EntityAdapter`) :
   - `Entity` → `entity.position.getValue(time)` ;
   - `Primitive` → translation de `modelMatrix` ;
   - `Cartesian3` → valeur directe.
   Si la position n'est pas disponible (propriété temporelle absente ou valeur nulle), le senseur est exclus du résultat avec un avertissement dans `SensorSystem.errorEvent`.

2. **Direction** : `direction = normalize(targetPosition - sensorOrigin)`.

3. **Intersection volume** (`SensorGeometry`) :
   - `intersectCone(origin, direction, maximumRadius, outerHalfAngle)` ;
   - `intersectRectangularPyramid(...)` ;
   - `intersectCustomPattern(...)`.
   Si l'intersection est `null`, la cible est hors du volume → `inVolume: false`, le senseur ne voit pas la cible.

4. **Occlusion** (`SensorOcclusion`) :
   - Mode `NONE` : jamais occulté.
   - Mode `ELLIPSOID` : intersection rayon-ellipsoïde.
   - Mode `SCENE` : ellipsoïde + terrain + modèles (selon la disponibilité).
   Si la ligne de visée est occultée avant d'atteindre la cible, `occluded: true`.

5. **Résultat** :
   - Si `inVolume: false` → le senseur ne voit pas la cible (exclu du résultat sauf si `includeOccludedVolume` est true et que la cible est dans la partie occultée — cas non applicable car la cible est hors volume).
   - Si `inVolume: true` et `occluded: false` → le senseur voit la cible.
   - Si `inVolume: true` et `occluded: true` → le senseur ne voit pas la cible, sauf si `includeOccludedVolume: true`.

6. **Distance** : distance le long du rayon jusqu'au point d'intersection avec la surface du volume.

## Cas d'usage typiques

```js
// Quels senseurs voient un satellite donné ?
const views = await sensorSystem.getSensorsSeeing(satelliteEntity);
views.forEach(v => console.log(v.sensor.id, v.distance));

// Inclure les senseurs dont la visée est masquée par l'ellipsoïde
const allViews = await sensorSystem.getSensorsSeeing(target, {
  includeOccludedVolume: true
});

// Avec un point brut
const views = await sensorSystem.getSensorsSeeing(Cartesian3.fromDegrees(-75, 40, 1200000));
```

## Limites

- L'occlusion terrain/modèles n'est pas encore implémentée (P2 de la TODO). Dans l'attente, le mode `SCENE` se comporte comme `ELLIPSOID`.
- La distance est calculée par intersection géométrique, pas par rasterisation GPU. Elle est exacte pour la géométrie du volume, mais l'occlusion ellipsoïdale l'est aussi (calcul analytique).
- Les senseurs dont le volume est très grand ou très éloigné sont évalués comme les autres. Aucune optimisation de culling n'est appliquée pour l'instant (P2 — voir `performance/queries.md`).
- Les objets translucides, l'atmosphère, l'imagerie et les autres senseurs ne sont pas des occluders (ADR-0002).

## Erreurs

Les erreurs de validation utilisent les codes existants (`INVALID_PATTERN`, `INVALID_RADIUS`, etc.). Une nouvelle erreur spécifique est ajoutée :

```text
TARGET_POSITION_UNAVAILABLE
```

 Elle est publiée via `SensorSystem.errorEvent` sans empêcher le traitement des autres senseurs.