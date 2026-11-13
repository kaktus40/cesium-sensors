# Protocole de benchmark

## Configuration de référence

- navigateur principal : Brave récent ;
- backend : WebGL 2 ;
- résolution : 1920×1080 ;
- scène : 400 à 500 satellites et senseurs ;
- terrain et modèles représentatifs ;
- animations de position et orientation ;
- mêmes données et mêmes conditions de caméra pour chaque comparaison.

## Objectifs

- minimum cible : environ 30 FPS ;
- objectif supérieur : environ 60 FPS lorsque le matériel le permet ;
- absence de fuite mémoire après destruction/recréation ;
- pas de croissance non bornée du nombre de passes ou textures.

## Scénarios

1. 1 senseur statique ;
2. 100 senseurs dynamiques ;
3. 400 senseurs dynamiques ;
4. 500 senseurs dynamiques ;
5. 500 senseurs dont 80 % hors écran ;
6. terrain seul ;
7. terrain + 3D Tiles ;
8. `LOW`, `BALANCED`, `HIGH`, `AUTO` ;
9. `requestRenderMode` activé ;
10. affichage de la partie occultée activé ;
11. requête `getSensorsSeeing` : 1, 100, 400, 500 senseurs, 1 cible.

## Données à enregistrer

- version du plugin ;
- version CesiumJS ;
- version Brave ;
- GPU et pilote ;
- résolution ;
- FPS moyen/minimum ;
- temps CPU ;
- temps GPU ;
- mémoire GPU ;
- senseurs recalculés par frame ;
- nombre de passes d’occlusion ;
- résolution des textures ;
- temps CPU par requête `getSensorsSeeing` (ms) ;
- nombre de senseurs évalués par requête ;
- erreurs de chargement.

## Règles

Les benchmarks doivent être exécutés au moins trois fois après stabilisation de la scène. Les valeurs retenues seront la médiane et le pire résultat observé.

Tout changement d’algorithme d’occlusion doit comparer la qualité visuelle et le coût, pas seulement les FPS.
