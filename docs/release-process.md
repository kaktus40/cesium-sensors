# Processus de publication

## Avant une release

1. mettre à jour CesiumJS dans la matrice de compatibilité ;
2. exécuter lint, formatage et tests Jasmine/Karma ;
3. exécuter Playwright et les captures visuelles ;
4. exécuter les benchmarks 400/500 senseurs ;
5. générer la documentation et les déclarations TypeScript ;
6. vérifier les licences ;
7. mettre à jour `CHANGELOG.md` ;
8. vérifier l’absence de fichiers temporaires ou secrets ;
9. créer un tag de version ;
10. publier le package npm.

## Versionnement

- `0.x` : API en stabilisation ;
- `1.0.0` : API et CZML stables ;
- major : rupture d’API ou de schéma CZML ;
- minor : fonctionnalité compatible ;
- patch : correction compatible.

## Artefacts

Une release doit contenir :

- package ESM ;
- bundle éventuel de compatibilité si décidé ;
- déclarations TypeScript ;
- documentation API ;
- changelog ;
- matrice de compatibilité ;
- exemples reproductibles.
