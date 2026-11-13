# ADR-0005 — Requête de visibilité `getSensorsSeeing`

## Statut

Accepté — cadrage initial du 13 novembre 2026.

## Contexte

Le plugin rend des volumes de senseurs, mais n'offre aucun moyen de demander, à un instant donné, **quels senseurs voient une entité donnée**. Cette information est centrale pour de nombreux cas d'usage : déclenchement de capteurs, filtrage de données, affichage d'alertes, debug de scènes.

La question posée est : *"étant donnée une entité (ou un point), quels sont les senseurs du `SensorSystem` dont la ligne de visée vers cette entité est libre d'occlusion ?"*

## Décision

Exposer une méthode asynchrone sur `SensorSystem` :

```ts
sensorSystem.getSensorsSeeing(target, options?): Promise<SensorView[]>
```

`target` accepte tout objet doté d'une position (Entity Cesium, Primitive, ou `Cartesian3` brut). Un adaptateur interne (`EntityAdapter`) normalise l'entrée.

### `SensorView`

```ts
{
  sensor: Sensor;          // référence au senseur concerné
  distance: number;        // mètres, le long du rayon jusqu'à la surface du volume
  inVolume: boolean;       // la cible est-elle à l'intérieur du volume du senseur ?
  occluded: boolean;       // la ligne de visée est-elle occultée ?
}
```

### Sémantique retenue

Un senseur "voit" la cible si :
1. la cible est à l'intérieur de son volume (cône, pyramide ou motif) — sinon `inVolume: false` et le senseur ne voit pas la cible ;
2. la ligne de visée origine→cible n'est pas occultée par l'ellipsoïde, le terrain ou les modèles selon le `occlusionMode` du senseur.

Si la cible est dans le volume mais que la ligne de visée est occultée, `occluded: true`. Le senseur ne voit pas la cible, sauf si `options.includeOccludedVolume` vaut `true`.

### Options

| Option | Type | Défaut | Description |
|---|---|---|---|
| `includeOccludedVolume` | `boolean` | `false` | Inclure les senseurs dont la ligne de visée est occultée |
| `time` | `Cesium.JulianDate` | `clock.currentTime` | Instant d'évaluation des propriétés temporelles |

### Distance retournée

La distance est mesurée **le long du rayon**, de l'origine du senseur jusqu'au point d'intersection avec la surface de son volume. Elle n'est pas la distance euclidienne jusqu'à la cible.

## Conséquences

### Positives

- API de requête unique et lisible ;
- réutilisation des calculs géométriques déjà présents dans les shaders (factorisation vers `SensorGeometry`) ;
- pas de nouvelle passe GPU pour la géométrie (calcul CPU) ;
- utile pour le debug, les tests, les déclencheurs métier ;
- ouvre la voie à un `SensorSystem` de plus en plus central.

### Négatives

- Ajout d'une méthode publique sur `SensorSystem` à documenter ;
- coût d'itération sur tous les senseurs à chaque appel (à mesurer, voir `performance/queries.md`) ;
- dépendance à la disponibilité des données d'occlusion (terrain, modèles) — voir l'état `UNKNOWN` dans l'ADR-0002.

## Contraintes

- La méthode est **asynchrone** (`Promise`) car l'occlusion terrain/modèles future pourra nécessiter des traitements non bloquants.
- La configuration d'occlusion d'un senseur reste **immutable** ; `getSensorsSeeing` la lit sans la modifier.
- Les senseurs désactivés (`show: false`) sont exclus du résultat.
- Le motif géométrique d'un senseur est **statique** ; `getSensorsSeeing` l'évalue tel quel.

## Rejeté

- Une méthode synchrone unique : elle ne suffirait pas quand l'occlusion terrain/modèles deviendra disponible.
- Une méthode sur chaque senseur individuellement (`sensor.seeing(target)`) : le besoin principal est la requête globale depuis le gestionnaire.
- Le calcul d'occlusion par imagerie, atmosphère, translucides ou autres senseurs : ces éléments sont exclus de l'occlusion (ADR-0002) et le restent pour la requête.

## Dépendances

- `src/core/SensorGeometry.js` — intersection rayon-volume.
- `src/core/SensorOcclusion.js` — occlusion ellipsoïde (et futur terrain/modèles).
- `src/core/EntityAdapter.js` — normalisation de l'entrée.
- `src/queries/SensorView.js` — calcul d'un `SensorView`.
- `src/core/SensorSystem.js` — point d'entrée public.

## Voir aussi

- [ADR-0002 — Occlusion](ADR-0002-occlusion.md)
- [Requête de visibilité](queries/visibility-query.md)
- [Coût des requêtes de visibilité](performance/queries.md)
- [API publique](api/open-sensor-api.md)