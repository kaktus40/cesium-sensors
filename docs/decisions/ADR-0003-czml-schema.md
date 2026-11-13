# ADR-0003 — Schéma CZML `openSensor_sensors`

## Statut

Accepté.

## Décision

Le format CZML canonique sera une collection de senseurs nommés :

```json
{
  "openSensor_sensors": [
    {
      "id": "radar-front",
      "type": "conic"
    }
  ]
}
```

Les types initiaux sont :

```text
conic
rectangular
customPattern
```

Les identifiants sont uniques dans leur Entity. L’identité interne globale est composée de `entity.id` et `sensor.id`.

## Propriétés statiques

- `id` ;
- `type` ;
- motif ;
- `occlusionMode` ;
- `occlusionQuality` ;
- `occlusionPriority` ;
- transformation locale ;
- options structurelles propres à la forme.

## Propriétés dynamiques

- position et orientation via l’Entity ;
- `minimumRadius` ;
- `maximumRadius` ;
- `show` ;
- couleur et opacité ;
- matériau ;
- `showOccludedVolume` ;
- paramètres d’intersection.

## Motifs

Les directions sont des objets sérialisables :

```json
{
  "clock": 0.0,
  "cone": 0.3
}
```

Les angles sont en radians. Les motifs discontinus utilisent plusieurs tableaux `patterns`; les séparateurs `null` sont interdits.

## Compatibilité

Les champs historiques `agi_*` ne sont pas supportés. Les raccourcis `openSensor_conicSensor`, `openSensor_rectangularSensor` et `openSensor_customPatternSensor` pourront être ajoutés ultérieurement, mais ne devront pas concurrencer la collection canonique.
