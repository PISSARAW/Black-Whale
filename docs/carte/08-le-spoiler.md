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

> Ce territoire répond à : jusqu'où un lecteur peut-il voir, et comment ce cap traverse le serveur, la base et le cache sans fuir. Il ne répond pas à ce qui est canon (voir [01 le canon](01-le-canon.md)) ni à la façade générale (voir [09 la façade web](09-la-facade-web.md)).

## Promet

- `packages/canon-engine/src/spoiler/` fournit les prédicats de filtrage du monde (`getSpoilerFilter`, `filterVisible`, `filterTemporalRecords`, `maskFutureEnds`).
- `apps/web/src/lib/server/spoiler.ts` lit et écrit le cookie de cap côté serveur, en le nettoyant avant toute requête Prisma.
- `apps/web/src/lib/server/httpCache.ts` décide ce qui peut être mis en cache partagé, et impose `Vary: Cookie` sur tout contenu canon.
- `apps/web/src/lib/server/ability-visibility.ts` date chaque Hatsu à partir du catalogue et interdit de le montrer avant son chapitre.
- `apps/web/src/routes/spoiler-limit/+server.ts` est le seul endpoint qui modifie le cap.

## Refuse

- Aucun code client ne lit `document.cookie` pour le cap : il arrive par le `load` du layout.
- Aucune page canon n'est mise en cache sans `Vary: Cookie`.
- `packages/canon-engine/src/spoiler/` ne fait pas de requête Prisma : il reçoit un `SpoilerProfile` et retourne des clauses ou des tableaux filtrés.
- Le cap n'est jamais élargi par une requête malformée : `apps/web/src/routes/spoiler-limit/+server.ts` ignore les valeurs invalides.

## Entrées

- `packages/canon-engine/src/spoiler/index.ts` — filtres du monde pur.
- `apps/web/src/lib/server/spoiler.ts` — lecture/écriture du cookie.
- `apps/web/src/lib/server/httpCache.ts` — politique de cache partagé.
- `apps/web/src/lib/server/ability-visibility.ts` — visibilité des Hatsu.
- `apps/web/src/routes/spoiler-limit/+server.ts` — endpoint de mise à jour du cap.

## Carte

- [01 le canon](01-le-canon.md) — où vivent les faits et les chapitres.
- [09 la façade web](09-la-facade-web.md) — routes, layout et helpers serveur.
- [04 le nen](04-le-nen.md) — les Hatsu dont on cache l'identité.

## Le trajet

```
navigateur (cookie httpOnly)
  → apps/web/src/routes/+layout.server.ts (readSpoilerLimit)
  → apps/web/src/lib/server/spoiler.ts
  → { maxChapter }
  → packages/canon-engine/src/spoiler/index.ts (getSpoilerFilter)
  → Prisma / canon-engine
  → réponse + Cache-Control: public, s-maxage=600, Vary: Cookie
```

Pour les capacités, le chemin est plus court mais critique :

```
data/abilities/abilities.json + data/characters/characters.json + data/chapters/chapters.json
  → apps/web/src/lib/server/ability-visibility.ts (loadAbilityVisibility)
  → AbilityVisibilityIndex.isVisible(abilityId, maxChapter)
```

## Les frontières

| Ce dossier …                                    | Règle                                                                                   |
| ----------------------------------------------- | --------------------------------------------------------------------------------------- |
| `packages/canon-engine/src/spoiler/`            | Reçoit un profil et filtre. Ne sait pas d'où vient le cap.                              |
| `apps/web/src/lib/server/spoiler.ts`            | Lit/écrit le cookie. Ne filtre pas le monde.                                            |
| `apps/web/src/lib/server/httpCache.ts`          | Décide de la politique de cache. Ne touche pas au contenu.                              |
| `apps/web/src/lib/server/ability-visibility.ts` | Date les Hatsu. Vit sur le serveur car la réponse conditionne ce qui quitte le serveur. |
| `apps/web/src/routes/spoiler-limit/+server.ts`  | Seul écrivain du cap. Refuse les valeurs invalides et les redirections hors origine.    |

## Les faits qui ne se lisent pas dans le code

- Le cap est un numéro de chapitre. `undefined` signifie « pas de limite » ; `0` signifie « rien du tout ». Toute valeur non entière positive est traitée comme `undefined`.
- Le cookie est `httpOnly`, `sameSite: 'lax'`, valable un an (`apps/web/src/lib/server/spoiler.ts`).
- `Vary: Cookie` est volontairement grossier : il crée un segment de cache par cookie entier, pas par cap. Une clé plus fine attend un CDN programmable (`apps/web/src/lib/server/httpCache.ts`).
- Les pages `/simulations`, `/spoiler-limit` et `/health` ne sont jamais stockées (`apps/web/src/lib/server/httpCache.ts`).
- `ability-visibility.ts` n'a pas encore de `firstVisibleChapterId` par Hatsu dans le catalogue ; il se rabat sur la première apparition du possesseur, ce qui est une borne inférieure (ADR-001 chantier 2).

## Les pièges

- **Laisser `NaN` atteindre un `lte` Prisma** : `readSpoilerLimit` nettoie le cookie avant de le retourner.
- **Cacher un spoiler côté client** : le nom sort quand même du serveur. Le filtrage doit se faire dans `+page.server.ts` ou les helpers serveur.
- **Oublier `Vary: Cookie`** : une page canon servie depuis un cache partagé sans cette en-tête peut mélanger deux lecteurs.
- **Ajouter une route qui écrit le cap** : seul `apps/web/src/routes/spoiler-limit/+server.ts` a ce droit ; un formulaire dans le layout ne peut pas utiliser d'action SvelteKit.
- **Dater un Hatsu par son apparition dans le récit** : c'est une borne basse ; un personnage peut exister longtemps avant de révéler sa technique.

## Par où entrer

| Je veux …                                          | J'ouvre                                                                                   |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| changer la valeur par défaut ou la durée du cookie | `apps/web/src/lib/server/spoiler.ts`                                                      |
| ajouter une règle de filtrage du monde             | `packages/canon-engine/src/spoiler/index.ts` + un test dans `packages/canon-engine`       |
| changer la politique de cache                      | `apps/web/src/lib/server/httpCache.ts` + `apps/web/src/lib/server/httpCache.test.ts`      |
| ajouter un `firstVisibleChapterId` au catalogue    | `data/abilities/abilities.json` et `apps/web/src/lib/server/ability-visibility.ts`        |
| changer le contrôle de cap dans l'interface        | `apps/web/src/routes/+layout.server.ts` et `apps/web/src/routes/spoiler-limit/+server.ts` |
| vérifier qu'une route ne fuit pas                  | `apps/web/src/lib/server/httpCache.test.ts`                                               |

## Vérifier

```
pnpm --filter @black-whale/web test routes/spoiler-limit/
pnpm --filter @black-whale/web test lib/server/httpCache.test.ts
pnpm --filter @black-whale/canon-engine test
pnpm doc-lint
```
