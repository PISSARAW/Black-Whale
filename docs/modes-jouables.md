# Rendre les cinq modes jouables de bout en bout

**Date :** 2026-08-03 · **Statut :** Proposé · **Périmètre :** `/hunt`, `/arena`,
`/investigation`, `/strategy`, `/infiltration` (et par extension `/reconstruction`)
**S'inscrit dans :** ADR-001 (chantiers 1 et 3) · s'appuie sur les backlogs v2/v3 de
`docs/` et le rapport `hunt-v3-release-candidate.md`

---

## 1. Diagnostic — pourquoi « tout est codé » et rien n'est jouable

Les cinq modes sont nés en trois jours (docs et sources datés du 1ᵉʳ au 3 août).
Le fond est bon : les moteurs logiques sont réels et testés (Hunt : 291 tests
Vitest verts ; Investigation V3 : registre de connaissance, raisonnement,
interrogatoires couverts ; invariants écrits en tête de chaque backlog). Ce qui
casse, c'est tout ce qui est **au-dessus** des moteurs. Cinq causes, toutes
constatées dans le dépôt :

1. **Le workspace ne compile plus.** `hunt-v3-release-candidate.md` l'écrit :
   typecheck global **échoué — 297 erreurs dans 65 fichiers**, « packages
   workspace non résolus et travaux concurrents ». Un site dont le typecheck est
   rouge produit des pages qui cassent à l'hydratation : c'est le « rempli de
   bugs ».
2. **« Fini » a voulu dire « les tests unitaires passent », jamais « un humain
   finit une partie ».** Le seul e2e du dépôt (`tests/hunt.spec.ts`) n'a **jamais
   tourné en CI** ; il documente lui-même un bug mobile réel (contrôles sous la
   ligne de flottaison sur iPhone, clic impossible) et un composant fantôme
   (`AdvancedNenActions.svelte` : écrit, testé nulle part, **jamais monté**).
3. **Cinq modes, cinq écrans monolithiques** : `arena/+page.svelte` 36 Ko + 30 Ko
   de CSS, `infiltration/+page.svelte` 38 Ko en une page, `hunt` 29 Ko. La logique
   testée vit à côté ; l'intégration UI, elle, n'a aucun filet.
4. **« Incompréhensible » = l'apprentissage a été livré en dernier.** Les backlogs
   avaient pourtant tout prévu (Hunt Epic 2 : tutoriel jouable, entraînement sans
   pression, aide consultable) — codé après la mécanique au lieu d'avant.
5. **Cinq piles Nen parallèles** (`arena/hatsu`, `hunt/nen`, `combat/`,
   `tour/hatsu.ts`, `lib/nen`) — la dérive que l'ADR nomme : chaque mode
   réinvente coûts, conditions et contres, donc chaque mode a ses propres bugs
   de règles.

Le rapport Hunt V3 est honnête sur sa propre limite : « candidate fonctionnelle,
**non promouvable** ». Il faut appliquer ce verdict aux cinq modes.

---

## 2. La règle nouvelle : la définition exécutable de « jouable »

> **Un mode est jouable quand son parcours canon de référence passe en CI sur
> desktop ET mobile, et qu'un humain qui ne l'a pas codé le termine sans aide.**

Le « parcours canon de référence », dans l'esprit de `hatsu-potentiel.md` (chaque
vague = une scène canon rejouable comme test d'acceptation) : pour chaque mode,
**la** partie de dix minutes qui doit marcher, écrite comme un scénario nommé —
choisir, jouer trois actions significatives, atteindre une fin (victoire, défaite
ou sauvegarde), rejouer le replay. Ce scénario devient :

- un test Playwright (le contrat machine),
- le script du tutoriel (le contrat humain — même scénario, raconté),
- la démo de la page d'accueil du mode.

Un mode sans son parcours en CI n'est pas « release », quel que soit le doc.

---

## 3. Plan en quatre étapes (ordre imposé)

### Étape 1 — Rétablir le vert _(chantier 1 de l'ADR, ~2-3 j, gel des features)_

1. `pnpm typecheck` vert sur tout le workspace. Piste probable pour les
   « packages workspace non résolus » : les paquets se résolvent sur leur
   `dist/` — un `pnpm build --filter "./packages/*"` manquant, pas 297 vrais
   bugs. Vérifier avant de corriger à la main.
