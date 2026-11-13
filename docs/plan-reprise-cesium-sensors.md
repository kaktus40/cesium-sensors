# Cesium Sensors

## Dossier de cadrage pour la reprise et la modernisation

**Version :** 0.1  
**Date :** 12 novembre 2026  
**Périmètre :** plugin open source de volumes de capteurs pour CesiumJS  
**Objectif :** reconstruire le plugin autour d’une architecture CesiumJS moderne et fournir une occlusion configurable par ellipsoïde, terrain et modèles 3D.

---

## 1. Résumé exécutif

Le dépôt actuel est un plugin CesiumJS historique datant principalement de 2020. Il ajoute trois types de capteurs : conique, rectangulaire et à motif personnalisé. Son intégration se fait par les mécanismes `CzmlDataSource`, `Entity`, `Graphics`, `Visualizer` et un primitive WebGL personnalisé.

Le rendu actuel sait construire un volume et calculer une occlusion analytique par l’ellipsoïde. Il ne fournit pas une véritable occlusion configurable par le terrain ou par des modèles 3D sélectionnés.

La reprise doit donc être une migration architecturale, et non une simple mise à jour de version. La cible est la dernière version CesiumJS validée au moment du développement, actuellement la release 1.147 selon le dépôt officiel, avec une matrice de versions explicitement testées.

La stratégie retenue est une implémentation open source indépendante, inspirée du comportement fonctionnel documenté par Cesium, sans copier le code propriétaire du Cesium ion SDK. Le Cesium ion SDK documente des capteurs avec occlusion par ellipsoïde, terrain et environnement 3D, mais il s’agit d’un produit commercial distinct de CesiumJS open source.

### Résultat attendu

Le projet devra fournir :

- une API ES module moderne ;
- une intégration Entity/CZML documentée ;
- des primitives utilisables directement dans `scene.primitives` ;
- une API d’occlusion explicite et configurable ;
- des tests unitaires, WebGL et end-to-end ;
- une documentation d’installation, d’utilisation, de migration et de contribution ;
- une publication reproductible et compatible avec les pratiques de développement CesiumJS.

---

## 2. Sources et références officielles

Les références doivent être relues lors de chaque mise à jour de CesiumJS.

### CesiumJS

- Dépôt principal : <https://github.com/CesiumGS/cesium>
- Releases : <https://github.com/CesiumGS/cesium/releases>
- Documentation API : <https://cesium.com/learn/cesiumjs/ref-doc/index.html>
- Guide de développement : <https://github.com/CesiumGS/cesium/blob/main/Documentation/Contributors/CodingGuide/README.md>
- Guide de tests : <https://github.com/CesiumGS/cesium/blob/main/Documentation/Contributors/TestingGuide/README.md>
- Architecture modulaire : <https://cesium.com/blog/2022/12/07/modular-structure-in-cesiumjs/>
- Primitive : <https://cesium.com/learn/cesiumjs/ref-doc/Primitive.html>
- Scene : <https://cesium.com/learn/cesiumjs/ref-doc/Scene.html>
- Globe et terrain : <https://cesium.com/learn/cesiumjs/ref-doc/Globe.html>

### Capteurs et références fonctionnelles

- Cesium ion SDK : <https://cesium.com/learn/cesiumjs-learn/cesium-ion-sdk/>
- `ConicSensor` : <https://cesium.com/learn/ion-sdk/ref-doc/ConicSensor.html>
- `CustomPatternSensor` : <https://cesium.com/learn/ion-sdk/ref-doc/CustomPatternSensor.html>
- `ConicSensorGraphics` : <https://cesium.com/learn/ion-sdk/ref-doc/ConicSensorGraphics.html>
- Fork historique `cesium-sensor-volumes` : <https://github.com/MathDotSqrt/cesium-sensor-volumes>

Les pages du ion SDK sont des références de comportement et d’API. Elles ne constituent pas une autorisation de reprendre du code propriétaire.

---

## 3. État des lieux du dépôt

### 3.1. Métadonnées observées

- package : `cesium-sensors` ;
- version : `0.0.2` ;
- dernier commit local : août 2020 ;
- build historique basé sur RequireJS et Almond ;
- exemples utilisant CesiumJS 1.59 ;
- tests configurés sur une URL CesiumJS 1.15 ;
- absence de scripts modernes `build`, `test`, `lint` et `test:e2e` dans `package.json`.

### 3.2. Fichiers principaux

| Élément | Rôle |
|---|---|
| `Source/CesiumSensors.js` | point d’entrée et exports publics |
| `Source/initialize.js` | branchement CZML et visualizers |
| `Source/*SensorGraphics.js` | propriétés Entity/CZML |
| `Source/*SensorVisualizer.js` | synchronisation Entity vers primitive |
| `Source/CustomSensorVolume.js` | primitive WebGL générique |
| `Source/RectangularPyramidSensorVolume.js` | adaptation rectangulaire |
| `Source/*.glsl` | shaders de géométrie, matériau et occlusion |
| `Specs/` | tests Jasmine historiques |
| `Examples/` | exemples CZML et API |
| `build.js` | bundle AMD historique |

