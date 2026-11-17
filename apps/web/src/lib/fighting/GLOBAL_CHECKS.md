# Reprise des vérifications globales

Le lot est qualifié sur `b82969186` et corrige les causes reproduites par les vérifications
monorepo. Il n’ajoute ni Hatsu, ni usage, ni équipement ou effet de Nen.

- **Cycle d’imports** : le handler de Longhi capturait une valeur non initialisée
  de `advanceMoonlightContract`. Le callback résout désormais la fonction lors
  de son appel. Le contrat existant continue à avancer ; aucun handler absent
  n’est ignoré. Le test de démarrage à froid couvre trois ordres d’import.
- **Observation** : `triggerHatsuAction` ne conservait que la source alors que
  l’acquisition exige aussi la frame d’observation et la technique. Il utilise
  maintenant le résultat complet de `witnessedHatsuState` et transmet le move ID.
  Les contrôles de visibilité existants restent appliqués ; une manifestation
  cachée ou inaccessible ne devient pas une information acquise.
- **Voconte** : les deux tests éditoriaux vérifient exactement les trois actions
  existantes de Door au lieu d’exiger un quatrième usage inventé. Les autres
  attentes de couverture sont conservées et les conditions inconnues le restent.
- **Références** : le ruleset passe à `clash-combat-20` ; les anciens replays sont
  refusés à l’import. Les archives précédentes restent intactes. Les 96 flux
  originaux sont réenregistrés, avec prémisses vérifiées et paquets identiques,
  dans [reference/v20](../../../ui-tests/fighting-reference/reference/v20/README.md).
  La vérification des checkpoints n’est ni retirée ni assouplie. Le solo suit
  sa règle existante de changement de version : sessions et records incompatibles
  ne sont pas repris ; les récits et titres obtenus restent conservés.
- **Rendu** : les finitions de chaussures et de sandales ignorent les pieds nus,
  qui n’ont pas les pièces de chaussures attendues. Les tests suivent les profils
  déjà déclarés de Biscuit et d’Hisoka, sans changer leurs apparences.
- **Traduction** : les quatre descriptions existantes de Padaille et Voconte
  reçoivent leur version française dans le catalogue éditorial.
- **Exécution des tests** : le web borne ses workers à trois, sans retirer de
  cas ni augmenter les délais existants, pour réduire la pression mémoire lors
  des matrices de combat et de la compilation des gros catalogues.
- **Lint** : les scripts Node écrivent leurs résultats sur stdout ; la logique
  d’interaction avec les objets est extraite en petites fonctions équivalentes.
  Les types des fixtures remplacent les cinq `any`. Aucune règle n’est désactivée,
  aucune exemption n’est ajoutée et aucune limite n’est élargie.

La suite globale est exécutée sur `b82969186` avec ces corrections, dans une
copie isolée des travaux non commités. L’intégration du lot cosmétique `5ec9b75a0`
est vérifiée séparément par les suites des expressions, de la présentation,
des figures, des victoires et des replays. Ce lot ne modifie pas la simulation.
La référence v20 conserve l’empreinte des sources lors de sa mesure ; la
revalidation stricte vérifie ses checkpoints avec le moteur intégré.

Commandes : `pnpm lint`, `pnpm test:ratchet`, `pnpm typecheck`, `pnpm test` et
build de production du web.


## Résultats du 17 novembre 2026

- `pnpm test` : 18 tâches réussies et 20 206 tests réussis, dont 18 667 tests
  web dans 682 fichiers. La matrice complète des 2 944 impacts réseau passe.
- Intégration cosmétique : 317 tests réussis dans huit fichiers, dont les
  quarante profils, les figures et les checkpoints des replays.
- `pnpm lint` : zéro erreur et zéro avertissement, sans règle ni exemption ajoutée.
- `pnpm typecheck` : 17 tâches réussies, sans erreur ; les quatre avertissements
  préexistants de la page Infiltration restent distincts.
- `pnpm test:ratchet` : 23 tests réussis.
- Build web de production réussi : plus gros chunk client de 479 416 octets,
  sous la limite inchangée de 500 000 octets.

La première passe à neuf workers avait dépassé les 30 secondes d’un test de
compilation sous la charge du poste. Avec trois workers, ce même test passe en
3,7 secondes ; son délai et ses assertions restent inchangés. La passe complète
réussie conserve tous les cas, y compris les matrices de combat et de réseau.
