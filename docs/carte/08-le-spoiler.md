---
titre: Le spoiler
etage: 1
couvre:
  - packages/canon-engine/src/spoiler/**
  - apps/web/src/lib/server/spoiler.ts
  - apps/web/src/lib/server/httpCache.ts
  - apps/web/src/lib/server/ability-visibility.ts
  - apps/web/src/routes/spoiler-limit/**
depend-de: [01-le-canon, 09-la-facade-web]
revu-le: 2026-08-05
empreinte: f84b7c5
decisions: [adr-001, adr-006]
---

# Le spoiler

> Ce territoire répond à la question : jusqu'où un lecteur peut-il voir ? Il décrit le cap, sa propagation et la variation du cache. C'est une zone avec des invariants stricts.

## Promet

- Filtrer le monde (événements, personnages) grâce aux prédicats fournis par `packages/canon-engine/src/spoiler/`.
- Gérer la lecture, l'écriture et le nettoyage du cookie de cap côté serveur via `apps/web/src/lib/server/spoiler.ts`.
- Imposer la politique de cache partagé avec `Vary: Cookie` sur tout contenu canon via `apps/web/src/lib/server/httpCache.ts`.
- Dater les Hatsu et contrôler leur visibilité via `apps/web/src/lib/server/ability-visibility.ts`.
- Exposer un unique point de modification du cap : `apps/web/src/routes/spoiler-limit/+server.ts`.

## Refuse

- Lire ou manipuler le cap côté client (via `document.cookie`).
- Mettre en cache des pages canon sans inclure l'en-tête `Vary: Cookie`.
- Élargir le cap via des requêtes malformées ou hors origine.
- Effectuer des requêtes à la base de données directement depuis les filtres de `packages/canon-engine/src/spoiler/`.

## Trajet

Le cap se propage du cookie au filtre de base de données :

```text
navigateur (cookie httpOnly)
  → apps/web/src/routes/+layout.server.ts (readSpoilerLimit)
  → apps/web/src/lib/server/spoiler.ts
  → packages/canon-engine/src/spoiler/index.ts (getSpoilerFilter)
  → Prisma / canon-engine
  → réponse + Cache-Control: public, s-maxage=600, Vary: Cookie
```

Pour les Hatsu, le chemin vérifie l'autorisation d'affichage :

```text
data/abilities/abilities.json + chapters.json
  → apps/web/src/lib/server/ability-visibility.ts (loadAbilityVisibility)
  → AbilityVisibilityIndex.isVisible(abilityId, maxChapter)
```

## Frontières

- `packages/canon-engine/src/spoiler/` : Reçoit un profil de spoiler et filtre. Ne sait pas comment le cap est défini.
- `apps/web/src/lib/server/spoiler.ts` : Spécialiste du cookie, lit et écrit sans effectuer de filtrage du monde.
- `apps/web/src/lib/server/httpCache.ts` : Décide de la politique de cache HTTP, ne manipule pas le contenu de la réponse.
- `apps/web/src/lib/server/ability-visibility.ts` : Détermine la date d'apparition des Hatsu. Vit sur le serveur car sa réponse dicte ce qui peut quitter le serveur.
- `apps/web/src/routes/spoiler-limit/` : Le seul écrivain autorisé du cap. Refuse les valeurs invalides.

## Invariants

- **Cookie sécurisé** : Le cookie est toujours `httpOnly`, `sameSite: 'lax'`, avec un nettoyage systématique (ex: retrait des `NaN`) avant usage avec Prisma.
- **Isolation du cache** : `Vary: Cookie` est obligatoire. Sans cela, un CDN partagé pourrait mélanger les réponses de deux lecteurs ayant des caps différents.
- **Traitement des limites** : `undefined` ou une valeur non entière positive équivaut à "pas de limite". `0` signifie "rien du tout".
- **Filtrage centralisé** : Aucun code client ne doit filtrer les spoilers. Le filtrage doit se faire strictement sur le serveur pour éviter toute fuite de noms.
