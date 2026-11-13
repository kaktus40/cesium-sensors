# Coût des requêtes de visibilité

## Statut

Document établi le 13 novembre 2026. A compléter après benchmark réel (P2 de la TODO).

## Objectif

Mesurer le coût de `sensorSystem.getSensorsSeeing(target)` en fonction du nombre de senseurs, de la complexité des motifs, et du mode d'occlusion.

## Configuration de référence

- Cible : 500 senseurs (coniques, rectangulaires, motifs personnalisés).
- Scène : 500 satellites CZML (`Specs/fixtures/benchmark-500.czml`).
- Navigateur : Brave / Chromium, WebGL 2, 1920×1080.
- Chaque appel : une seule cible (une Entity ou un point).

## Scénarios

1. 1 senseur, 1 appel ;
2. 100 senseurs, 1 appel ;
3. 400 senseurs, 1 appel ;
4. 500 senseurs, 1 appel ;
5. 500 senseurs, 10 appels consécutifs (cache) ;
6. 500 senseurs dont 80 % hors écran (culling) ;
7. motifs personnalisés complexes (10 directions) ;
8. mode `ELLIPSOID` vs `SCENE` (quand le terrain/modèles seront disponibles) ;
9. appels fréquents (10 Hz) pendant 10 secondes.

## Données à enregistrer

- nombre de senseurs évalués ;
- temps CPU total par appel (ms) ;
- temps CPU par senseur (µs) ;
- temps par phase : résolution cible, direction, intersection volume, occlusion ;
- nombre de senseurs exclus (show: false, position indisponible) ;
- taux de cache (si mise en œuvre) ;
- FPS pendant une session d'appels ;
- mémoire GPU (si une passe d'occlusion est ajoutée) ;
- erreurs de validation.

## Critères de réussite

- Un appel sur 500 senseurs doit terminer en dessous de **50 ms** en mode `ELLIPSOID` (geometric only).
- L'appel ne doit pas impacter le rendu de la scène au-dessus de **2 FPS** dans la scène de référence.
- Le coût doit croître de manière **linéaire** (ou sous-linéaire avec culling) avec le nombre de senseurs.
- Aucune fuite mémoire après 1000 appels consécutifs.

## Stratégies d'optimisation (à valider)

1. **Culling par frustum caméra** : exclure les senseurs totalement hors du champ de la caméra principale. Limitation : un senseur peut voir une cible hors caméra (cas d'usage supporté par l'ADR-0002). Cette optimisation ne doit pas être appliquée par défaut, ou doit être explicitement activée par option.
2. **Culling par distance** : exclure les senseurs dont le volume est trop éloigné de la cible (bounding sphere). Sans impact sur la sémantique si la cible est hors de tout volume.
3. **Cache par pose** : réutiliser le résultat tant que la pose des senseurs et la position de la cible n'ont pas changé. Invalider sur changement de caméra, de cible, ou de senseur.
4. **Mise à jour échelonnée** : pour les appels fréquents, ne recalculate qu'un sous-ensemble des senseurs par frame (voir ADR-0002, stratégie C).
5. **Résolution adaptative** : réduire la précision de l'occlusion (ellipsoïde toujours exacte) selon la qualité du senseur (`occlusionQuality`).

## Règles

- Toute optimisation qui modifie la sémantique du résultat doit faire l'objet d'une option explicite ou d'un ADR.
- Les benchmarks doivent être exécutés au moins trois fois après stabilisation de la scène. Les valeurs retenues seront la médiane et le pire résultat observé.
- Tout changement d'algorithme doit comparer le coût et la précision, pas seulement les FPS.