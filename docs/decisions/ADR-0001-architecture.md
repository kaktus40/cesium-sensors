# ADR-0001 — Architecture publique et intégration CesiumJS

## Statut

Accepté — cadrage initial.

## Contexte

L’ancien plugin utilise AMD/RequireJS, des API internes de CesiumJS et modifie globalement `CzmlDataSource` et `DataSourceDisplay`. La nouvelle version doit être une implémentation indépendante, moderne et maintenable.

## Décision

`open-sensor` sera organisé en ES modules JavaScript avec JSDoc et exposera des classes publiques spécialisées :

```text
OpenSensor.ConicSensor
OpenSensor.RectangularSensor
OpenSensor.CustomPatternSensor
```

Les primitives directes utiliseront `modelMatrix`. L’intégration Entity/CZML utilisera `position`, `orientation` et une transformation locale statique.

Un `SensorSystem` par `Scene` mutualisera les ressources GPU, l’ordonnancement, la qualité d’occlusion et les visualizers. L’installation automatique sera fournie par `OpenSensor.install(viewer)` ; la création explicite restera possible.

La base commune de rendu et de géométrie restera interne jusqu’à démonstration d’une utilité publique.

Le module `src/queries/` contient la logique de lecture (requêtes de visibilité), séparée de la logique de rendu (primitives) et de la gestion de scène (`SensorSystem`).

## Conséquences

### Positives

- API lisible par forme de senseur ;
- compatibilité avec les conventions Entity/CZML ;
- partage des ressources entre 400 et 500 senseurs ;
- possibilité d’ajouter un backend graphique ultérieur ;
- réduction de l’exposition aux API privées CesiumJS.

### Négatives

- plusieurs classes publiques à documenter ;
- intégration plus complexe qu’un primitive isolé ;
- nécessité de gérer explicitement le cycle de vie du `SensorSystem`.

## Contraintes

- la configuration d’occlusion est immutable après création ;
- le motif géométrique est statique ;
- les propriétés dynamiques restent la pose, les portées, l’apparence et l’activation ;
- le système doit supporter `requestRenderMode`.

## Rejeté

Une unique classe publique `SensorVolume({ shape: ... })` est rejetée pour la première version : elle créerait trop d’options conditionnelles et une API moins claire.
