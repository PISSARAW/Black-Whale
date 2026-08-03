# `@black-whale/ability-modules`

Les quatre-vingt-deux hatsu, une fois chacun.

## Ajouter un hatsu

Deux éditions, et rien d'autre :

1. **Une entrée dans `data/abilities/abilities.json`** — le _quoi_ canonique :
   `id`, `name`, `ownerId`, `category`, `description`, `canonStatus`, et
   `moduleKey` égal à l'`id`. C'est la déclaration à laquelle tout le reste
   obéit ; `canon-lint` la vérifie.
2. **Un module ici**, `src/<id>/module.ts`, exporté depuis `src/index.ts` et
   ajouté à `abilityModules`. Il porte le _comment_ : conditions, effets,
   actions, `interactionManifest` — et le bloc `site`.

Le bloc `site` est ce que le site affiche et ce sur quoi les rendus DOM et 3D
commutent :

```ts
site: {
  kind: 'elastic',            // unique dans tout le catalogue
  instruction: '…',           // ce qu'on demande au visiteur de faire
  rule: '…',                  // la limite canonique, celle que le module applique
  cost: '…',                  // ce que ça coûte à son porteur
  color: '#f06bb5',
  action: '…',                // le libellé de la première action
}
```

Puis :

```sh
pnpm --filter @black-whale/canon-compiler compile:hatsu
```

qui réécrit `apps/web/src/lib/nen/hatsuProfiles.gen.ts` — le registre que
lisent le sélecteur, le HUD du tour, l'arène et la traque. Il est commité pour
rester lisible en diff, et la CI (`check:hatsu`) refuse un dépôt où il n'est
plus ce que le compilateur écrirait.

La traduction suit : `hatsu-fr.ts` est typé `Record<HatsuId, …>`, donc un hatsu
sans texte français ne compile pas. Pour obtenir l'entrée à coller et traduire :

```sh
pnpm --filter @black-whale/canon-compiler compile:hatsu:dev --skeleton
```

Elle ne propose pas de `owner` : un nom propre n'est pas une traduction, et les
deux langues lisent le nom canonique du catalogue.

Restent deux tables à compléter dans `apps/web/src/lib/nen/hatsuRegistry.ts` :
l'impact du hatsu sur la page et sa signature visuelle. Elles sont typées
`satisfies Record<HatsuInteractionKind, …>`, donc un `kind` nouveau y ouvre un
trou que TypeScript signale — il n'y a pas de repli silencieux.

## Ce que le compilateur refuse

- un module dont le `name` ou l'`ownerId` contredit le catalogue ;
- un module sans bloc `site` ;
- deux hatsu qui se partagent un `kind` — les rendus ne pourraient plus les
  distinguer ;
- une entrée du catalogue qui annonce un `moduleKey` auquel aucun module ne
  répond.

Chacun de ces cas est un échec de build, pas une divergence découverte en
production : c'est l'objet du chantier 3 de `docs/adr-001-le-canon-compile.md`.
