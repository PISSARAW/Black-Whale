---
titre: Ajouter une route web
etage: 1
couvre:
  - apps/web/src/routes/**
depend-de: [09-la-facade-web]
revu-le: 2026-08-20
empreinte: pending
decisions: []
---

# Ajouter une route web

1. Créer le dossier de la route dans `apps/web/src/routes/<chemin>`.
2. Ajouter le fichier `+page.svelte` pour la vue de la route.
3. Ajouter `+page.server.ts` pour le chargement des données (`load`) et définir les limites de spoiler éventuelles.
4. Vérifier le formatage et le typage :
   `pnpm --filter @black-whale/web check`
