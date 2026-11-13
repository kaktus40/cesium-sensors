# Schéma CZML `openSensor_sensors`

## Objet canonique

```json
{
  "id": "satellite-001",
  "position": {},
  "orientation": {},
  "openSensor_sensors": [
    {
      "id": "radar-front",
      "type": "conic",
      "innerHalfAngle": 0.1,
      "outerHalfAngle": 0.5,
      "minimumRadius": 1000.0,
      "maximumRadius": 1000000.0,
      "occlusionMode": "SCENE",
      "occlusionQuality": "AUTO",
      "occlusionPriority": 10,
      "show": true
    }
  ]
}
```

## Champs communs

### Statiques

- `id` : chaîne obligatoire et unique dans l’Entity ;
- `type` : `conic`, `rectangular` ou `customPattern` ;
- `occlusionMode` : `NONE`, `ELLIPSOID` ou `SCENE` ;
- `occlusionQuality` : `LOW`, `BALANCED`, `HIGH` ou `AUTO` ;
- `occlusionPriority` : nombre entier ;
- `localPosition` ;
- `localOrientation` ;
- motif et paramètres structurels.

### Dynamiques

- `minimumRadius` ;
- `maximumRadius` ;
- `show` ;
- `color` et `opacity` ;
- matériau ;
- `showOccludedVolume` ;
- `showIntersection` ;
- `intersectionColor` ;
- `intersectionWidth`.

La pose utilise les champs standard `position` et `orientation` de l’Entity.

## Conique

```json
{
  "id": "radar-front",
  "type": "conic",
  "innerHalfAngle": 0.0,
  "outerHalfAngle": 0.5,
  "minimumClockAngle": 0.0,
  "maximumClockAngle": 6.283185307179586
}
```

## Rectangulaire

```json
{
  "id": "camera-nadir",
  "type": "rectangular",
  "xHalfAngle": 0.2,
  "yHalfAngle": 0.1
}
```

## Motif personnalisé

```json
{
  "id": "wide-pattern",
  "type": "customPattern",
  "patterns": [
    [
      { "clock": 0.0, "cone": 0.3 },
      { "clock": 1.57, "cone": 0.3 },
      { "clock": 3.14, "cone": 0.3 }
    ]
  ]
}
```

Les directions sont en radians. Les tableaux doivent contenir au moins trois sommets, sans doublons ni arêtes consécutives de 180 degrés ou davantage.

## Matériau d’atténuation

```json
{
  "material": {
    "openSensorEnergyFalloff": {
      "color": { "rgba": [255, 255, 255, 128] },
      "referenceDistance": 10.0,
      "nearOpacity": 1.0,
      "farOpacity": 0.0
    }
  }
}
```

La première implémentation est un modèle visuel borné lié à `1 / distance²`, pas une simulation électromagnétique.

## Compatibilité et erreurs

Les propriétés `agi_*` historiques ne sont pas prises en charge. Une propriété invalide doit générer une erreur structurée pour le senseur concerné sans interrompre le reste du paquet.
