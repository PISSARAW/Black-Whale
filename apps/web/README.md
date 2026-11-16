---
titre: Web App
etage: 2
couvre:
  - apps/web/**
depend-de: [09-la-facade-web]
revu-le: 2026-08-20
empreinte: pending
decisions: []
---

# `apps/web` — Application Web

**Promet :** L'interface utilisateur, le rendu client (visite, modes) et le serveur SSR frontal.
**Refuse :** L'administration directe ou la mutation de l'état global du canon.
**Entrée publique :** `apps/web/src/routes/**`
**Carte :** [09 la facade web](../../docs/carte/09-la-facade-web.md)

## Découpage

| Groupe | Fichiers                     | Responsabilité                            |
| ------ | ---------------------------- | ----------------------------------------- |
| Routes | `apps/web/src/routes/**`     | Pages SvelteKit, load() et actions        |
| Lib    | `apps/web/src/lib/**`        | Composants, logique partagée, tour, modes |
| Server | `apps/web/src/lib/server/**` | Frontière serveur, actions sécurisées     |

## Invariants

- Le serveur de façade (SvelteKit load/actions) est le seul point de confiance pour valider les données de la session.

## Ajouter quelque chose ici

Consulter [09 la facade web](../../docs/carte/09-la-facade-web.md).

## Budget JavaScript de production

Le seuil Vite reste à 500 kB par chunk client. Les plugins dans
`apps/web/build-tools/` séparent les gros JSON et le catalogue généré des pouvoirs
en fragments stables, et les dictionnaires d’interface par langue. Les imports
restent synchrones et les fichiers canoniques restent les sources de vérité.
Changer une partie du catalogue invalide seulement ses fragments et leurs index.

L’alias exact de `three` utilise les modules source de la version installée.
Les utilitaires partagés restent avec les classes de base ; le moteur WebGL et
les shaders forment deux groupes séparés sans cycle de chunks. Les exemples
Three.js gardent leurs chemins publics. Le découpage client ne s’applique pas
au serveur Node, qui externalise la bibliothèque.

Le build produit `bundle-budget.json` et échoue si un chunk JavaScript client
dépasse 500 000 octets. `apps/web/build-tools/bundleChunks.test.ts` compare les
catalogues reconstruits aux données originales et vérifie les exports nommés,
l’ordre, les caractères échappés et les propriétés spéciales des objets JSON.

## Recherche globale

La palette du bandeau (ou ⌘K hors de la visite) recherche les personnages,
pouvoirs, événements, pièces, factions et pages. Entrée lance la recherche ;
les flèches sélectionnent un résultat, puis Entrée l’ouvre. La visite conserve
son raccourci de recherche de pièces ; le bandeau y ouvre la recherche globale.

`POST /search` lit le cookie de spoilers sur le serveur. Le corps de la requête
ne peut pas élargir le chapitre. Le modèle ne reçoit que la question et un schéma
de critères, jamais le catalogue. Les résultats et leurs liens sont construits
uniquement depuis les documents visibles. Aucun résultat n’est mis en cache ;
seule l’interprétation sans faits est mémorisée dix minutes. La réponse est
`private, no-store` avec `Vary: Cookie`.

Sous un cap réel, les descriptions, alias et affiliations non datés ne servent
pas au classement et ne quittent pas le serveur. Les pouvoirs indatables et les
factions sans date sont exclus, comme les noms issus de corrections d’identité
non datées ; les événements et pièces attestées sont bornés
par leurs chapitres. La fiche d’un pouvoir masque aussi ses données non datées.
Si le modèle est indisponible, une recherche classique reste disponible.

Tests : `apps/web/src/lib/server/siteSearch.test.ts`,
`apps/web/src/routes/search/server.test.ts`,
`apps/web/src/lib/search/SiteSearchState.test.ts` et `tests/site-search.production.spec.ts`.
