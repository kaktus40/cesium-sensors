# Plan de tests `open-sensor`

## Objectif

Vérifier le comportement fonctionnel, le rendu, les performances et le cycle de vie GPU du plugin.

## Tests unitaires Jasmine/Karma

- validation des angles et directions ;
- motifs multiples ;
- détection des doublons ;
- rayon nul, fini et infini ;
- composition de transformation locale ;
- conversion position/orientation vers `modelMatrix` ;
- propriétés constantes et temporelles ;
- clone et merge des Graphics ;
- configuration immutable ;
- modes d’occlusion ;
- qualité et priorité ;
- matériaux ;
- codes d’erreur ;
- identités de picking ;
- intersection rayon-volume (cône, pyramide, motif) ;
- résolution de position d'une cible (Entity, Primitive, Cartesian3) ;
- occlusion ellipsoïdale CPU (segment origine→cible) ;
- requête `getSensorsSeeing` : senseur voit / ne voit pas selon la position ;
- distance le long du rayon jusqu'à la surface du volume ;
- option `includeOccludedVolume` ;
- exclusion des senseurs désactivés (`show: false`) ;
- cible sans position disponible (erreur `TARGET_POSITION_UNAVAILABLE`) ;

## Tests WebGL

- création du volume ;
- reconstruction de la géométrie ;
- compilation des shaders ;
- matériaux translucides ;
- matériau d’atténuation ;
- occlusion ellipsoïdale ;
- terrain ;
- modèle opaque ;
- modèle translucide ;
- imagerie exclue ;
- senseurs non occluders ;
- picking visible/occulté/intersection ;
- destruction des buffers, textures et programmes.

## Tests Playwright

- 3D ;
- 2D ;
- Columbus View ;
- morphing ;
- terrain en chargement ;
- 3D Tiles en chargement ;
- objet hors caméra ;
- 400 satellites CZML ;
- 500 senseurs ;
- `requestRenderMode` ;
- mise à jour adaptative ;
- retour d’un senseur hors écran ;
- captures visuelles ;
- requête `getSensorsSeeing` : tableau retourné, distances, inVolume, occluded ;
- requête `getSensorsSeeing` avec `includeOccludedVolume` ;
- requête `getSensorsSeeing` sur cible sans position (erreur gérée) ;

## Tests de non-régression

Les scènes de référence seront conservées dans `Specs/fixtures` et les captures dans `Specs/e2e/snapshots`. Toute modification du shader devra fournir une justification et une comparaison visuelle.

## Tolérances

Les tests visuels utiliseront une tolérance documentée pour les différences GPU. Les tests fonctionnels de visibilité devront rester déterministes sur la configuration de CI.

## Critères de validation

Une fonctionnalité n’est pas considérée comme terminée sans :

1. test unitaire ou WebGL adapté ;
2. test visuel si le rendu est affecté ;
3. documentation API ;
4. cas d’erreur documenté ;
5. mesure de performance si une passe GPU est ajoutée.
