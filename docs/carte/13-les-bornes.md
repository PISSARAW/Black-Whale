---
titre: Les bornes
etage: 1
couvre:
  - eslint.config.js
  - .claude/hooks/enforce-limits.mjs
  - scripts/check-ratchet.test.ts
depend-de: []
revu-le: 2026-08-05
empreinte: 3985e10
decisions: []
---

# Les bornes

> Le cliquet et les limites du dépôt. Ne réexplique rien, renvoie à `CLAUDE.md` et ADR-002.

## Le trajet

`scripts/check-ratchet.test.ts` (vérification) ← `eslint.config.js` (règles) ← `.claude/hooks/enforce-limits.mjs` (exécution).

## Les frontières

| Ce dossier …     | Règle |
| ---------------- | ----- |
| importe          | Rien d'applicatif. Outils de linting uniquement. |
| n'importe jamais | Le code métier. |
| est importé par  | La CI et les hooks de pre-commit. |

## Les faits qui ne se lisent pas dans le code

- Le cliquet de complexité (ratchet mechanism) ne permet jamais à la complexité globale ou à la taille des fichiers de reculer. 
- La règle des 500 lignes est stricte. Les fichiers générés sont les seules exceptions.

## Les pièges

- Désactiver ESLint localement pour contourner la limite de lignes. La CI (`check-ratchet`) échouera systématiquement.

## Par où entrer

| Je veux … | J'ouvre |
| --------- | ------- |
| comprendre l'esprit des bornes | `CLAUDE.md` |
| voir les limites exactes | `eslint.config.js` |

## Vérifier

pnpm lint
pnpm test:ratchet
