# open-sensor

Plugin open source de volumes de senseurs pour CesiumJS.

## Statut

Le projet est en phase de reprise architecturale. La version `0.1.0` rompra volontairement avec l’ancien plugin `cesium-sensors`.

Les objectifs sont :

- senseurs coniques, rectangulaires et à motifs personnalisés ;
- primitives directes et intégration Entity/CZML ;
- occlusion de ligne de visée depuis l’origine du senseur ;
- prise en compte de l’ellipsoïde, du terrain et des objets opaques ;
- support de plusieurs centaines de senseurs dynamiques ;
- rendu WebGL 2 aligné sur CesiumJS.

La documentation de cadrage et les décisions validées sont dans [docs/README.md](docs/README.md).

## Préparation locale

Le projet retient Node.js `26.13.0` :

```bash
nvm use
npm run preflight
```

Les dépendances sont installées pour le prototype avec CesiumJS `1.147.0`. L’état détaillé et les limites de validation figurent dans [le pré-vol](docs/preflight.md).

## Développement

Les scripts sont opérationnels :

```bash
npm run build        # bundle esbuild -> dist/open-sensor.js
npm test             # 37 tests unitaires Jasmine (37/37 passent)
npm run test:e2e     # 7 tests Playwright (7/7 passent)
npm run lint         # ESLint flat config, 0 erreur
npm run docs         # JSDoc (génère la documentation API)
npm run benchmark    # benchmark getSensorsSeeing (1/100/400/500 senseurs)
```

Le prototype GPU est dans `prototype/` et le nouveau code source dans `src/`. Il compile sous Chromium/SwiftShader.

État des phases de reprise (voir `docs/TODO.md`) :

- **P0** — prototype visuellement vérifiable : terminé (scène minimale, boutons occlusion ON/OFF, captures, tests e2e).
- **P1** — contrôles développeur fiables : terminé (ESLint flat, nettoyage code, matrice compatibilité).
- **P2** — occlusion de scène : terminé (APIs CesiumJS étudiées, stratégie décidée, cas déterministes, benchmark < 1 ms pour 500 senseurs).
- **P3** — hygiène de projet : en cours (build, JSDoc, vulnérabilités, révision docs).

## Licence

Apache 2.0. Voir [LICENSE.md](LICENSE.md).

## Ancienne implémentation

L’ancienne implémentation est conservée dans la branche Git `legacy/cesium-sensors-legacy`. Elle sert uniquement de référence historique et de comparaison.
