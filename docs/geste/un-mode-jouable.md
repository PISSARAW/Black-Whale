---
titre: Ajouter un mode jouable
etage: 1
couvre:
  - apps/web/src/lib/<mode>/**
  - apps/web/src/routes/<mode>/**
depend-de: [07-les-modes]
revu-le: 2026-08-20
empreinte: pending
decisions: []
---

# Ajouter un mode jouable

1. Créer le dossier du mode dans `apps/web/src/lib/<mode>/`.
2. Y définir les règles du mode selon le patron (ex: `apps/web/src/lib/<mode>/rules.ts`).
3. Créer la route d'entrée dans `apps/web/src/routes/<mode>/+page.svelte` et `+page.server.ts`.
4. Documenter le contrat du mode dans `apps/web/src/lib/<mode>/README.md`.
5. Lancer les tests pour valider le chargement du mode :
   `pnpm --filter @black-whale/web test <mode>/`
