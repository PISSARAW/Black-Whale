---
titre: Données du canon
etage: 2
couvre:
  - data/**
depend-de: [01-le-canon, 11-les-donnees]
revu-le: 2026-08-05
empreinte: 713340f
decisions: [adr-001, adr-006]
---

# `data/` — données du canon

**Promet :** être la seule source de vérité pour les faits du monde (personnages,
événements, capacités, plan du navire).
**Refuse :** de contenir du code, du rendu ou des dérivés calculés.
**Entrée publique :** chaque sous-dossier expose ses fichiers JSON (`data/abilities/*.json`,
`data/characters/*.json`, etc.).
**Carte :** [01 le canon](../docs/carte/01-le-canon.md)

## Découpage

| Dossier            | Contenu                                           |
| ------------------ | ------------------------------------------------- |
| `data/abilities/`  | Déclarations des capacités et Hatsu               |
| `data/characters/` | Fiches de personnages                             |
| `data/chapters/`   | Captions et événements par chapitre               |
| `data/events/`     | Événements narratifs référencés par les chapitres |
| `data/factions/`   | Groupes et organisations                          |
| `data/locations/`  | Lieux du monde                                    |
| `data/ship/`       | Plan du navire (`data/ship/blueprint.json`)       |
| `data/prophecies/` | Prophéties et divinations                         |

## Invariants

- Tout fait a une source canonique — `data/CONVENTIONS.md`.
- Aucun JSON ne contient de logique dérivée : il est lu et compilé.
- `packages/contracts` valide les schémas via `canon-lint`.

## Ajouter quelque chose ici

- Pour un nouveau personnage : ajouter un JSON dans `data/characters/` puis relancer `pnpm canon-lint`.
- Pour une nouvelle salle : voir `docs/geste/une-salle.md`.
