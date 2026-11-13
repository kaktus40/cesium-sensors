# Matériaux `open-sensor`

## Périmètre initial

La première version ne supporte pas arbitrairement tous les matériaux Cesium. Elle privilégie des matériaux regroupables pour préserver les performances avec 500 senseurs.

## Matériau couleur

```js
{
  color: Cesium.Color.WHITE,
  opacity: 0.5
}
```

## Matériau occulté

```js
{
  color: Cesium.Color.RED,
  opacity: 0.15
}
```

## `EnergyFalloffMaterial`

```js
new OpenSensor.EnergyFalloffMaterial({
  color,
  referenceDistance: 10.0,
  nearOpacity: 1.0,
  farOpacity: 0.0
})
```

Le matériau utilise une décroissance visuelle bornée liée à `1 / distance²`. `referenceDistance` est indépendante de `minimumRadius`. L’opacité minimale est atteinte à `maximumRadius`.

## Contraintes

- les matériaux doivent fonctionner avec la transparence Cesium ;
- les changements de couleur et d’opacité doivent éviter les recompilations inutiles ;
- les matériaux spécialisés doivent être groupables lorsque possible ;
- un matériau arbitraire avec shader propre est hors périmètre `0.1.0`.
