# Pré-vol de reprise `open-sensor`

## État

Préparé le 12 novembre 2026.

## Branches

- branche d’archive : `legacy/cesium-sensors-legacy` ;
- branche de préparation : `open-sensor/bootstrap` ;
- aucun commit automatique n’a été créé ;
- les modifications locales existantes sont conservées.

## État local à préserver

Les éléments suivants étaient déjà présents avant la reprise :

- `Build/Unminified/CesiumSensors.js` modifié ;
- `.tmp/` non suivi ;
- `pnpm-lock.yaml` non suivi.
- `Source/main.js` et `Build/MinifiedShaders/` sont des artefacts historiques ignorés par Git.
- `package-lock.json` a été régénéré avec Node `26.13.0` et le package `open-sensor`.

Ils ne doivent pas être mélangés au nouveau code sans décision explicite.

## Outils détectés

- Node.js LTS retenu pour le projet : `v26.13.0` via `.nvmrc` ;
- npm avec Node LTS : `12.2.1` ;
- Brave : `/usr/bin/brave` ;
- Chromium : `/usr/bin/chromium`.

Le shell de contrôle initial utilisait `v27.0.0-alpha.0.0.0`; le projet retient désormais `v26.13.0`, disponible localement et compatible avec la contrainte CesiumJS `Node >=22`.

La cible CesiumJS enregistrée dans le nouveau `package.json` est `1.147.0`, avec une peer dependency limitée à la série `1.147.x` jusqu’à validation d’une autre release.

## État du prototype au 12 novembre 2026

- préparer les fixtures terrain, modèles et CZML ;
- configurer un token de test hors dépôt si des données Cesium ion sont utilisées ;
- valider visuellement le volume dans la scène ;
- confirmer que l’uniforme d’occlusion change effectivement les pixels ;
- établir une scène d’essai déterministe pour l’ellipsoïde ;
- ajouter ESLint flat config ou sélectionner une version ESLint cohérente.

Le lockfile a été régénéré et les dépendances sont installées localement avec CesiumJS `1.147.0`. Le script `npm run preflight` passe avec Node `26.13.0`.

Le registre npm ne contient pas actuellement de package `open-sensor` (`404 Not Found`), ce qui laisse le nom disponible pour la future publication.

La fixture CZML synthétique de 500 satellites est maintenant générée par `npm run generate:benchmark-fixture` dans `Specs/fixtures/benchmark-500.czml`. Les fixtures terrain et 3D Tiles restent à préparer dans Playwright.

Le Viewer de prototype et ses tests Playwright sont en place. Chromium système (`/usr/bin/chromium`) confirme le chargement des 500 Entities, l’ajout du primitive et le passage du shader dans le pipeline de rendu. Le chemin peut être remplacé via `PLAYWRIGHT_CHROMIUM_EXECUTABLE`.

Le prototype contient un primitive conique expérimental construit avec les API publiques `Primitive`, `GeometryInstance`, `CylinderGeometry` et `Appearance`. Un shader fragment teste une intersection de rayon avec l’ellipsoïde et dispose d’un uniforme `u_ellipsoidOcclusion`. Le test e2e bascule cet uniforme et vérifie qu’aucune boîte d’erreur de rendu Cesium n’apparaît.

**Limite connue :** la capture Playwright ne montre pas encore clairement le cône. Le test actuel confirme la compilation/exécution sans erreur, mais ne prouve ni la présence visible du cône ni la différence pixel entre occlusion activée et désactivée. Ne pas présenter cette étape comme une validation visuelle ou comme une occlusion achevée.

La commande `npm run test:e2e` passe avec 3 tests sous Node `26.13.0`, Chromium système et SwiftShader. La capture de diagnostic est `test-results/conic-sensor-prototype.png`; elle est générée localement et n’est pas une référence visuelle validée.

La commande `npm run lint` échoue avant l’analyse : ESLint `10.14.0` est installé mais aucune configuration `eslint.config.*` n’existe. Le script de lint doit être réparé avant de considérer le contrôle qualité prêt.

Les dépendances sont installées localement avec CesiumJS `1.147.0`; `npm run preflight` passe avec Node `26.13.0`. Le cadrage de caméra du prototype a été modifié pendant l’investigation et reste à stabiliser.

La résolution npm signale 8 vulnérabilités dans les dépendances d’outillage historiques ou de développement. L’audit de production (`npm audit --omit=dev`) ne signale aucune vulnérabilité. Ces dépendances devront être traitées avant la CI et la publication, sans utiliser automatiquement `npm audit fix --force`.

## Règles de sécurité

- ne pas commiter de token Cesium ion ;
- ne pas supprimer `.tmp/` sans inspection ;
- ne pas écraser les bundles historiques ;
- ne pas modifier les références Git historiques ;
- ne pas publier le package avant validation de l’API et de la licence.

## Critère de sortie du pré-vol

Le pré-vol sera considéré comme terminé lorsque la version CesiumJS, la version Node LTS, les fixtures et la scène benchmark seront enregistrées dans `compatibility-matrix.md`, que le prototype sera reproductible, que le cône sera visuellement vérifié et que le lint sera opérationnel.

## Reprise

Consulter [TODO — reprise du prototype](TODO.md) et le [journal du 12 novembre 2026](work-log/2026-11-12.md) avant de reprendre le code.
