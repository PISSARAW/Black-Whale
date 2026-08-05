---
titre: Données du canon
etage: 2
couvre:
  - data/**
depend-de: [01-le-canon, 11-les-donnees]
revu-le: 2026-08-05
empreinte: 000000
decisions: [adr-001, adr-006]
---

# `data/` — données du canon

**Promet :** être la seule source de vérité pour les faits du monde (personnages,
événements, capacités, plan du navire).
**Refuse :** de contenir du code, du rendu ou des dérivés calculés.
**Entrée publique :** chaque sous-dossier expose ses fichiers JSON (`abilities/*.json`,
`characters/*.json`, etc.).
**Carte :** [01 le canon](../docs/carte/01-le-canon.md)

## Découpage

| Dossier | Contenu |
| ------- | ------- |
| `abilities/` | Déclarations des capacités et Hatsu |
| `characters/` | Fiches de personnages |
| `chapters/` | Captions et événements par chapitre |
| `events/` | Événements narratifs référencés par les chapitres |
| `factions/` | Groupes et organisations |
| `locations/` | Lieux du monde |
| `ship/` | Plan du navire (`blueprint.json`) |
| `prophecies/` | Prophéties et divinations |

## Invariants

- Tout fait a une source canonique — `CONVENTIONS.md`.
- Aucun JSON ne contient de logique dérivée : il est lu et compilé.
- `packages/contracts` valide les schémas via `canon-lint`.

## Ajouter quelque chose ici

- Pour un nouveau personnage : ajouter un JSON dans `characters/` puis relancer `pnpm canon-lint`.
- Pour une nouvelle salle : voir `docs/geste/une-salle.md`.
