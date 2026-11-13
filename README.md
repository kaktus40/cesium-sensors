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

Les scripts prévus sont :

```bash
npm run build
npm test
npm run test:e2e
npm run docs
npm run benchmark
```

Le prototype GPU est en cours dans `prototype/` et `src/`. Il compile actuellement sous Chromium/SwiftShader, mais la visibilité du cône et l’effet pixel de l’occlusion restent à valider. Voir [la todo de reprise](docs/TODO.md).

## Licence

Apache 2.0. Voir [LICENSE.md](LICENSE.md).

## Ancienne implémentation

L’ancienne implémentation est conservée dans la branche Git `legacy/cesium-sensors-legacy`. Elle sert uniquement de référence historique et de comparaison.
