---
titre: Web App
etage: 2
couvre:
  - apps/web/**
depend-de: [09-la-facade-web]
revu-le: 2026-08-20
empreinte: pending
decisions: []
---

# `apps/web` — Application Web

**Promet :** L'interface utilisateur, le rendu client (visite, modes) et le serveur SSR frontal.
**Refuse :** L'administration directe ou la mutation de l'état global du canon.
**Entrée publique :** `apps/web/src/routes/**`
**Carte :** [09 la facade web](../../docs/carte/09-la-facade-web.md)

## Découpage

| Groupe | Fichiers                     | Responsabilité                            |
| ------ | ---------------------------- | ----------------------------------------- |
| Routes | `apps/web/src/routes/**`     | Pages SvelteKit, load() et actions        |
| Lib    | `apps/web/src/lib/**`        | Composants, logique partagée, tour, modes |
| Server | `apps/web/src/lib/server/**` | Frontière serveur, actions sécurisées     |

## Invariants

- Le serveur de façade (SvelteKit load/actions) est le seul point de confiance pour valider les données de la session.

## Ajouter quelque chose ici

Consulter [09 la facade web](../../docs/carte/09-la-facade-web.md).
