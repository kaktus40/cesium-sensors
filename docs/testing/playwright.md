# Configuration Playwright

## Objectif

Playwright sera utilisé pour les tests de rendu WebGL 2, les tests end-to-end et les captures visuelles.

## Navigateur principal

Le benchmark de référence utilise Brave, basé sur Chromium. La CI peut utiliser Chromium si Brave n’est pas disponible, mais le rapport doit mentionner le navigateur réellement utilisé.

## Séparation des tests

- tests locaux : aucune ressource réseau ;
- tests d’intégration : terrain ou 3D Tiles explicitement configurés ;
- tests de performance : exécution séparée des tests visuels ;
- tests de compatibilité : matrice navigateur dédiée.

## Captures

Les captures doivent couvrir :

- senseur visible ;
- senseur occulté par l’ellipsoïde ;
- senseur occulté par terrain ;
- senseur occulté par modèle opaque ;
- objet translucide ignoré ;
- autre senseur ignoré ;
- partie occultée affichée avec son matériau rouge translucide ;
- intersection visible ;
- scène 2D/3D si le prototype les valide.

## Conditions de test

Chaque test visuel doit fixer :

- la taille de la fenêtre ;
- la caméra ;
- l’état de l’horloge ;
- la qualité d’occlusion ;
- l’état du chargement des ressources ;
- la tolérance de comparaison.