### 3.3. État Git à préserver

Au moment de la rédaction, le dépôt contient des changements locaux qui ne doivent pas être écrasés sans décision explicite :

- `Build/Unminified/CesiumSensors.js` modifié ;
- `.tmp/` non suivi ;
- `pnpm-lock.yaml` non suivi.

Avant toute migration, créer une branche de sauvegarde ou archiver ces éléments. La migration ne doit pas mélanger les corrections historiques et la modernisation technique.

---

## 4. Fonctionnement actuel détaillé

### 4.1. Chaîne d’exécution

```text
CZML ou création directe d’une Entity
        |
        v
initialize.js
        |
        +-- CzmlDataSource.updaters
        +-- DataSourceDisplay.defaultVisualizersCallback
        |
        v
ConicSensorGraphics / CustomPatternSensorGraphics /
RectangularSensorGraphics
        |
        v
ConicSensorVisualizer / CustomPatternSensorVisualizer /
RectangularSensorVisualizer
        |
        v
CustomSensorVolume / RectangularPyramidSensorVolume
        |
        v
VertexArray + DrawCommand + ShaderProgram
        |
        v
Cesium.Scene
```

### 4.2. Chargement CZML

`initialize.js` ajoute trois updaters à `CzmlDataSource.updaters` :

- `agi_conicSensor` ;
- `agi_customPatternSensor` ;
- `agi_rectangularSensor`.

Les valeurs sont converties en propriétés Cesium avec `processPacketData` et `processMaterialPacketData`. Les intervalles temporels sont traités avec `TimeInterval`.

Pour une Entity créée manuellement, le plugin exige encore l’ajout explicite de la propriété :

```js
entity.addProperty("conicSensor");
entity.conicSensor = new CesiumSensors.ConicSensorGraphics();
```

### 4.3. Graphics

Les classes Graphics ne dessinent pas directement. Elles décrivent un état déclaratif et temporel : angles, rayon, matériau, couleur d’intersection et visibilité.

Elles suivent le modèle Cesium :

- `Property` pour les valeurs temporelles ;
- `definitionChanged` ;
- `clone` ;
- `merge` ;
- des descripteurs de propriétés.

### 4.4. Visualizers

À chaque mise à jour temporelle, un visualizer :

1. sélectionne les Entities concernées ;
2. vérifie `isShowing` et `isAvailable(time)` ;
3. évalue position et orientation ;
4. crée ou récupère un primitive ;
5. calcule `modelMatrix` ;
6. évalue les propriétés `Property` ;
7. copie l’état vers le primitive ;
8. masque ou détruit les primitives devenus inutiles.

Les visualizers utilisent toutefois des champs privés Cesium tels que `entity._position` et `entity._conicSensor`. Cette dépendance doit être supprimée dans la version moderne.

### 4.5. Géométrie

Les directions sont exprimées en coordonnées sphériques : angle d’horloge, angle de cône et éventuellement magnitude. Elles sont converties en positions dans le repère local du capteur.

Le contour est triangulé et placé à `radius`. Les séparateurs `null` permettent de produire plusieurs sous-volumes dans un même capteur.

Le volume rectangulaire est dérivé d’un contour à quatre directions calculé à partir des demi-angles X et Y.

### 4.6. Rendu GPU

`CustomSensorVolume` utilise directement des classes internes de Cesium :

- `Buffer` ;
- `VertexArray` ;
- `ShaderProgram` ;
- `DrawCommand` ;
- `RenderState` ;
- `Pass`.

La méthode `update(frameState)` prépare les ressources et ajoute les commandes de rendu à `frameState.commandList`. Le primitive gère aussi le picking et la destruction des ressources WebGL.

Cette approche est techniquement adaptée à un volume complexe, mais elle est couplée à des modules historiques et privés. Elle devra être portée vers l’architecture moderne en conservant le cycle de vie attendu par Cesium.

### 4.7. Occlusion actuelle

Le fragment shader évalue la position du fragment dans l’ellipsoïde Cesium avec `czm_ellipsoidInverseRadii`.

```glsl
float ellipsoidValue = ellipsoidSurfaceFunction(v_positionWC);
```

Un fragment situé à l’intérieur de l’ellipsoïde est supprimé, sauf si `showThroughEllipsoid` est activé. Une fonction `inSensorShadow` supprime également la partie du volume placée derrière l’ellipsoïde.

Cette occlusion est mathématique. Elle ne tient pas compte :

- du relief du terrain ;
- des bâtiments ;
- des modèles 3D ;
- des 3D Tiles ;
- de la sélection d’un ensemble d’occluders.

### 4.8. Projection 2D

Le vertex shader convertit les coordonnées ECEF en latitude, longitude et altitude, puis applique une projection équirectangulaire. Le résultat est interpolé pendant le morphing entre 3D et 2D.

Cette fonctionnalité est spécifique au fork et doit faire partie de la spécification de compatibilité, avec des tests visuels dédiés.

