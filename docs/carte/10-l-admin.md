---
titre: L'admin
etage: 1
couvre:
  - apps/admin/**
  - apps/admin/src/routes/**
depend-de: []
revu-le: 2026-08-05
empreinte: 588f913
decisions: []
---

# L'admin

> Le back-office d'administration et les sessions signées. La seule zone qui écrit hors de `data/`.

## Le trajet

`apps/admin/src/routes/+layout.server.ts` (session signée) → `apps/admin/src/routes/api/characters/+server.ts` → Écriture persistante.

## Les frontières

| Ce dossier …     | Règle |
| ---------------- | ----- |
| importe          | Les contrats partagés (`packages/contracts`) et les outils d'authentification. |
| n'importe jamais | Le code spécifique au client web (jeux, modes, visite). |
| est importé par  | Personne. C'est une application isolée. |

## Les faits qui ne se lisent pas dans le code

- Les sessions d'administration requièrent une signature cryptographique forte, pas juste un JWT standard.
- C'est la seule application autorisée à muter l'état global du serveur en dehors du flux canonique des événements.

## Les pièges

- Exposer une route API d'administration sans valider la signature de session. Tout endpoint doit passer par le middleware de sécurité.

## Par où entrer

| Je veux … | J'ouvre |
| --------- | ------- |
| ajouter un panneau de contrôle | `apps/admin/src/routes/characters/` |
| modifier la validation de session | `apps/admin/src/lib/server/session.ts` |

## Vérifier

pnpm --filter @black-whale/admin test
