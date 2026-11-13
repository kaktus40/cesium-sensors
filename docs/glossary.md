# Glossaire

| Terme | Définition |
|---|---|
| Senseur | Volume orienté représentant une zone de détection ou de visibilité |
| Occluder | Surface opaque qui bloque un rayon depuis l'origine du senseur |
| Occlusion | Suppression ou différenciation de la partie du volume bloquée |
| Origin | Origine monde du senseur, point de départ des rayons |
| Viewshed | Représentation de la visibilité depuis une origine donnée |
| Ellipsoïde | Corps mathématique central de CesiumJS |
| Terrain | Surface topographique rendue par le Globe |
| 3D Tiles | Contenu 3D tuilé rendu dans la scène |
| `SensorSystem` | Gestionnaire de ressources et d'ordonnancement par Scene |
| Graphics | Représentation déclarative d'un senseur attaché à une Entity |
| Primitive | Objet de rendu direct ajouté à `scene.primitives` |
| Motif | Contour angulaire d'un senseur personnalisé |
| Pose | Position et orientation du senseur |
| Occlusion rasterisée | Approximation GPU limitée par une résolution de profondeur |
| Propagation simplifiée | Modèle futur d'atténuation ou d'énergie, distinct de l'occlusion géométrique |
| `SensorView` | Résultat d'une requête de visibilité : `{ sensor, distance, inVolume, occluded }` |
| `getSensorsSeeing` | Méthode asynchrone de `SensorSystem` retournant les senseurs qui voient une cible |
| Distance le long du rayon | Distance depuis l'origine du senseur jusqu'à l'intersection avec la surface de son volume |
| Ligne de visée | Segment droit reliant l'origine du senseur à la cible, évalué pour l'occlusion |
| `includeOccludedVolume` | Option de `getSensorsSeeing` incluant les senseurs dont la ligne de visée est occultée |
| `EntityAdapter` | Adaptateur interne normalisant l'entrée d'une requête de visibilité (Entity, Primitive, Cartesian3) |
| `SensorGeometry` | Module interne de calcul d'intersection rayon-volume (cône, pyramide, motif) |
| `SensorOcclusion` | Module interne d'évaluation d'occlusion (ellipsoïde, terrain, modèles) |
| État `UNKNOWN` | État d'un occluder (terrain, modèle) dont les données ne sont pas encore chargées |