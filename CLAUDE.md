# Black-Whale — règles de code

Ces trois normes s'appliquent à **tout code applicatif** (`apps/*/src/**`, `packages/*/src/**`)
et sont des `error` ESLint, pas des préférences. Elles valent pour l'agent principal comme
pour chaque sous-agent.

Elles ne dépendent pas de la lecture de ce fichier : un hook `PreToolUse`
(`.claude/hooks/enforce-limits.mjs`, câblé dans `.claude/settings.json`) **refuse** toute
écriture qui ferait grossir un fichier applicatif déjà à la borne, quel que soit l'agent.
Raccourcir un fichier hors-borne passe toujours — c'est le comportement recherché.

## 1. Les trois bornes

| Borne                                       | Règle        | Où                                               |
| ------------------------------------------- | ------------ | ------------------------------------------------ |
| **≤ 500 lignes brutes** / fichier           | `max-lines`  | blancs et commentaires **inclus**                |
| **≤ 3 paramètres** / fonction               | `max-params` | au-delà : un objet `options` typé, ou une classe |
| **complexité cyclomatique ≤ 10** / fonction | `complexity` | au-delà : extraire les branches                  |

Voir `eslint.config.js` et `docs/adr-002-decoupage-500.md`.

**Interdit :** ajouter `/* eslint-disable */`, élargir une borne, ou ajouter une entrée aux
listes d'exemption. Une violation nouvelle se corrige en nommant un type ou en découpant un
module — jamais en désactivant la règle.

### Ce qui est exempté par nature (ne pas « corriger »)

Catalogues i18n (`lib/i18n/messages/**`), cartes SVG dessinées (`lib/assets/maps/**`),
`*.test.ts` / `*.spec.ts`, `packages/database/prisma/**`, et tout `*.gen.ts`. Ces fichiers
sont longs parce qu'ils contiennent beaucoup de petites entrées indépendantes, pas une
grande idée.

## 2. Le cliquet — la règle qui compte le plus

`eslint.config.js` se termine par deux listes de fichiers en `max-lines: off` et
`complexity: off`. Ce sont les fichiers qui précèdent la borne.

**Ces listes ne peuvent que rétrécir.** `scripts/check-ratchet.test.ts` fait échouer le build
si l'une des deux grandit. Ajouter une entrée est exactement le comportement que la règle
existe pour empêcher.

## 3. Quand tu touches un fichier déjà au-dessus de la borne

C'est le cas le plus fréquent (~40 fichiers). La consigne n'est **pas** de le découper
entièrement — ce chantier a son propre ADR et ses propres lots. La consigne est :

1. **Ne l'alourdis jamais.** Tout ce dont ta tâche a besoin — nouveau type, nouvel
   helper, nouvelle constante, nouveau sous-composant, nouvelle branche de logique — part
   dans un **fichier neuf** que le fichier existant importe. Rien de neuf ne s'ajoute
   dans le corps d'un fichier hors-borne.
2. **Allège-le un peu au passage.** En plus de ce que tu ajoutes, sors du fichier ce qui
   est adjacent à ton travail et qui se laisse extraire proprement : quelques dizaines de
   lignes suffisent. L'objectif est que chaque passage laisse le fichier plus court qu'il
   ne l'était, pas qu'il le rende conforme d'un coup.
3. **Zéro changement de comportement dans l'extraction.** Le déplacement de code déplace
   du code. Une correction repérée en chemin devient une ligne dans
   `docs/decoupage-notes.md`, jamais un edit du même commit.
4. **Façade de ré-export.** Un module TS découpé garde son chemin et ré-exporte ses
   symboles depuis les nouveaux fichiers : aucun import extérieur ne change. Les `.svelte`
   n'ont pas de façade — on extrait des composants enfants et des modules d'état
   `.svelte.ts`, le parent garde son nom et son contrat de props.
5. **Si le fichier passe sous 500 lignes, retire son entrée du cliquet** dans le même
   commit. C'est le but de l'exercice.

## 4. Vérification

```
pnpm lint            # les bornes
pnpm test:ratchet    # les listes d'exemption n'ont pas grandi
pnpm typecheck
pnpm test
```

La base n'est pas verte : `pnpm lint` a des erreurs préexistantes et `pnpm test` à la racine
échoue dans `@black-whale/domain`. Compare à la base, pas à zéro — mais n'ajoute aucune
erreur `max-lines` / `max-params` / `complexity`, qui elles sont à zéro sur le code neuf.

## 5. Autres règles dures

- **Pas d'emoji dans l'interface** — banni par ESLint (`no-restricted-syntax`). Les marques
  typographiques déjà utilisées par le design (✓ ◉ ◐ ★ ♩) restent autorisées.
- `.claude/` et `_to_delete/` doivent rester dans les `ignores` d'ESLint.
