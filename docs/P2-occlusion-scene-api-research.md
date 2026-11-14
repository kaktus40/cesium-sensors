# API CesiumJS pour profondeur et occlusion de scène

## APIs identifiées (CesiumJS 1.147.0)

### Globe.pick(ray, scene, result) — Source/Core/Globe.js:36264
Trouve l'intersection entre un rayon (world coordinates) et la surface du globe **déjà rendu**.
- Retourne `Cartesian3 | undefined` : point d'intersection ou undefined si aucun.
- Limitation : ne teste que ce qui a été rendu par la caméra actuelle. Pas adapté pour tester un rayon dans une direction arbitraire hors frustum.

### Scene.sampleHeight(position, objectsToExclude?, width?) — Source/Scene/Scene.js:46126
Retourne la hauteur du terrain/3D Tiles à une position cartographique.
- Retourne `number | undefined`.
- Synchrone mais dépend des tuiles déjà chargées dans le cache.

### Scene.clampToHeight(cartesian, objectsToExclude?, width?, result?) — Source/Scene/Scene.js:46145
Projette une position Cartesian3 sur la surface du terrain.
- Retourne `Cartesian3 | undefined`.

### Scene.sampleHeightMostDetailed(positions, objectsToExclude?, width?) — Source/Scene/Scene.js:46167
Version asynchrone, charge les tuiles au niveau de détail maximal.
- Retourne `Promise<(Cartographic | undefined)[]>`.
- Fonctionne indépendamment de la caméra (charge les données nécessaires).

### Scene.clampToHeightMostDetailed(cartesians, objectsToExclude?, width?) — Source/Scene/Scene.js:46178
Version asynchrone de clampToHeight.
- Retourne `Promise<(Cartesian3 | undefined)[]>`.

### Globe.sampleHeightSupported / clampToHeightSupported — Source/Scene/Scene.js:45786-45792
Drapeaux booléens indiquant si les méthodes de hauteur sont supportées.

### Cesium3DTileset.getHeight(cartographic, scene) — Source/Scene/Cesium3DTileset.js:32855
Retourne la hauteur d'un tileset 3D Tiles à une position cartographique.

## Stratégie d'occlusion de scène

Pour tester si un rayon depuis un capteur vers une cible est occulté par le terrain ou des modèles 3D Tiles :

1. **Terrain (ellipsoïde + heightmap)** : utiliser `globe.pick(ray, scene)` pour tester l'intersection rayon-terrain. Si l'intersection est entre l'origine et la cible, le rayon est occulté.
   - Limitation : `globe.pick` ne teste que ce qui a été rendu. Pour des directions hors frustum, il faut utiliser `sampleHeight`/`clampToHeight` ou rendre une passe de profondeur dédiée.

2. **Modèles 3D Tiles opaques** : il n'existe pas d'API publique directe pour tester l'intersection rayon-3DTiles dans CesiumJS 1.147.0. Approches possibles :
   - Passe de profondeur par capteur (rendu offscreen du depth buffer, puis lecture des pixels le long du rayon).
   - Utiliser `scene.drillPick` ou `scene.pick` avec un rayon, mais ces APIs dépendent de la caméra actuelle.
   - Charger les tuiles 3D Tiles et tester géométriquement (complexe, pas supporté nativement).

3. **Hors caméra principale** : `sampleHeightMostDetailed` et `clampToHeightMostDetailed` sont asynchrones et chargent les données de terrain indépendamment de la vue. C'est la voie la plus viable pour obtenir la profondeur sans dépendre de la caméra principale.

## Recommandation d'architecture

| Élément | Approche recommandée | Raison |
|---|---|---|
| Terrain (hauteur) | `globe.pick()` + `sampleHeightMostDetailed()` | API publique, fonctionne indépendamment de la caméra (version async) |
| 3D Tiles opaques | Passe de profondeur dédiée (offscreen) | Aucune API publique de ray-tileset intersection |
| Performance | Passe de profondeur partagée par capteur | Évite de rendre toute la scène pour chaque capteur |

## Fichiers sources de référence
- `node_modules/cesium/Source/Core/Globe.js` — `Globe.pick()`
- `node_modules/cesium/Source/Scene/Scene.js` — `sampleHeight`, `clampToHeight`, `sampleHeightMostDetailed`, `clampToHeightMostDetailed`
- `node_modules/cesium/Source/Scene/Cesium3DTileset.js` — `getHeight()`
