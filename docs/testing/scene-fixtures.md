# Scènes de test

## Principe

Les tests sont séparés en deux catégories :

1. scènes déterministes sans réseau ;
2. scènes d’intégration terrain/3D Tiles avec fournisseur externe contrôlé.

## Scènes déterministes

Elles doivent fonctionner sans token et sans accès réseau :

- ellipsoïde Cesium ;
- primitives opaques créées localement ;
- primitives translucides ;
- imagery désactivée ;
- 1, 100 et 500 senseurs ;
- poses et portées issues de la fixture CZML générée.

Elles servent aux tests unitaires visuels, aux tests de cycle de vie et aux benchmarks reproductibles.

## Scènes terrain

Le terrain réel doit être fourni par une configuration d’intégration, jamais codé dans les tests unitaires. La configuration doit fournir :

- URL du terrain ;
- token hors dépôt si nécessaire ;
- coordonnées de la zone de test ;
- niveau de détail attendu ;
- état attendu lorsque les tuiles sont en chargement.

## Scènes 3D Tiles

La scène modèle doit contenir :

- au moins un objet opaque placé entre l’origine du senseur et son volume ;
- un objet opaque hors champ de la caméra principale mais dans le champ du senseur ;
- un matériau translucide qui ne doit pas occulter ;
- un objet non occluder de contrôle.

La fixture doit être versionnée par URL ou par archive de test, avec une licence et une provenance documentées.

## Matrice minimale

| Scène | Réseau | Terrain | Modèle | But |
|---|---:|---:|---:|---|
| `ellipsoid-only` | non | non | non | géométrie et ellipsoïde |
| `opaque-primitives` | non | non | local | occlusion opaque |
| `transparent-primitives` | non | non | local | exclusion de la transparence |
| `benchmark-500` | non | non | local | performance |
| `terrain-integration` | oui/configuré | oui | optionnel | relief réel |
| `tileset-integration` | oui/configuré | optionnel | oui | bâtiments et objets hors caméra |

## Règle

Un test qui dépend d’un service externe doit être marqué explicitement `integration` et ne doit pas bloquer les tests unitaires ou les tests de build.