---

## 5. Limites techniques de l’occlusion souhaitée

### 5.1. Ellipsoïde

L’occlusion analytique est déjà réalisable dans le shader. Elle doit être conservée et rendue configurable par ellipsoïde :

```js
occlusion: {
  ellipsoid: true
}
```

L’ellipsoïde considéré doit être celui de la scène, et non une constante WGS84 codée en dur.

### 5.2. Terrain

Le terrain est rendu par `scene.globe` et possède une profondeur GPU. `Globe#depthTestAgainstTerrain` permet le depth testing de certaines primitives contre le terrain, mais ne constitue pas une API complète de sélection d’occluders par capteur.

Il faudra tester :

- terrain absent ;
- terrain en cours de chargement ;
- terrain haute résolution ;
- changement de niveau de détail ;
- caméra souterraine ;
- scènes 2D et 3D ;
- terrain transparent ou masqué.

### 5.3. Modèles et 3D Tiles

Le rendu d’un modèle ou d’un tileset fournit une profondeur visible, mais CesiumJS ne fournit pas nécessairement une collection publique générique permettant de demander : « utilise uniquement ces objets comme occluders ».

Une API comme celle-ci est souhaitée :

```js
occlusion: {
  models: [tilesetA, tilesetB]
}
```

Elle nécessite un mécanisme dédié pour :

- sélectionner les objets ;
- générer une profondeur ou un masque ;
- synchroniser le chargement progressif ;
- gérer les objets translucides ;
- comparer cette profondeur aux fragments du capteur ;
- préserver le comportement en picking et en morphing.

Il ne faut pas dépendre directement de textures privées de profondeur Cesium. Si une fonctionnalité nécessaire n’est pas exposée publiquement, elle devra être isolée dans un adaptateur clairement identifié, ou faire l’objet d’une discussion en amont avec la communauté Cesium.

### 5.4. Modes d’occlusion proposés

La future API devra distinguer au moins :

| Mode | Effet |
|---|---|
| `NONE` | aucun masquage par environnement |
| `ELLIPSOID` | ellipsoïde uniquement |
| `TERRAIN` | terrain uniquement |
| `MODELS` | modèles/tilesets sélectionnés |
| `ALL` | ellipsoïde, terrain et modèles sélectionnés |
| `DEPTH_BUFFER` | utilise la profondeur visible de la scène, sans sélection fine |

Cette dernière distinction est importante : « profondeur visible de la scène » et « liste d’occluders explicitement sélectionnés » ne sont pas équivalentes.

---

## 6. Architecture cible

### 6.1. Principes

La nouvelle architecture doit :

- utiliser des ES modules ;
- séparer géométrie, matériau, occlusion et intégration Entity ;
- dépendre autant que possible des API publiques ;
- isoler les accès internes éventuels dans un module unique ;
- rendre la capacité d’occlusion observable et testable ;
- préserver les primitives directes et l’intégration Entity ;
- documenter les limitations par scène et par navigateur.

### 6.2. Modules proposés

```text
src/
  core/
    SensorVolume.js
    SensorGeometry.js
    SensorDirections.js
    SensorOcclusion.js
  rendering/
    SensorPrimitive.js
    SensorShaderProgram.js
    SensorDepthMask.js
  dataSources/
    ConicSensorGraphics.js
    CustomPatternSensorGraphics.js
    RectangularSensorGraphics.js
    SensorVisualizer.js
    czmlSensorUpdater.js
  public/
    index.js
  shaders/
    sensorVolume.vert.glsl
    sensorVolume.frag.glsl
  tests/
```

### 6.3. API conceptuelle

```js
const sensor = new SensorVolume({
  modelMatrix,
  directions,
  radius: 1_000_000,
  occlusion: {
    mode: SensorOcclusionMode.ALL,
    ellipsoid: true,
    terrain: true,
    models: [tilesetA, tilesetB]
  }
});

scene.primitives.add(sensor);
```

Pour les Entities :

```js
entity.sensor = new SensorGraphics({
  radius: new Cesium.ConstantProperty(1_000_000),
  occlusion: new Cesium.ConstantProperty({
    mode: SensorOcclusionMode.TERRAIN
  })
});
```

La forme exacte de l’API sera décidée après un prototype de profondeur. Elle ne doit pas être publiée comme API stable avant d’avoir défini les garanties réelles de chaque mode.

---

## 7. Stratégie de migration

### Phase 0 — sauvegarde et caractérisation

- créer une branche de sauvegarde ;
- archiver les bundles existants ;
- noter les changements locaux ;
- faire fonctionner un exemple minimal avec la version actuelle ;
- capturer des images de référence 3D et 2D ;
- identifier les comportements à préserver.

### Phase 1 — outillage moderne

- remplacer RequireJS/Almond ;
- introduire `package.json` moderne ;
- installer CesiumJS localement ;
- ajouter un bundler ;
- ajouter ESLint, Prettier et JSDoc ;
- ajouter les scripts de build et de test ;
- supprimer les URLs Cesium distantes obsolètes.

