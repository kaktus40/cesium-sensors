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

## État du prototype au 14 novembre 2026

- Phases P0, P1 et P2 terminées (voir `docs/TODO.md`) ;
- `npm run build` fonctionne (gulpfile.cjs + esbuild, produit `dist/open-sensor.js`) ;
- `npm test` : 37/37 tests unitaires passent ;
- `npm run test:e2e` : 7/7 tests e2e Playwright passent ;
- `npm run lint` : 0 erreur (eslint.config.js flat configuré) ;
- `npm run docs` (JSDoc) génère la documentation sans erreur ;
- `scripts/benchmark-getsensorsseeing.mjs` : 0.023/0.132/0.225/0.212 ms pour 1/100/400/500 senseurs.

### P0 — prototype visuellement vérifiable (terminé)
- `prototype/minimal.html` + `prototype/minimal.js` : scène minimale (1 capteur, caméra fixe, pas de 500 satellites, pas de fond atmosphérique) ;
- Boutons occlusion ON/OFF avec captures `test-results/minimal-occlusion-on.png` / `minimal-occlusion-off.png` ;
- `tests/e2e/minimal.spec.js` : 3 tests Playwright (capture OFF, capture ON, pas d'erreur shader WebGL).

### P1 — contrôles développeur fiables (terminé)
- `eslint.config.js` : configuration flat ESLint 10 pour modules ESM, globals Cesium/Jasmine ;
- Nettoyage code : imports inutilisés supprimés, code mort supprimé (SensorGeometry.js) ;
- `docs/compatibility-matrix.md` : résultats réels (CesiumJS 1.147.0, Node 26.13.0, Chromium/SwiftShader).

### P2 — occlusion de scène (terminé)
- `docs/P2-occlusion-scene-api-research.md` : APIs CesiumJS étudiées (Globe.pick, Scene.sampleHeight/clampToHeight, versions MostDetailed, Cesium3DTileset.getHeight) ;
- Stratégie d'occlusion décidée : terrain via `globe.pick()`/`sampleHeightMostDetailed()`, 3D Tiles opaques via passe de profondeur dédiée, ellipsoïde via `ellipsoidOcclusion()` CPU ;
- Corrigé bug `ellipsoidOcclusion` (tmpCartesian réutilisé) + ajout `tmpCartesianC` ;
- 6 tests déterministes ajoutés dans `Specs/SensorOcclusionSpec.js` (rayon traversant, s'éloignant, origine à l'intérieur, etc.) ;
- Documenté les limites du test ellipsoïde dans le JSDoc.

### P3 — hygiène de projet (en cours)
- Build fonctionnel avec esbuild ;
- JSDoc opérationnel après correction des annotations ;
- Vulnérabilités dépendances à traiter (voir `npm audit`) ;
- README et plan de reprise à réviser.

Les fixtures terrain et 3D Tiles restent à préparer dans Playwright. La capture Playwright ne montre pas encore clairement le cône (scène minimale sans globe). Le test actuel confirme la compilation/exécution sans erreur, mais ne prouve pas la présence visible du cône ni la différence pixel entre occlusion activée et désactivée.

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
