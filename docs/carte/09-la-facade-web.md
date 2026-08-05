---
titre: La façade web
etage: 1
couvre:
  - apps/web/src/routes/**
  - apps/web/src/lib/server/**
  - apps/web/src/lib/i18n/**
  - apps/web/src/lib/seo/**
  - apps/web/src/lib/config/features.ts
depend-de:
  - 04-le-nen
  - 05-la-visite
  - 06-le-navire
  - 08-le-spoiler
  - 11-les-donnees
revu-le: 2026-08-05
empreinte: b129b37
decisions:
  - adr-001
  - adr-002
  - adr-006
---

# La façade web

> Ce territoire répond à : où se décide ce qui quitte le serveur, ce qui est caché par le cap de spoiler, et comment le site se présente aux lecteurs et aux moteurs. Il ne répond pas à la géométrie de la visite, à la logique des Hatsu ni au canon lui-même.

## Promet

- Toute route du site est déclarée sous `apps/web/src/routes/`.
- Le cap de spoiler est lu une fois au sommet du layout, propagé aux loaders et écrit par un seul endpoint.
- Les helpers serveur (`apps/web/src/lib/server/`) centralisent l'accès à Prisma, au canon, aux capacités, aux personnages et à la simulation.
- Le site est servi en deux locales (`en` et `fr`) avec des URLs préfixées pour le non-anglais.
- Les méta-données SEO et les JSON-LD sont produits par des fonctions pures réutilisables.

## Refuse

- Aucun helper de `apps/web/src/lib/server/` n'est importé dans du code client (`+page.ts` universel, `.svelte`, modules partagés).
- `apps/web` n'écrit jamais dans la base de canon : les tables sont remplies par `packages/canon-compiler` avant le déploiement.
- Le cap de spoiler n'est jamais lu depuis `document.cookie` : il transite par `apps/web/src/routes/+layout.server.ts` et le cookie est `httpOnly`.
- Les routes désactivées par `PUBLIC_FEATURES` ne sont pas rendues accessibles côté serveur.

## Entrées

- `apps/web/src/routes/` — arborescence SvelteKit : layouts, pages, endpoints et actions.
- `apps/web/src/lib/server/` — helpers exclusifs au serveur.
- `apps/web/src/lib/i18n/` — locale, dictionnaires, switcher et overlay Hatsu.
- `apps/web/src/lib/seo/` — titres, URLs absolues, schémas JSON-LD.
- `apps/web/src/lib/config/features.ts` — fonctionnalités publiques active/désactivées.

## Carte

- [04 le nen](../carte/04-le-nen.md)
- [05 la visite](../carte/05-la-visite.md)
- [06 le navire](../carte/06-le-navire.md)
- [08 le spoiler](../carte/08-le-spoiler.md)
- [11 les données](../carte/11-les-donnees.md)

## Le trajet

`apps/web/src/routes/+layout.server.ts` → `apps/web/src/lib/server/spoiler.ts` → `apps/web/src/routes/spoiler-limit/+server.ts`

`apps/web/src/routes/+layout.server.ts` → `apps/web/src/routes/characters/+page.server.ts` (modèle des pages canon) → `apps/web/src/lib/server/db.ts` / `apps/web/src/lib/server/timeline.ts` / `apps/web/src/lib/server/nen.ts`

`apps/web/src/lib/server/timeline.ts` → les types et moteurs de `packages/canon-engine`

`apps/web/src/lib/server/nen.ts` → les runtimes de `packages/nen-engine` et `packages/ability-modules`

`apps/web/src/lib/server/ability-visibility.ts` → `data/abilities/abilities.json`

`apps/web/src/lib/server/mapPayload.ts` → `apps/web/src/routes/ship/+page.server.ts` → `apps/web/src/routes/ship/+page.svelte`

`apps/web/src/lib/server/character-profile.ts` + `apps/web/src/lib/server/character-timeline.ts` → `apps/web/src/routes/characters/[slug]/+page.server.ts`

`apps/web/src/lib/server/knowledge-map.ts` + `apps/web/src/lib/server/perspectives.ts` → `apps/web/src/routes/perspectives/+page.server.ts`, `apps/web/src/routes/perspectives/[character]/+page.server.ts` et `apps/web/src/routes/compare/+page.server.ts`

`apps/web/src/lib/server/reconstruction-v3.ts` + `apps/web/src/lib/server/simulations.ts` → `apps/web/src/routes/reconstruction/v3/run/+server.ts`

`apps/web/src/lib/i18n/index.ts` → `apps/web/src/lib/i18n/LanguageSwitcher.svelte` + toutes les pages

`apps/web/src/lib/seo/schema.ts` → `apps/web/src/routes/sitemap.xml/+server.ts` + `apps/web/src/routes/robots.txt/+server.ts`

## Les frontières

| Ce dossier … | Règle |
| ------------ | ----- |
| `apps/web/src/lib/server/` | importe les packages, `data/` et `apps/web/src/lib/` côté serveur uniquement ; ne touche jamais `apps/web/src/lib/components/`. |
| `apps/web/src/routes/` | importe `apps/web/src/lib/server/`, `apps/web/src/lib/components/`, `apps/web/src/lib/i18n/`, `apps/web/src/lib/seo/`, `apps/web/src/lib/config/features.ts` ; pas d'import direct de packages sauf via `apps/web/src/lib/server/`. |
| `apps/web/src/lib/i18n/` | importé par tout le monde ; ne dépend pas de `apps/web/src/lib/server/` ni de `apps/web/src/routes/`. |
| `apps/web/src/lib/seo/` | importé par les routes, les composants et `apps/web/src/routes/sitemap.xml/+server.ts` ainsi que `apps/web/src/routes/robots.txt/+server.ts` ; ne dépend pas de l'état du serveur. |
| `apps/web/src/lib/config/features.ts` | importé partout ; ne contient que des constantes booléennes. |

## Les faits qui ne se lisent pas dans le code

- 24 routes publiques sont déclarées sous `apps/web/src/routes/` (`docs/decision/adr-006-la-doc-ancree.md` §1).
- Le cookie de spoiler est `httpOnly`, `sameSite: 'lax'`, `maxAge` d'un an (`apps/web/src/lib/server/spoiler.ts`).
- La politique de cache partagé est `s-maxage=600, stale-while-revalidate=86400` avec `Vary: Cookie` pour les pages canon, et `no-store` pour `/simulations`, `/spoiler-limit` et `/health` (`apps/web/src/lib/server/httpCache.ts`).
- `apps/web/src/lib/server/db.ts` crée un seul `PrismaClient` par processus via `globalThis` en développement, comme `apps/admin`.
- `apps/web/src/lib/server/data-files.ts` remonte l'arborescence depuis `process.cwd()` pour trouver `data/` : en production les chunks SvelteKit ne conservent pas la structure source.
- `apps/web/src/lib/server/timeline.ts` et `apps/web/src/lib/server/nen.ts` gardent des singletons en mémoire parce qu'aucune route de `apps/web` n'écrit dans la base canon. Si une écriture est ajoutée, le snapshot store doit être invalidé (commentaire dans `apps/web/src/lib/server/timeline.ts`).
- La locale par défaut est `en` et garde des chemins sans préfixe ; `fr` est servi sous `/fr/**` (`apps/web/src/lib/i18n/config.ts`).
- `PUBLIC_FEATURES` désactive actuellement `perspectives` et `compare` (`apps/web/src/lib/config/features.ts`).

## Les pièges

- Importer un module de `apps/web/src/lib/server/` dans un fichier client fait échouer le build ou expose des données sensibles. La frontière est SvelteKit : seuls `+page.server.ts`, `+layout.server.ts`, `+server.ts` et les actions peuvent lire `apps/web/src/lib/server/`.
- Parser `firstAppearanceChapterId` avec `Number.parseInt` directement donne `NaN` (les ids sont `ch-349`). Cela a causé des révélations silencieuses corrigées dans `apps/web/src/lib/server/character-profile.ts` (`readFirstAppearanceChapter`).
- Laisser `NaN` atteindre un filtre Prisma `lte` produit un comportement indéfini ; `apps/web/src/lib/server/spoiler.ts` nettoie donc le cookie avant qu'il ne soit utilisé.
- Layout data et page data fusionnent dans SvelteKit. C'est pourquoi le layout nomme le cap `spoilerFilter` et non `spoilerLimit` : plusieurs pages retournent déjà un champ `spoilerLimit` (`apps/web/src/routes/+layout.server.ts`, commentaire interne).
- Mettre en cache une page canon sans `Vary: Cookie` expose un lecteur capé à un contenu décapé. `apps/web/src/lib/server/httpCache.test.ts` couvre cette propriété route par route.
- Les routes `/bodies/[id]`, `/consciousness/[id]`, `/knowledge/[character]` existent dans l'arborescence mais sont désindexées par `apps/web/src/routes/robots.txt/+server.ts` car elles n'ont pas encore de contenu canon publiable.

## Par où entrer

| Je veux … | J'ouvre |
| --------- | ------- |
| ajouter une route | `docs/geste/une-route.md` |
| modifier le cap de spoiler | `apps/web/src/routes/spoiler-limit/+server.ts` et `apps/web/src/lib/server/spoiler.ts` |
| modifier la politique de cache | `apps/web/src/lib/server/httpCache.ts` et `apps/web/src/lib/server/httpCache.test.ts` |
| ajouter ou modifier une locale | `apps/web/src/lib/i18n/config.ts` puis les catalogues `apps/web/src/lib/i18n/messages/en.ts` et `apps/web/src/lib/i18n/messages/fr.ts` |
| changer un titre ou un schéma JSON-LD | `apps/web/src/lib/seo/config.ts`, `apps/web/src/lib/seo/schema.ts`, `apps/web/src/lib/components/Seo.svelte` |
| activer/désactiver une fonctionnalité | `apps/web/src/lib/config/features.ts` |
| comprendre le load d'une page | la route concernée, par exemple `apps/web/src/routes/characters/+page.server.ts`, puis le helper `apps/web/src/lib/server/` qu'elle appelle |
| comprendre la visite | `docs/carte/05-la-visite.md` |

## Vérifier

```
pnpm doc-lint
pnpm --filter @black-whale/web test routes/spoiler-limit/ lib/server/httpCache.test.ts
pnpm --filter @black-whale/web typecheck
pnpm lint
pnpm test:ratchet
```