### Phase 2 — portage du modèle de données

- convertir les modules AMD en ES modules ;
- préserver les classes Graphics ;
- supprimer l’accès aux propriétés privées des Entity ;
- isoler l’updater CZML ;
- définir les propriétés d’occlusion ;
- documenter la compatibilité CZML.

### Phase 3 — portage de la géométrie et du rendu

- porter la construction du volume ;
- porter les séparateurs de sous-volumes ;
- porter la projection 2D ;
- porter le picking ;
- vérifier le cycle `update`/`destroy` ;
- remplacer les API Cesium supprimées ou déplacées.

### Phase 4 — prototype d’occlusion

Implémenter dans cet ordre :

1. ellipsoïde ;
2. depth testing standard ;
3. terrain ;
4. modèles 3D génériques ;
5. sélection explicite de modèles ;
6. combinaison des modes ;
7. comportement en 2D et en morphing.

Chaque étape doit produire un exemple et un test visuel.

### Phase 5 — stabilisation

- tests sur la dernière version CesiumJS ;
- tests de régression visuelle ;
- tests de performance ;
- tests de destruction et recréation ;
- documentation API générée ;
- exemple complet d’occlusion ;
- release candidate.

---

## 8. Organisation du chantier

### 8.1. Épique A — fondations

Livrables : build moderne, modules ES, version Cesium figée, CI minimale.

### 8.2. Épique B — compatibilité fonctionnelle

Livrables : cônes, rectangles, motifs, Entity, CZML, matériaux, picking, 2D.

### 8.3. Épique C — moteur d’occlusion

Livrables : abstraction `SensorOcclusion`, ellipsoïde, terrain, profondeur de scène, modèles sélectionnés.

### 8.4. Épique D — tests et performances

Livrables : tests unitaires, WebGL, Playwright, benchmarks, captures de référence.

### 8.5. Épique E — documentation et publication

Livrables : README, guide migration, API docs, exemples, changelog, release.

### 8.6. Découpage des tickets

Chaque ticket doit préciser :

- objectif ;
- fichiers concernés ;
- API publique touchée ;
- critère d’acceptation ;
- test associé ;
- risque de régression ;
- impact sur la documentation.

Exemple :

```text
Titre : Ajouter le mode d’occlusion ELLIPSOID

Critères :
- le mode est désactivé par défaut ou documenté explicitement ;
- le fragment intérieur à l’ellipsoïde est supprimé ;
- le comportement de showThroughEllipsoid est défini ;
- un test shader ou visuel couvre le cas ;
- l’API générée contient un exemple ;
- aucune dépendance à une constante WGS84 codée en dur.
```

---

## 9. Stratégie de tests

### Tests unitaires

- conversion des directions ;
- validation des contours ;
- angles limites ;
- rayon nul, fini et infini ;
- matrices et orientations ;
- propriétés constantes et temporelles ;
- configuration d’occlusion ;
- clone et merge ;
- destruction.

### Tests WebGL

- création du primitive ;
- changement des directions ;
- compilation des shaders ;
- matériau translucide ;
- picking ;
- destruction des buffers et shader programs ;
- occlusion analytique ;
- terrain chargé ;
- modèle 3D occluder.

### Tests end-to-end

- rendu 3D ;
- rendu 2D ;
- Columbus View ;
- morphing ;
- Entity dynamique ;
- CZML ;
- terrain en cours de chargement ;
- tileset en cours de chargement ;
- changement de caméra ;
- plusieurs capteurs ;
- changement d’occluders pendant l’exécution.

### Tests visuels

Les captures doivent couvrir :

- capteur au-dessus de l’ellipsoïde ;
- capteur intersectant l’ellipsoïde ;
- terrain montagneux ;
- bâtiment ou tileset traversant le volume ;
- plusieurs modèles dont un seul est sélectionné comme occluder ;
- scène avec terrain désactivé ;
- scènes 2D et 3D.

Les captures ne doivent pas être comparées avec une tolérance nulle : le rendu WebGL peut varier selon le navigateur, le GPU et le pilote. La tolérance doit être documentée.

---

## 10. Performance et qualité GPU

Les points à surveiller sont :

- coût de reconstruction de la géométrie ;
- recompilation des shaders quand le matériau change ;
- nombre de passes pour l’occlusion ;
- coût des masques de profondeur ;
- volume englobant et culling ;
- nombre de capteurs visibles ;
- capteurs dynamiques ;
- résolution des textures d’occlusion ;
- gestion du chargement progressif des tilesets.

Chaque nouvelle passe GPU devra être justifiée par un benchmark. Le mode le moins coûteux doit rester disponible pour les applications qui n’ont besoin que de l’occlusion ellipsoïdale.

---

## 11. Règles de développement à appliquer

Le code doit suivre les principes du guide CesiumJS :

