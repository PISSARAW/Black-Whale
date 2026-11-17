# Étape 5 : apprendre puis corriger une erreur

Cette étape complète le laboratoire et la reprise de contrôle des replays décrite
dans [PHASE9.md](./PHASE9.md). Elle ne modifie ni les pouvoirs, ni les coûts, ni les
conditions du Nen, ni les statistiques de combat.

## Cinq exercices supplémentaires

Les quinze exercices existants gardent leur ordre. `FIGHT_CURRICULUM` leur ajoute
cinq situations bilingues ; `FIGHT_LESSONS` conserve la liste historique.

| Exercice                  | Situation et validation                                                                                                           |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Anti-air                  | Kurapika touche réellement Hisoka en saut avec un lourd debout identifié comme anti-air par le moteur.                            |
| Déprojection              | Hisoka répond à la projection de Benjamin dans la fenêtre arcade existante de huit frames ; une esquive ne suffit pas.            |
| Confirmation              | Kurapika enchaîne léger debout puis lourd pour deux touches consécutives. Une confirmation perdue ramène à la première étape.     |
| Défense au coin           | Hisoka garde le lourd de Benjamin au coin gauche puis obtient une punition réelle avec un léger, après le blockstun.              |
| Réponse à une préparation | Hisoka observe une rotation réelle du bras droit de Phinks, puis l’interrompt avec un contact avant la première rotation achevée. |

Les réussites sont observées sur les frames de simulation. Afficher plusieurs fois
une même frame, attendre sans agir ou presser le bouton sans résultat ne suffit
pas. Les prémisses du laboratoire restent explicites : santé infinie pour répéter,
aura initiale à 90 et consommation finie, mannequin et positions imposés.

## Diagnostic vérifié et non exhaustif

Depuis un replay ouvert, « Comprendre et pratiquer depuis ce replay » propose un
point de vue P1 ou P2 et une analyse locale. Une seconde re-simulation vérifie le
fichier et ses checkpoints sans déplacer le curseur de la relecture affichée.
Aucun conseil n’est publié avant la fin de cette vérification. Une divergence,
un ancien ruleset, une annulation ou un dépassement du budget ne conserve aucun
repère partiel.

Deux observations sont proposées :

- Une attaque du joueur effectivement punie pendant sa récupération, avec retour
  avant son engagement pour comparer sa distance et sa décision.
- Une récupération adverse visible laissée sans réponse : sur une copie de l’état
  perceptible, le moteur essaie un léger pendant au plus 18 frames, sans nouvelle
  commande adverse. Seul un contact réellement reconnu comme punition produit un
  repère, et la séquence source doit laisser assez de frames libres pour ce test.
  Une réponse effectivement réussie dans le replay supprime ce repère.

Le second cas est une suggestion d’exercice avec une hypothèse annoncée, pas une
réponse garantie ou optimale. Seuls les coups ordinaires au sol sont recherchés.
Un adversaire non vu ou une attaque sous In sans Gyo ne produit pas cette suggestion.
Les pages cachées et les analyses privées ne servent pas à choisir une réponse.
Les vues PvP privées, spectateurs, prévisions et équipes sont refusées. Les fenêtres
de Parallel Future et de Cat’s Name sont exclues des observations, y compris les
transitions d’entrée et de sortie.

Le traitement avance par 24 paquets et peut être annulé. Il est limité à 18 000
paquets, 18 000 frames simulées, 80 essais de réponse et 20 repères. Les repères ne
conservent que le point de vue, le type, la manche, la frame, l’indice de paquet et
le délai mesuré ; ils ne stockent ni état de combat ni secret adverse.

« Revoir cette situation » choisit le paquet enregistré, puis le joueur utilise
« Reprendre le contrôle » une fois la reconstruction terminée. Le versus local
conserve les corps, ressources, préparations et engagements du véritable état,
avec P1 et P2 manuels. Les boutons existants permettent de répéter l’essai et de
revenir à la relecture. Aucun nouvel équipement, Hatsu ou crédit d’aura n’est fourni.

## Vérifications reproductibles

```sh
pnpm --filter @black-whale/web exec vitest run fightAdvancedLessons replayCoach fightLesson fightReplay
pnpm --filter @black-whale/web test:coach-ui
pnpm lint
pnpm test:ratchet
pnpm typecheck
pnpm test
```

`fightAdvancedLessons.test.ts` exerce les cinq réussites avec le vrai moteur et
leurs cas d’attente sans réussite. `replayCoach.test.ts` couvre les deux points de
vue, les lots de plusieurs frames, les 40 combattants, les checkpoints divergents,
les limites, l’annulation, la perception et l’essai depuis le repère.

La [fixture navigateur](../../../ui-tests/fighting-coach/README.md) compile les
composants de production et vérifie le parcours complet sans WebGL, en français
et en anglais, à 1280, 390 et 320 px. Ces essais automatisés ne remplacent pas une
séance d’apprentissage avec des débutants.

## Résultats du 17 novembre 2026

Le contenu de cette étape est vérifié séparément sur la base committée `8bf6bde3`,
sans les modifications de Nen et de navigation simultanées du dossier partagé :

- **140 tests ciblés** passent dans sept fichiers, dont 67 nouveaux cas pour les
  exercices et le diagnostic, avec les 40 combattants et les deux points de vue.
- Le parcours navigateur de l’étape passe en français et en anglais, à 1280, 390
  et 320 px, avec une vraie interruption de Phinks, diagnostic, relecture,
  reprise du contrôle, répétition, retour et annulation de l’analyse.
- Le contrôle historique de progression passe aussi : vingt exercices proposés,
  Ten, défi Gyo, capture et lecture vérifiée, import/export, persistance et Arcade.
- Le lint des fichiers du lot passe. Le typage web ne présente aucune erreur ;
  quatre avertissements préexistants restent dans la route Infiltration.
- Les **17 tests du cliquet et du contrôle documentaire** passent. L’index des
  tests est régénéré depuis le contenu du commit préparé.

La suite globale sur le dossier partagé termine avec **15 241 tests web réussis
et cinq échecs dans quatre fichiers** : `bill.test.ts`, `hatsuRegistry.test.ts`,
`kurapika.test.ts` et `training.test.ts`. Les autres tâches de test terminent
normalement. Ces échecs concernent la copie et la libération de capacités ou
l’historique des commandes, dont les règles ne sont pas modifiées par cette étape.
Le typage global de ce même dossier relève aussi trois erreurs dans
`chrolloPageEffects.ts` et `preparationPresentation.ts`. Le lint global rencontre
des erreurs dans les autres modifications de Nen, de protocole et d’interface en
cours ; l’erreur du script de cette étape a été corrigée puis contrôlée séparément.
Ces vérifications globales ne sont donc pas présentées comme vertes.
