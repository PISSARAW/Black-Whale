---
titre: Ajouter une migration
etage: 1
couvre:
  - packages/database/prisma/migrations/**
  - packages/database/prisma/schema.prisma
depend-de: [11-les-donnees, 12-l-exploitation]
revu-le: 2026-08-20
empreinte: pending
decisions: []
---

# Ajouter une migration

1. Modifier le schéma dans `packages/database/prisma/schema.prisma`.
2. Générer la migration avec :
   `pnpm --filter @black-whale/database prisma migrate dev --name <nom_migration>`
3. Mettre à jour les contrats associés dans `packages/contracts/` si le schéma public change.
4. Vérifier la validité des dépendances et de la base avec :
   `pnpm --filter @black-whale/database test`
