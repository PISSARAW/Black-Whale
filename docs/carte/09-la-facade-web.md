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

> Ce territoire répond à : `load` vs action vs client, et où se pose la frontière serveur. Il ne répond pas à la géométrie de la visite ni à la logique des Hatsu.

## Le trajet

`apps/web/src/routes/+layout.server.ts` → `apps/web/src/lib/server/spoiler.ts` → `apps/web/src/routes/spoiler-limit/+server.ts`
`apps/web/src/lib/server/mapPayload.ts` → `apps/web/src/routes/ship/+page.server.ts` → `apps/web/src/routes/ship/+page.svelte`
`apps/web/src/lib/i18n/index.ts` → `apps/web/src/lib/i18n/LanguageSwitcher.svelte`
`apps/web/src/lib/seo/schema.ts` → `apps/web/src/routes/sitemap.xml/+server.ts`

## Les frontières

| Ce dossier …                          | Règle                                                                                                                |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `apps/web/src/lib/server/`            | importe les packages, `data/` et `apps/web/src/lib/` côté serveur uniquement ; ne touche jamais les composants client. |
| `apps/web/src/routes/`                | importe `apps/web/src/lib/server/`, `apps/web/src/lib/i18n/`, `apps/web/src/lib/seo/`. Pas d'import direct des paquets. |
| `apps/web/src/lib/i18n/`              | est importé par tout le monde ; ne dépend pas du serveur.                                                             |
| `apps/web/src/lib/seo/`               | est importé par les routes et composants ; ne dépend pas du serveur.                                                 |
| `apps/web/src/lib/config/features.ts` | est importé partout ; ne contient que des constantes booléennes.                                                     |

## Les faits qui ne se lisent pas dans le code

- 24 routes publiques sont déclarées sous `apps/web/src/routes/` (ADR-006).
- Le cookie de spoiler est `httpOnly`, `sameSite: 'lax'`, `maxAge` d'un an (`apps/web/src/lib/server/spoiler.ts`).
- La politique de cache partagé est `s-maxage=600, stale-while-revalidate=86400` avec `Vary: Cookie` pour les pages canon.
- `PUBLIC_FEATURES` désactive actuellement `perspectives` et `compare` (`apps/web/src/lib/config/features.ts`).
- La locale par défaut est `en` (sans préfixe d'URL), et `fr` est sous `/fr/**` (`apps/web/src/lib/i18n/config.ts`).

## Les pièges

- Importer un module de `apps/web/src/lib/server/` dans un fichier client fait échouer le build ou expose des données sensibles. La frontière SvelteKit dicte que seuls les `*.server.ts` peuvent le lire.
- Parser `firstAppearanceChapterId` avec `Number.parseInt` directement donne `NaN` (ex: `ch-349`).
- Mettre en cache une page canon sans `Vary: Cookie` expose un lecteur capé à un contenu décapé.

## Par où entrer

| Je veux …                             | J'ouvre                                                                                                                                     |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| ajouter une route                     | `docs/geste/une-route.md`                                                                                                                   |
| modifier le cap de spoiler            | `apps/web/src/routes/spoiler-limit/+server.ts` et `apps/web/src/lib/server/spoiler.ts`                                                      |
| modifier la politique de cache        | `apps/web/src/lib/server/httpCache.ts`                                                       |
| ajouter ou modifier une locale        | `apps/web/src/lib/i18n/config.ts`                                                                                                           |
| activer/désactiver une fonctionnalité | `apps/web/src/lib/config/features.ts`                                                                                                       |

## Vérifier

pnpm doc-lint
pnpm --filter @black-whale/web test routes/spoiler-limit/
pnpm --filter @black-whale/web typecheck