2. **Playwright entre en CI** (aujourd'hui : jamais exécuté). `hunt.spec.ts`
   d'abord ; tout rouge restant est soit corrigé, soit nommé (le spec fait déjà
   les deux — garder cette discipline).
3. Corriger le bug mobile de Hunt (contrôles inaccessibles sous le pli) : c'est
   le seul défaut qui exclut un support entier.
4. Inventaire des orphelins : tout composant écrit-jamais-monté
   (`AdvancedNenActions`…) est soit branché, soit supprimé — un composant
   fantôme est une promesse de bug.
5. Une ligne dans la CI : un doc `*-release.md` ne peut plus dire « réussi »
   sans lien vers le run CI qui le prouve.

### Étape 2 — Un mode à la fois, jouabilité d'abord _(la vraie correction, ~1 sem/mode)_

**Limite de travail en cours : un seul mode à la fois.** Les « travaux
concurrents » du rapport Hunt sont la cause directe du typecheck rouge.

Pour le mode en cours, dans cet ordre :

1. **Écrire le parcours canon de référence** (30 min, sur papier).
2. **Le jouer à la main.** Chaque endroit où on ne sait pas quoi faire = un
   bug d'apprentissage, prioritaire sur tout bug de mécanique.
3. **L'automatiser en Playwright** (desktop + mobile).
4. **Livrer l'Epic Apprentissage avant toute nouvelle mécanique** : but du jeu
   en une phrase à l'écran, commandes visibles, premier pas guidé — les
   backlogs les contiennent déjà, il suffit d'inverser leur priorité.
5. **Découper la page monolithique** en composants par phase de jeu
   (briefing / partie / verdict), l'état dans une machine par mode — la
   logique testée existe, elle attend juste une UI qui la respecte.

**Ordre des modes, du plus proche au plus loin de la barre :**

| #   | Mode              | Pourquoi cet ordre                                                                                              |
| --- | ----------------- | --------------------------------------------------------------------------------------------------------------- |
| 1   | **Hunt**          | RC déjà écrite, 4 parcours Playwright existants, 291 tests ; il manque le vert global, le mobile et le tutoriel |
| 2   | **Investigation** | moteur V3 solide et testé ; il manque la salle des affaires et le briefing (Epic 2 du backlog)                  |
| 3   | **Arena**         | release doc ambitieuse mais campagne/replays à re-vérifier contre un parcours humain                            |
| 4   | **Strategy**      | brouillard de guerre et diplomatie = beaucoup d'états ; exiger le parcours de référence avant d'en ajouter      |
| 5   | **Infiltration**  | le plus jeune, 3 missions ; le backlog Lot C (« Le rapport manquant ») **est** son parcours de référence        |

### Étape 3 — Un seul vocabulaire Nen _(chantier 3 de l'ADR — condition de sortie des bugs de règles)_

Les bugs « de règles » (coûts faux, contres incohérents entre modes) ne seront
définitivement clos que par l'unification : `arenaDefinition()` en dur,
`hunt/nen`, `tour/hatsu` deviennent des **projections des manifests
d'`ability-modules`** (pattern Morena : les règles dans le module, le mode =
renderer). Concrètement : ne plus corriger un coût dans un mode sans le
corriger dans le module — et à terme, ne plus pouvoir.

### Étape 4 — Tenir la barre _(gouvernance, permanent)_

- Un mode = un statut visible : `prototype` / `candidate` / `release`, affiché
  dans l'UI du mode (bandeau) tant qu'il n'est pas `release` — l'honnêteté du
  `robots.txt` sur les maquettes, appliquée aux jeux.
- `PUBLIC_FEATURES` (le mécanisme existe, `features.ts`) : un mode qui ne passe
  pas son parcours en CI peut être dépublié sans supprimer son code.
- Pas de nouveau mode tant que les cinq ne sont pas `release`.

---

## 4. Ce que ça donne concrètement cette semaine

1. [ ] Gel des features des cinq modes.
2. [ ] Typecheck vert (commencer par `pnpm build --filter "./packages/*"`).
3. [ ] Playwright en CI + bug mobile Hunt corrigé.
4. [ ] Parcours canon de référence de Hunt écrit, joué à la main, automatisé.
5. [ ] Hunt promu `release` selon la définition du §2 — et il devient l'étalon
       des quatre autres.
