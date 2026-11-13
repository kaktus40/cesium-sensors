# Prototype GPU d’occlusion depuis l’origine du senseur

## État d’avancement — 12 novembre 2026

- Prototype CesiumJS `1.147.0` ajouté dans `prototype/` et primitive de cône expérimental dans `src/ConicSensor.js`.
- Le shader utilise le pipeline GLSL 300 es de Cesium (`in`/`out`, `out_FragColor`) et l’uniforme `u_ellipsoidOcclusion`.
- Le primitive possède un état de rendu translucide explicite; l’uniforme de position est fourni par l’Appearance.
- Test Playwright vérifie le chargement de 500 entités CZML, l’existence du primitive, l’absence de dialogue d’erreur Cesium, et bascule l’uniforme d’occlusion.
- Vérification exécutée : `npm run test:e2e`, 3 tests passés avec `/usr/bin/chromium` et SwiftShader.
- **Non validé :** la capture reste sans cône clairement visible. Aucun test ne compare encore les pixels entre les deux états d’occlusion. L’algorithme d’intersection ellipsoïdale doit donc être considéré expérimental.
- `npm run lint` échoue car ESLint 10 ne trouve pas de `eslint.config.*`.

Reprendre dans l’ordre indiqué dans [TODO.md](../TODO.md). Ne pas élargir le prototype aux modèles 3D ou au terrain avant d’avoir une scène ellipsoïdale visuellement fiable.

## Objectif

Démontrer qu’une occlusion de ligne de visée depuis l’origine du senseur est réalisable avec CesiumJS/WebGL 2 pour 400 à 500 senseurs dynamiques.

## Hypothèse

Une profondeur produite depuis la caméra principale n’est pas suffisante. Le prototype doit générer ou approximer une visibilité depuis les origines des senseurs, y compris pour des objets hors du champ de la caméra principale.

## Scènes de référence

1. ellipsoïde seul ;
2. terrain montagneux ;
3. un bâtiment opaque ;
4. plusieurs 3D Tiles ;
5. objet hors caméra mais dans le champ du senseur ;
6. imagerie et atmosphère ;
7. objets translucides ;
8. 400 satellites avec senseurs ;
9. 500 senseurs avec poses animées ;
10. scènes 2D, 3D et morphing.

## Algorithmes à comparer

### A. Une vue de profondeur par senseur

Référence de qualité, probablement trop coûteuse à 500 senseurs.

### B. Atlas de profondeur partagé

Regrouper plusieurs senseurs dans des passes ou textures partagées. Mesurer la complexité de projection et les artefacts.

### C. Mises à jour échelonnées

Actualiser un sous-ensemble par frame et conserver le dernier résultat pour les autres.

### D. Qualité adaptative

Faire varier résolution et fréquence selon la visibilité, la taille à l’écran, la priorité et la distance.

## Critères de réussite

- ligne de visée calculée depuis l’origine du senseur ;
- terrain et modèles hors caméra pris en compte ;
- imagerie exclue ;
- translucence exclue ;
- autres senseurs exclus ;
- ellipsoïde toujours pris en compte ;
- résultat stable avec une résolution contrôlée ;
- destruction complète des ressources ;
- au moins 30 FPS sur la scène de référence Brave/WebGL2 ;
- comportement compatible avec `requestRenderMode`.

## Mesures

- FPS moyen, minimum et percentile 1 % ;
- temps CPU du `SensorSystem` ;
- temps GPU des passes d’occlusion ;
- nombre de passes ;
- mémoire GPU ;
- taille des textures ;
- nombre de senseurs recalculés par frame ;
- erreur de frontière par rapport à la référence haute résolution.

## Sorties attendues

- rapport benchmark JSON ;
- captures comparatives ;
- vidéo courte des artefacts éventuels ;
- recommandation d’algorithme ;
- mise à jour de `ADR-0002-occlusion.md` si nécessaire.

## Règle de décision

Ne pas figer l’implémentation complète avant d’avoir comparé au moins une solution haute qualité et une solution mutualisée/adaptative.