- noms de répertoires en PascalCase lorsque cela correspond à la convention Cesium ;
- formatage Prettier ;
- ESLint ;
- JSDoc pour toute API publique ;
- pas de `TODO` laissé sans décision ;
- pas d’API privée utilisée sans justification et isolation ;
- tests livrés avec chaque nouveau comportement ;
- fichiers terminés par un saut de ligne ;
- compatibilité et limitations documentées.

Les API expérimentales doivent être marquées comme telles. Une API publique ne doit pas être ajoutée avant d’avoir clarifié son comportement dans les différents modes de scène.

---

## 12. Politique de compatibilité et de versionnement

Le plugin doit distinguer :

- version du plugin ;
- version de CesiumJS testée ;
- version minimale supportée ;
- fonctionnalités expérimentales ;
- limitations de navigateur et de GPU.

Proposition initiale :

```text
cesium-sensors 0.x : période de migration et API expérimentale
cesium-sensors 1.0 : API stable documentée
cesium-sensors 2.0 : rupture de compatibilité API
```

La dépendance CesiumJS doit être une `peerDependency` et non une copie cachée du moteur. Une matrice CI doit vérifier les versions officiellement supportées.

---

## 13. Documentation à maintenir

Le projet devra contenir au minimum :

```text
README.md
CHANGELOG.md
CONTRIBUTING.md
SECURITY.md
docs/
  architecture.md
  cesium-compatibility.md
  occlusion.md
  entity-and-czml.md
  migration-from-legacy.md
  testing.md
  performance.md
  decisions/
    0001-modern-build.md
    0002-occlusion-model.md
    0003-public-api.md
examples/
```

### `architecture.md`

Décrire les couches et les dépendances autorisées.

### `occlusion.md`

Définir précisément chaque mode : résultat visuel, coût, limites et comportement lorsque les données ne sont pas encore chargées.

### `migration-from-legacy.md`

Documenter les correspondances :

| Ancienne API | Nouvelle API prévue |
|---|---|
| `CesiumSensors.ConicSensorGraphics` | `ConicSensorGraphics` |
| `CustomSensorVolume` | `SensorVolume` |
| `showThroughEllipsoid` | option d’occlusion ellipsoïdale |
| `radius` | `maximumRadius` ou alias de compatibilité |
| AMD/RequireJS | ES module |
| injection globale `initialize()` | installation explicite ou auto-enregistrement contrôlé |

### ADR

Chaque décision technique structurante doit être écrite dans un document ADR avec : contexte, options, décision, conséquences et solution de repli.

---

## 14. Risques principaux

| Risque | Niveau | Réponse |
|---|---:|---|
| dépendance aux API internes Cesium | élevé | isoler et réduire ces dépendances |
| profondeur de scène non sélectionnable par objet | élevé | prototype GPU avant figer l’API |
| terrain en chargement progressif | élevé | définir un état `UNKNOWN` ou `NOT_READY` |
| incompatibilité 2D/morphing | moyen | captures et tests dédiés |
| fuite de ressources WebGL | élevé | tests systématiques `destroy()` |
| variation des shaders selon WebGL | moyen | tests sur plusieurs navigateurs/GPU |
| coût de plusieurs passes d’occlusion | élevé | benchmarks et modes dégradés |
| confusion avec le ion SDK | moyen | documentation et séparation de licence |
| rupture avec le CZML historique | moyen | tests de fixtures et guide de migration |

### État `UNKNOWN`

Pour le terrain et les modèles en chargement, il faut éviter de prétendre qu’un fragment est visible alors que l’occluder n’est pas encore disponible. La future API devra choisir explicitement entre :

- afficher provisoirement le volume ;
- masquer provisoirement le volume ;
- afficher avec un indicateur de données incomplètes.

Ce choix doit être documenté et testé.

---

## 15. Critères de réussite

Le chantier sera considéré comme prêt pour une première release lorsque :

- le plugin se compile avec la dernière version CesiumJS ciblée ;
- les exemples ne dépendent plus d’URLs obsolètes ;
- les modules AMD ont été supprimés ou isolés dans une compatibilité facultative ;
- les champs privés Entity ne sont plus utilisés ;
- les capteurs conique, rectangulaire et personnalisé fonctionnent ;
- Entity et primitive directe sont testés ;
- l’occlusion ellipsoïdale est stable ;
- l’occlusion terrain est documentée et testée ;
- l’occlusion de modèles 3D a une sémantique explicitement définie ;
- les limites de la sélection d’occluders sont connues ;
- les ressources GPU sont libérées ;
- la documentation API est générée ;
- la CI est verte sur les tests unitaires, WebGL et end-to-end ;
- un changelog et un guide de migration sont publiés.

---

## 16. Première séquence de travail recommandée

1. Archiver l’état actuel et les changements locaux.
2. Créer une branche `modernize/cesium-current`.
3. Ajouter les documents de compatibilité et les ADR.
4. Installer localement la version CesiumJS cible.
5. Faire fonctionner un exemple minimal sans modifier encore l’occlusion.
6. Porter uniquement `ConicSensorGraphics` et un visualizer minimal.
7. Porter le primitive conique en ES module.
8. Réintroduire la projection 2D.
9. Implémenter et tester l’occlusion ellipsoïdale.
10. Construire un prototype de profondeur pour le terrain.
11. Décider, sur preuve expérimentale, l’architecture des modèles 3D sélectionnés.
12. Seulement ensuite stabiliser l’API publique d’occlusion.

