# Clash — référence canonique des particularités de combat

Cette page est le point d’entrée du chantier de particularités du roster. Elle ne
transforme jamais une zone inconnue du manga en règle de combat. Les dégâts, les
coûts, les portées et les durées sont des réglages arcade ; les conditions, la
matière, les corps, les contrats et les informations privées restent des faits
distincts.

## Règles de non-invention

- Une technique martiale ne devient pas un Hatsu parce qu’elle occupe un bouton
  spécial.
- Une capacité inconnue reste inconnue : aucune balle d’aura pour Theta, aucun
  profilage générique pour Furykov, aucun effet offensif automatique pour Longhi.
- Un contrat exige ses conditions réelles. Une touche, le silence ou une animation
  ne valent jamais consentement.
- Un pouvoir portant sur un corps, un objet ou un lieu agit sur cette entité
  matérielle. Il ne devient pas un buff abstrait.
- Les perceptions privées restent privées en PvP, en replay et chez les
  spectateurs. Elles ne sont pas converties en prédiction de commandes.
- Une copie ou un prêt conserve les conditions, l’aura, le matériel et les limites
  de la technique d’origine.

Les interdictions exécutables par personnage sont centralisées dans
[`canonCombatRules.ts`](../apps/web/src/lib/fighting/canonCombatRules.ts). Les
contrats détaillés restent dans les movesets et
[`techniqueContracts.ts`](../apps/web/src/lib/fighting/techniqueContracts.ts).

## Matrice fonctionnelle

| Axe | Personnages | Contrat de jeu |
| --- | --- | --- |
| Perception privée | Rihan, Musse, Furykov, Lynch | Analyse fondée sur les manifestations attestées ; aucune lecture de l’input, des pensées ou d’un futur. |
| Contrats | Longhi, Judgment Chain, Seiyaku | Consentement, déclaration et violation sont des états explicites ; aucune signature forcée. |
| Corps | Camilla, Halkenburg | Cat’s Name reste post-mortem ; les consciences d’Halkenburg occupent des corps matériels sans soin ni duplication. |
| Espaces | Voconte, Yokotani | Door relie des huisseries physiques ; LSDF exige la planque, Morena et un intrus présenté. |
| Contacts | Terebellum | Blessure personnelle par la main gauche ; blessure d’autrui reçue à droite puis transmise à gauche. |
| Matière I | Machi, Kalluto, Zakuro | Fils, papier et sang restent des matières suivies, finies et attribuées à leur source. |
| Matière II | Hinrigh, Shizuku | Biohazard transforme des objets réels ; Blinky aspire ce qui est admissible sans drainer l’aura. |
| Corps et performance | Biscuit, Bonolenov, Feitan, Phinks | Forme naturelle, trous corporels, blessures reçues et rotations du bras droit ne deviennent pas des jauges génériques. |
| Techniques martiales | Saiyu, Leorio, Sayird, Theta, Kurapika | Les effets de Nen attestés sont séparés des coups, armes et déplacements physiques. |

## Intégration système

L’IA utilise les mêmes prédicats d’admission que le joueur. Les commandes PvP
sont sémantiques et validées ; les vues adverses et spectateur sont projetées
avant encodage. Les replays enregistrent les commandes et le ruleset, pas des
résultats inventés. Les tutoriels doivent décrire la condition canonique puis
identifier séparément l’adaptation arcade.

La référence de performance reproductible est produite par
[`run-combat-reference.ts`](../scripts/run-combat-reference.ts). Elle compare les
routes, ressources, positions et hashes de replay dans une copie isolée des
sources. Un changement de source ou de ruleset ne doit jamais être accepté comme
une simple variation visuelle.

## Vérification

Depuis la racine du dépôt :

```sh
pnpm --filter @black-whale/web exec vitest run src/lib/fighting/canonCombatRules.test.ts
pnpm --filter @black-whale/web exec vitest run src/lib/fighting
pnpm --filter @black-whale/web typecheck
pnpm exec tsx scripts/run-combat-reference.ts --frozen
```

Une livraison n’est certifiée que si les tests du personnage, ses copies/prêts,
ses vues PvP, son replay et sa présentation passent ensemble. Un module présent
dans le dépôt mais non branché dans le moteur ne compte pas comme livré.
