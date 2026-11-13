# ADR-0004 — Build, tests et qualité

## Statut

Accepté.

## Décision

La chaîne reprend les conventions actuelles de CesiumJS, en restant plus petite :

```text
Gulp       orchestration
esbuild    bundling lorsque nécessaire
Jasmine    tests unitaires
Karma      exécution navigateur des tests unitaires
Playwright tests WebGL, end-to-end et visuels
JSDoc      documentation API
tsd-jsdoc  déclarations TypeScript
ESLint     analyse statique
Prettier   formatage
```

Le code principal sera en JavaScript ES modules avec JSDoc. `cesium` sera une `peerDependency` principale ; `@cesium/engine` sera une cible secondaire.

## CI minimale

Chaque changement doit exécuter :

1. formatage et lint ;
2. tests Jasmine/Karma ;
3. build ESM ;
4. génération de documentation ;
5. tests Playwright ciblés ;
6. benchmark de fumée pour les scènes de senseurs.

## WebGPU

WebGL 2 est le backend initial. WebGPU ne sera ajouté que si CesiumJS le supporte officiellement.
