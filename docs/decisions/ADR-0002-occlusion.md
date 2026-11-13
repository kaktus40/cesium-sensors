# ADR-0002 — Modèle d’occlusion depuis l’origine du senseur

## Statut

Accepté pour le prototype ; détails GPU à valider.

## Contexte

Une profondeur produite depuis la caméra ne représente pas la visibilité d’un point depuis un satellite. Le plugin doit simuler une ligne de visée de senseur :

```text
origine du senseur → objet opaque → point observé
```

## Décision fonctionnelle

L’occlusion sera calculée depuis l’origine du senseur, et non uniquement depuis la caméra principale.

Les modes publics initiaux seront :

```text
NONE
ELLIPSOID
SCENE
```

`SCENE` sera le mode par défaut et inclura l’ellipsoïde, le terrain et les objets opaques de la scène.

## Occluders inclus

- ellipsoïde de la scène ;
- terrain ;
- bâtiments et modèles opaques ;
- 3D Tiles opaques ;
- primitives opaques ;
- point clouds opaques.

## Occluders exclus

- imagery layers ;
- atmosphère ;
- nuages et particules ;
- objets translucides ;
- autres senseurs.

## Décision technique provisoire

Le prototype évaluera une représentation GPU rasterisée depuis les senseurs. Avec 400 à 500 senseurs, il devra mutualiser les ressources et utiliser une résolution/fréquence adaptatives.

La précision attendue est géométriquement correcte selon la ligne de visée, mais limitée par la résolution de la représentation GPU.

## Chargement incomplet

L’ellipsoïde est toujours appliqué. Le terrain et les modèles sont intégrés progressivement lorsque leur profondeur est disponible. Un objet non chargé ne sera pas considéré artificiellement comme occluder.

## Hors périmètre

- propagation électromagnétique complète ;
- diffraction ;
- interférences ;
- pénétration des matériaux ;
- atténuation physique dans la première version.
