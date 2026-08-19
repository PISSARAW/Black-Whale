---
titre: Admin App
etage: 2
couvre:
  - apps/admin/**
depend-de: [10-l-admin]
revu-le: 2026-08-20
empreinte: pending
decisions: []
---

# `apps/admin` — Interface d'administration

**Promet :** Les outils pour modérer et configurer le jeu.
**Refuse :** Le rendu du jeu ou les interactions normales des joueurs.
**Entrée publique :** `src/routes/**`
**Carte :** [10 l'admin](../../docs/carte/10-l-admin.md)

## Découpage

| Groupe | Fichiers | Responsabilité |
| --- | --- | --- |
| Dashboard | `src/routes/**` | Vues d'administration |
| Lib | `src/lib/**` | Composants internes de l'admin |

## Invariants

- L'accès est strictement réservé aux sessions administrateurs.

## Ajouter quelque chose ici

Consulter [10 l'admin](../../docs/carte/10-l-admin.md).
