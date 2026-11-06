---
titre: Traductions publiques
etage: 2
couvre:
  - apps/web/src/lib/i18n/**
  - apps/web/src/lib/server/localized-load.ts
  - apps/web/src/lib/server/public-content.json
  - apps/web/i18n-preprocess.mjs
  - apps/web/src/lib/nen/localizedProphecy.ts
depend-de: [09-la-facade-web]
revu-le: 2026-11-06
empreinte: pending
decisions: []
---

# Traductions publiques

L’URL choisit la langue : anglais sans préfixe, français sous `/fr`.
Les catalogues `apps/web/src/lib/i18n/messages/en.ts` et `apps/web/src/lib/i18n/messages/fr.ts` définissent l’interface et son contrat typé.

Les textes éditoriaux restent dans les données canoniques, avec leurs identifiants et leurs valeurs d’origine.
`localizedLoad` ajoute, après le filtrage des spoilers, les seules traductions nécessaires aux textes présents dans la réponse.
Le dictionnaire éditorial complet `apps/web/src/lib/server/public-content.json` reste côté serveur.

Le préprocesseur Svelte `i18n-preprocess.mjs` applique `publicText` au texte affiché et aux attributs accessibles.
Il conserve les expressions de script, les liens, les identifiants, les styles et les valeurs utilisées par le moteur.
`apps/web/src/lib/i18n/messages/public-ui.json` couvre les libellés publics, les cartes et les phrases à variables.
Les variables `ZXARG000ZX`, `ZXARG001ZX`, etc. représentent les valeurs interpolées et doivent être conservées dans la traduction.
Les noms de techniques suivent les choix éditoriaux de `apps/web/src/lib/i18n/messages/hatsu-fr.ts`.

Les poèmes de Lovely Ghostwriter, déjà chargés à la demande, utilisent un dictionnaire séparé `apps/web/src/lib/i18n/messages/public-poems.json` chargé au même moment.
Changer de langue produit une copie traduite de la fiche, sans modifier le catalogue original.
Les métadonnées structurées traduisent leurs noms et descriptions en conservant les identifiants schema.org.

Lors d’un ajout de contenu public, compléter le dictionnaire de la langue opposée.
`publicContentCoverage.test.ts` vérifie la couverture des descriptions, biographies, pouvoirs et prophéties, ainsi que la conservation des variables.
Les tests `publicText`, `publicTextPreprocess` et `prophecySheets` vérifient le rendu et les frontières du modèle.