La décision la plus importante ne doit pas être prise avant le prototype : peut-on fournir une occlusion par modèles explicitement sélectionnés avec les API publiques et le pipeline actuel de CesiumJS, ou faut-il proposer d’abord une occlusion par profondeur visible de scène, moins fine mais plus robuste ?

---

## 17. Décisions ouvertes

1. L’occlusion par modèles signifie-t-elle tous les objets visibles ou une liste de tilesets/modèles sélectionnés ?
2. Que doit faire le capteur lorsqu’un occluder est encore en chargement ?
3. Les modèles translucides doivent-ils occlure ?
4. L’occlusion doit-elle fonctionner en 2D et Columbus View, ou seulement en 3D ?
5. Le plugin doit-il conserver la compatibilité avec les propriétés CZML `agi_*` ?
6. L’API doit-elle proposer des primitives séparées (`ConicSensor`, `CustomPatternSensor`, `RectangularSensor`) ou un primitive générique ?
7. Quelle est la résolution maximale acceptable pour une texture de profondeur dédiée ?
8. Quel niveau de compatibilité navigateur et WebGL doit être garanti ?
9. Quelle licence et quel nom de package seront retenus pour la nouvelle version ?

Ces décisions doivent être transformées en ADR avant la stabilisation de la version 1.0.

---

## 18. Registre des décisions validées

Cette section constitue la référence de cadrage pour le développement. En cas de contradiction avec une section plus ancienne de ce document, les décisions ci-dessous sont prioritaires.

### 18.1. Identité du projet

| Élément | Décision |
|---|---|
| Nom du projet | `open-sensor` |
| API JavaScript | `OpenSensor` |
| Namespace CZML | `openSensor_` |
| Licence | Apache 2.0 |
| Version de reprise | `0.1.0` |
| Version stable visée | `1.0.0` après validation complète |
| Ancienne implémentation | conservée dans une branche ou un tag d’archive |

Le dépôt sera renommé `open-sensor`. L’ancien dépôt et l’ancien code ne seront pas traités comme une API compatible : il s’agit d’une nouvelle implémentation open source.

### 18.2. Formes et API JavaScript

L’API publique exposera des classes spécialisées :

```text
OpenSensor.ConicSensor
OpenSensor.RectangularSensor
OpenSensor.CustomPatternSensor
```

Les classes suivantes seront également disponibles pour l’intégration Entity :

```text
OpenSensor.ConicSensorGraphics
OpenSensor.RectangularSensorGraphics
OpenSensor.CustomPatternSensorGraphics
```

Une base commune pourra exister en interne, mais ne sera pas rendue publique tant qu’elle ne présente pas une utilité directe pour les utilisateurs.

La portée utilisera :

```js
minimumRadius
maximumRadius
```

avec :

```js
minimumRadius: 0.0
maximumRadius: Number.POSITIVE_INFINITY
```

Les primitives directes utiliseront `modelMatrix`. Les Entities utiliseront `position` et `orientation` selon les conventions CesiumJS. Une transformation locale statique sera disponible pour placer et orienter un senseur par rapport à son Entity porteuse.

Une Entity pourra porter plusieurs senseurs nommés, par exemple plusieurs instruments sur un satellite.

### 18.3. Motifs personnalisés

Les directions utiliseront des objets simples, sérialisables et indépendants de `Cesium.Spherical` :

```js
{
  clock: 0.0,
  cone: 0.3
}
```

Les angles seront exprimés en radians.

Les motifs discontinus utiliseront plusieurs contours explicites :

```js
patterns: [
  [
    { clock: 0.0, cone: 0.3 },
    { clock: 1.0, cone: 0.3 }
  ],
  [
    { clock: 3.0, cone: 0.4 },
    { clock: 4.0, cone: 0.4 }
  ]
]
```

Les séparateurs `null` de l’ancien plugin sont abandonnés.

Le motif est statique pendant la vie du senseur. Une modification du motif nécessite la création d’un nouveau senseur.

Les motifs invalides seront rejetés strictement avec une erreur descriptive. Aucune correction silencieuse ne sera appliquée.

### 18.4. Occlusion

L’occlusion principale est une occlusion de ligne de visée depuis l’origine du senseur :

```text
origine du senseur → rayon → point du volume
```

Elle ne sera pas calculée uniquement par rapport à la caméra.

Les modes publics initiaux seront :

```js
OpenSensor.OcclusionMode.NONE
OpenSensor.OcclusionMode.ELLIPSOID
OpenSensor.OcclusionMode.SCENE
```

Le mode par défaut sera :

```js
occlusionMode: OpenSensor.OcclusionMode.SCENE
```

Le mode `SCENE` inclura :

