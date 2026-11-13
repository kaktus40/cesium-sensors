# Documentation `open-sensor`

## Point d’entrée

- [Dossier de cadrage](plan-reprise-cesium-sensors.md)
- [PDF du dossier de cadrage](plan-reprise-cesium-sensors.pdf)
- [Todo de reprise](TODO.md)
- [Journal de travail](work-log/2026-11-12.md)
- [Journal de travail — 13 novembre 2026](work-log/2026-11-13.md)

## Décisions d’architecture

- [ADR-0001 — Architecture](decisions/ADR-0001-architecture.md)
- [ADR-0002 — Occlusion](decisions/ADR-0002-occlusion.md)
- [ADR-0003 — Schéma CZML](decisions/ADR-0003-czml-schema.md)
- [ADR-0004 — Build et tests](decisions/ADR-0004-build-tests.md)
- [ADR-0005 — Requête de visibilité `getSensorsSeeing`](decisions/ADR-0005-visibility-query.md)

## API et formats

- [API JavaScript](api/open-sensor-api.md)
- [Schéma CZML](api/czml-schema.md)
- [Matériaux](materials.md)
- [Migration depuis l’ancien plugin](migration-from-legacy.md)
- [Matrice de compatibilité](compatibility-matrix.md)
- [Glossaire](glossary.md)
- [Requête de visibilité](queries/visibility-query.md)

## Chantier technique

- [Prototype d’occlusion](technical/occlusion-prototype.md)
- [Plan de tests](testing/test-plan.md)
- [Scènes de test](testing/scene-fixtures.md)
- [Configuration Playwright](testing/playwright.md)
- [Protocole de benchmark](performance/benchmark-protocol.md)
- [Coût des requêtes de visibilité](performance/queries.md)
- [Processus de publication](release-process.md)

## Règle de maintenance

Toute décision qui modifie l’API, le schéma CZML, la sémantique d’occlusion ou les garanties de performance doit mettre à jour le document concerné et, si nécessaire, un ADR.