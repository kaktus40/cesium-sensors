# Fixtures de benchmark

Les fixtures de cette répertoire sont générées et ne doivent pas contenir de token Cesium ion.

## Générer le scénario de référence

```bash
npm run generate:benchmark-fixture
```

Le fichier produit est :

```text
Specs/fixtures/benchmark-500.czml
```

Il contient 500 satellites animés avec un senseur conique `openSensor_sensors` chacun.

## Usage prévu

Le scénario sert à mesurer :

- le chargement CZML ;
- la mise à jour des positions et orientations ;
- le coût des 500 senseurs ;
- le comportement adaptatif du `SensorSystem` ;
- le rendu avec `requestRenderMode`.

Les données géométriques du terrain et des 3D Tiles seront ajoutées dans les tests Playwright, séparément du fichier CZML, afin de garder la fixture déterministe et sans dépendance réseau.