- l’ellipsoïde de la scène ;
- le terrain ;
- les bâtiments ;
- les modèles opaques ;
- les 3D Tiles opaques ;
- les primitives opaques ;
- les point clouds opaques.

Ne seront pas des occluders dans la première version :

- les couches d’imagerie ;
- l’atmosphère ;
- les nuages ;
- les particules ;
- les objets translucides ;
- les autres senseurs.

L’ellipsoïde sera toujours pris en compte dans les modes `ELLIPSOID` et `SCENE`, même si `scene.globe.show` est faux. L’ellipsoïde par défaut sera celui de la scène, sans constante WGS84 codée en dur.

Les objets hors du champ de la caméra principale devront pouvoir occulter un senseur. La profondeur de la caméra principale ne suffira donc pas à elle seule.

La configuration d’occlusion sera définie à la création du senseur et sera immutable. Toute modification de `occlusionMode` nécessitera de recréer ou de réenregistrer le senseur.

Les contrôles opérationnels resteront dynamiques :

- activation/désactivation du senseur ;
- affichage de la partie occultée ;
- pose ;
- portées ;
- matériau ;
- couleur et opacité.

### 18.5. Partie occultée et intersections

Par défaut :

```js
occlusionMode: OpenSensor.OcclusionMode.SCENE,
showOccludedVolume: false
```

La partie occultée pourra être affichée sans recalculer une seconde fois l’occlusion. Son matériau par défaut sera :

```js
{
  color: Cesium.Color.RED,
  opacity: 0.15
}
```

La ligne d’intersection sera activée par défaut :

```js
showIntersection: true
intersectionColor: Cesium.Color.WHITE
intersectionWidth: 5.0
```

La première version affichera les intersections avec l’ellipsoïde et le terrain. Les intersections avec les modèles et 3D Tiles seront ajoutées ultérieurement si le calcul d’occlusion fournit les informations nécessaires.

La partie visible, la partie occultée et la ligne d’intersection seront pickables et renverront la même identité logique de senseur avec une indication :

```text
visible
occluded
intersection
```

### 18.6. Dynamique et CZML

Les propriétés dynamiques sont :

- position ;
- orientation ;
- transformation de pose de l’Entity ;
- `minimumRadius` ;
- `maximumRadius` ;
- activation ;
- couleur ;
- opacité ;
- matériau ;
- `showOccludedVolume` ;
- intersection.

Le motif, `occlusionMode`, `occlusionQuality` et `occlusionPriority` sont statiques.

Le format CZML canonique sera une collection :

```json
{
  "openSensor_sensors": [
    {
      "id": "radar-front",
      "type": "conic"
    },
    {
      "id": "camera-nadir",
      "type": "rectangular"
    },
    {
      "id": "wide-pattern",
      "type": "customPattern"
    }
  ]
}
```

Les types autorisés sont :

```text
conic
rectangular
customPattern
```

Les identifiants sont uniques dans leur Entity. L’identité globale interne est composée de `entity.id` et `sensor.id`.

Les propriétés `openSensor_conicSensor`, `openSensor_rectangularSensor` et `openSensor_customPatternSensor` pourront éventuellement être conservées comme raccourcis pour un seul senseur, mais `openSensor_sensors` sera la structure de référence.

Les matériaux simples et le matériau d’atténuation seront configurables directement dans le CZML.

### 18.7. Matériaux

La première version supportera principalement :

- une couleur simple ;
- une opacité simple ;
- des matériaux spécialisés limités ;
- un matériau d’atténuation lié à la distance.

L’API de référence pour l’atténuation sera de cette forme :

```js
new OpenSensor.EnergyFalloffMaterial({
  color: Cesium.Color.WHITE,
  referenceDistance: 10.0,
  nearOpacity: 1.0,
  farOpacity: 0.0
})
```

La distance de référence est fixe, exprimée en mètres, et vaut `10.0` par défaut. L’opacité minimale est atteinte à `maximumRadius`. La loi sera une approximation visuelle liée à `1 / distance²`, bornée et normalisée pour éviter les instabilités près de l’origine.

Il ne s’agit pas encore d’une simulation électromagnétique complète. Une évolution future pourra ajouter un modèle radar simplifié avec atténuation, puissance, gain et sensibilité, sans modifier le socle d’occlusion géométrique.

### 18.8. Performance et gestionnaire de scène

Le cas de référence est de 400 satellites dynamiques chargés via CZML avec un senseur associé. La limite de conception est de 500 senseurs simultanés.

L’animation des senseurs doit rester fluide autour de 30 images/s dans une scène représentative. 60 images/s est un objectif lorsque le matériel et la scène le permettent.

Le système utilisera une mise à jour adaptative :

- priorité aux senseurs visibles ;
- suspension du recalcul d’occlusion pour les senseurs totalement hors écran ;
- recalcul prioritaire lorsqu’un senseur redevient visible ;
- réutilisation des résultats tant que la pose ou les données pertinentes n’ont pas suffisamment changé ;
- résolution et fréquence adaptatives.

Un `SensorSystem` sera associé à chaque `Scene` :

