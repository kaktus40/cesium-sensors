# Contribuer à `open-sensor`

## Avant de coder

- lire le dossier de cadrage ;
- consulter le registre des décisions ;
- vérifier les ADR concernés ;
- créer un ticket avec critères d’acceptation ;
- ne pas modifier l’API publique sans ADR ou mise à jour de la spécification.

## Développement

- JavaScript ES modules ;
- JSDoc pour toute API publique ;
- ESLint et Prettier ;
- aucun accès Cesium privé sans isolation documentée ;
- aucun `TODO` non suivi ;
- tests fournis avec chaque comportement ;
- pas de secret ou token dans les fixtures.

## Tests obligatoires

```bash
npm run lint
npm test
npm run test:e2e
npm run benchmark
```

Les scripts exacts seront ajoutés pendant la phase d’outillage.

## Pull requests

Une pull request doit indiquer :

- le problème traité ;
- l’ADR ou la décision concernée ;
- les tests ajoutés ;
- l’impact performance ;
- l’impact documentation ;
- les changements d’API ou CZML.

Les changements de shader doivent fournir une capture avant/après lorsque le rendu est concerné.

## API expérimentale

Toute API expérimentale doit être marquée dans JSDoc et dans la documentation. Elle ne doit pas être présentée comme stable avant validation du prototype et des tests.
