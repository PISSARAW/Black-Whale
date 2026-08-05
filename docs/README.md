# Routeur de documentation

Ce dépôt utilise une doc **ancrée** ([ADR-006](decision/adr-006-la-doc-ancree.md)) : chaque page déclare les chemins de code qu'elle couvre, et `pnpm doc-lint` interdit qu'elle pointe dans le vide.

## Comment chercher

1. **Tu connais le territoire** → ouvre une [carte](carte/).
2. **Tu touches un dossier** → ouvre son `README.md` (étage 2, colocalisé).
3. **Tu veux une recette** → ouvre un [geste](geste/).
4. **Tu cherches un symbole/route/test** → ouvre un fichier [`.gen`](.gen/).
5. **Tu veux le pourquoi d'une décision** → ouvre un [ADR](decision/).

## Cartes (étage 1)

| Carte | Territoire | Répond à |
| ----- | ---------- | -------- |
| [01 le canon](carte/01-le-canon.md) | `data/**`, `canon-*` | Où est déclaré un fait ? Que devient-il ? |
| [02 le temps](carte/02-le-temps.md) | `domain/temporal.ts`, `canon-engine/timeline`, `tour/hour.ts` | Les trois temps du dépôt |
| [03 l'identité](carte/03-l-identite.md) | `domain/identity.ts`, `lib/identity` | Corps, conscience, aura |
| [04 le nen](carte/04-le-nen.md) | `ability-sdk`, `ability-modules`, `nen-engine`, `lib/nen` | Le trajet d'un hatsu |
| [05 la visite](carte/05-la-visite.md) | `tour/`, `components/tour/` | Géométrie, rendu, lumière, son |
| [06 le navire](carte/06-le-navire.md) | `lib/map`, `routes/ship` | Carte dessinée, projection |
| [07 les modes](carte/07-les-modes.md) | `arena`, `hunt`, `infiltration`, etc. | Ce que « jouable » veut dire |
| [08 le spoiler](carte/08-le-spoiler.md) | `canon-engine/spoiler`, `routes/spoiler-limit` | Le cap et sa propagation |
| [09 la façade web](carte/09-la-facade-web.md) | `routes/**`, `lib/server`, `lib/i18n` | Load, actions, frontière serveur |
| [10 l'admin](carte/10-l-admin.md) | `apps/admin/**` | Écritures et session signée |
| [11 les données](carte/11-les-donnees.md) | `data/`, `packages/contracts` | Contrat d'un fichier de données |
| [12 l'exploitation](carte/12-l-exploitation.md) | `infrastructure/`, `.github/workflows` | Déployer, restaurer |
| [13 les bornes](carte/13-les-bornes.md) | `eslint.config.js`, `.claude/hooks` | Renvoie à `CLAUDE.md` + ADR-002 |

## Geste (recettes)

- [Ajouter un Hatsu](geste/un-hatsu.md)
- [Ajouter une salle](geste/une-salle.md)
- [Ajouter un événement](geste/un-evenement.md)
- [Ajouter un mode jouable](geste/un-mode-jouable.md)
- [Ajouter une route](geste/une-route.md)
- [Ajouter une migration](geste/une-migration.md)

## Décisions et archive

- [Décisions d'architecture](decision/) — ADR-001 à ADR-006
- [Backlogs et audits clos](archive/) — lecture seule

## Généré

- [`.gen/`](.gen/) — routes, tests, symboles, dépendances, données, bornes, hatsu

## Vérifier

```
pnpm doc-lint     # les liens, les couvertures, les bornes de doc
pnpm doc:gen      # régénère .gen/
pnpm test:ratchet # les listes d'exemption de code ne reculent pas
```