```js
const sensorSystem = new OpenSensor.SensorSystem({ scene });
```

Une installation automatique sera également fournie :

```js
const sensorSystem = OpenSensor.install(viewer);
```

Le système centralisera les ressources GPU, l’ordonnancement, la qualité et l’intégration Entity/CZML. Chaque senseur pourra cependant définir une priorité et une qualité propres, fixes après sa création.

La qualité globale et individuelle pourra utiliser :

```text
LOW
BALANCED
HIGH
AUTO
```

`AUTO` sera la valeur par défaut.

L’occlusion sera rasterisée et approximée par la résolution GPU. Elle sera exacte au niveau du modèle de ligne de visée, mais pas nécessairement au pixel près.

### 18.9. Scènes et backend graphique

Le backend officiel initial sera WebGL 2, comme CesiumJS.

Le plugin devra fonctionner en 3D. Le support 2D, Columbus View et morphing sera fourni si le prototype montre qu’il reste raisonnable ; sinon, la garantie officielle sera limitée à la 3D avec un comportement dégradé documenté.

L’API publique ne devra pas dépendre directement de WebGL. Un backend WebGPU pourra être ajouté ultérieurement si CesiumJS le supporte officiellement.

Le benchmark principal utilisera Brave, basé sur Chromium, en WebGL 2, à 1920×1080, avec une scène de 500 satellites/senseurs et un terrain/modèles représentatifs.

### 18.10. Intégration et cycle de vie

Les primitives directes seront ajoutées à `scene.primitives` et détruites par leur propriétaire. Le `SensorSystem` détruira uniquement les ressources qu’il possède.

Le plugin supportera `requestRenderMode` et demandera explicitement un rendu lorsque l’état visuel ou les données d’occlusion changent.

Les erreurs CZML seront tolérées par senseur : un senseur invalide sera ignoré, les autres continueront à se charger. `SensorSystem.errorEvent` fournira les erreurs structurées :

```js
{
  entityId,
  sensorId,
  property,
  code,
  message,
  cause
}
```

### 18.11. Outillage et qualité

La chaîne de développement suivra les conventions CesiumJS :

```text
Gulp       orchestration des tâches
esbuild    bundling lorsque nécessaire
Jasmine    tests unitaires
Karma      exécution des tests dans les navigateurs
Playwright tests WebGL, end-to-end et visuels
JSDoc      documentation API
tsd-jsdoc  déclarations TypeScript
ESLint     analyse statique
Prettier   formatage
```

Le code principal sera écrit en JavaScript ES modules avec JSDoc. CesiumJS sera une `peerDependency`, avec `cesium` comme intégration principale et `@cesium/engine` comme cible secondaire.

### 18.12. Limite de portée scientifique

La version initiale ne fera pas de simulation électromagnétique complète. Elle implémentera une visibilité géométrique depuis l’origine du senseur, avec surfaces opaques bloquantes.

Une future évolution pourra ajouter un modèle de propagation électromagnétique simplifié, notamment pour le radar, avec atténuation, énergie, gain, sensibilité ou propriétés de matériau. La diffraction, les interférences, la pénétration des matériaux et la résolution complète des équations de Maxwell sont hors périmètre initial.

### 18.13. Prototype obligatoire avant implémentation complète

Avant de migrer tout le plugin, un prototype devra démontrer :

1. le rendu d’un volume depuis une origine de senseur ;
2. l’occlusion par l’ellipsoïde ;
3. l’occlusion par terrain ;
4. l’occlusion par modèle ou 3D Tiles hors champ de la caméra principale ;
5. l’absence d’occlusion par imagerie, transparence et autres senseurs ;
6. la mutualisation pour plusieurs senseurs ;
7. une charge représentative de 400 à 500 senseurs ;
8. le comportement adaptatif `AUTO` ;
9. le respect de `requestRenderMode` ;
10. la libération correcte des ressources GPU.

Le prototype pourra modifier l’algorithme interne, la résolution ou la fréquence de calcul, mais ne devra pas modifier les décisions fonctionnelles validées sans nouvelle décision de cadrage.

---

## 19. Dossier documentaire associé

Le PDF est le fil rouge du cadrage. Les documents opérationnels détaillent les décisions et doivent être maintenus avec le code :

```text
docs/
  README.md
  decisions/
    ADR-0001-architecture.md
    ADR-0002-occlusion.md
    ADR-0003-czml-schema.md
    ADR-0004-build-tests.md
  api/
    open-sensor-api.md
    czml-schema.md
  technical/
    occlusion-prototype.md
  testing/
    test-plan.md
  performance/
    benchmark-protocol.md
  materials.md
  migration-from-legacy.md
  compatibility-matrix.md
  release-process.md
  glossary.md
```

Les documents de gouvernance sont à la racine :

```text
CONTRIBUTING.md
CHANGELOG.md
SECURITY.md
```

Toute évolution de l’API ou des garanties doit mettre à jour le document spécialisé correspondant et, si nécessaire, un ADR.

