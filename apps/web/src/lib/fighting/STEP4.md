# Étape 4 — fiabilité du PvP privé

Cette étape renforce le transport et la réconciliation des quarante combattants.
Elle ne modifie aucun pouvoir, prérequis, coût, équipement ou règle de collision.
Le moteur conserve `clash-combat-5` ; le protocole réseau devient
`clash-pvp-5:clash-combat-5`. Un client d’une autre version ne peut pas confirmer
la configuration du duel.

## Commandes retardées après une coupure

La manche ne suffisait pas à identifier une intention devenue caduque. Un paquet
envoyé avant une suspension pouvait arriver après la reprise de la même manche,
avec une séquence encore admissible, puis déplacer le corps ou lancer un Hatsu.

`AuthoritativeClashMatch` délivre maintenant un `inputEpoch` entier dans les vues
privées et les reçus. Cette génération augmente quand le serveur libère les
commandes maintenues et en attente : départ de manche, suspension, reprise ou fin.
Une suspension déjà constatée conserve sa génération au fil des observations.
Le serveur continue d’attribuer les séquences et ticks appliqués ; aucun numéro
de frame client ne devient une horloge de combat.

Les deux formes HTTP, `inputs` cumulatif et `input` individuel, exigent la manche
et la génération. Les commandes d’une ancienne génération reçoivent
`409 STALE_INPUT`, avant consommation de leur séquence. Les timestamps, patches
d’état et verdicts ajoutés à cette enveloppe sont refusés. Les méthodes internes
du registre gardent leur raccourci pour les bancs serveur ; la frontière HTTP
effectue toujours la validation stricte.

Le client annule ses anciens envois, vide les intentions privées et reconstruit
la présentation depuis la nouvelle vue. Un ancien reçu retardé ne peut pas
acquitter de nouvelles commandes. Une génération future ou une séquence au-delà
des envois effectués déclenche une resynchronisation.

Un changement de génération pendant le duel impose un retour au neutre. Le
client émet des entrées neutres et ignore les nouvelles actions jusqu’au
relâchement. Le panneau l’explique en français et en anglais. Quand la connexion
désactive les contrôles, `PvpDuel.svelte` libère aussi clavier et manette : une
touche relâchée pendant la suspension ne doit pas rester logiquement enfoncée.

## Flux muet et repli HTTP

Le flux SSE reste authentifié par en-tête, sans jeton dans l’URL. Si aucun
événement n’arrive pendant plus de 1 500 ms, le prochain passage du pump annule
son lecteur et ouvre un nouveau flux. Les callbacks d’un flux annulé ne peuvent
plus publier de vue. Le watchdog couvre aussi une ouverture qui n’aboutit pas.
Un flux sain est conservé ; un serveur qui ne propose pas SSE garde le repli HTTP.

Le client conserve son seuil de fraîcheur de 250 ms pour la prédiction et son
polling de secours. Le watchdog ne mesure ni le ping réel entre deux joueurs ni
la qualité d’Internet. Les plafonds de huit paquets, quatre requêtes actives,
vingt envois par seconde et huit intentions restent applicables.

## Choix de rollback et confidentialité

La réconciliation restaure la dernière vue privée validée et resimule les
intentions locales non appliquées dans une fenêtre maximale de douze ticks.
Le changement de génération détruit cet ancien journal, même si le navigateur
n’a reçu aucune vue « interrompu ». Les compteurs de réconciliation et de frames
resimulées sont consultables avec les diagnostics existants.

Cette reconstruction peut fournir uniquement position, mouvement, posture,
garde et animation du corps contrôlé. Le HUD, l’aura, les états de Nen, les
projectiles, impacts, sons, caméras et résultats consomment toujours l’autorité.
Les réactions confirmées prennent immédiatement la main ; les petits écarts de
position restent amortis. Les corrections importantes et changements de corps
reviennent directement au confirmé.

Le serveur ne réécrit pas ses ticks passés et le navigateur ne reconstruit pas
les actions cachées de l’adversaire. Ce n’est donc pas un rollback intégral des
deux joueurs. Une telle extension demanderait une autre conception du journal
autoritaire, des engagements irréversibles et des informations déjà révélées.
Les tests ci-dessous qualifient le modèle privé effectivement livré.

Les séquences actives de Parallel Future et Cat’s Name gardent leur affichage
confirmé. Une interruption réseau ne rembourse pas un coût, ne recrée pas une
charge, n’accepte pas un contrat et ne fournit pas l’équipement d’une page copiée.
La vision de 600 ticks reste réservée à son propriétaire. Les sons et cadrages
ne lisent jamais l’état resimulé ; une seconde vue du même impact ne les répète pas.

## Vérification

Depuis la racine :

```sh
pnpm --filter @black-whale/web exec vitest run src/lib/fighting/pvp \
  src/lib/server/clashPvp.test.ts src/lib/server/clashPvpInputs.test.ts \
  src/lib/server/clashPvpHttp.test.ts src/lib/server/clashPvpStream.test.ts \
  --maxWorkers=2 --minWorkers=1
PVP_CHECK_NO_WEBGL=1 node apps/web/scripts/check-fighting-pvp.mjs
pnpm lint
pnpm typecheck
pnpm test:ratchet
pnpm test -- -- --maxWorkers=3 --minWorkers=1 --testTimeout=20000
pnpm --filter @black-whale/web build
```

Le banc déterministe étend les seize confrontations de référence et quarante
confrontations réparties sur le roster à **0/50/100/150/300 ms de RTT simulé**,
avec gigue, reçus dupliqués et vues manquées. Chaque état serveur est confronté
au moteur de référence et le journal admis doit aboutir à la même empreinte en
replay. Les 1 600 confrontations et les 1 600 cas d’impacts/confirmations déjà
présents restent des régressions complémentaires.

`controlEpoch.test.ts` vérifie les quarante combattants sur les deux places :
intention admise puis abandonnée, paquet non reçu avant coupure, génération
stable pendant la suspension, reprise sans changement de l’état de combat et
refus des anciennes commandes sans consommer les nouvelles séquences. Une coupure
de 3 101 ms suspend ; au-delà de 30 secondes, l’abandon reste définitif et aucun
vainqueur de combat n’est créé. Un vrai client reçoit aussi ses réponses tardives
après avoir manqué les vues de suspension ; ses commandes maintenues restent
neutres jusqu’au relâchement.

`reconciliationSafety.test.ts` couvre vision réelle de Parallel Future, Cat’s
Name, Moonlight, page de Melody copiée et charge de Phinks, puis compare l’état
autoritaire avant/après libération des commandes. Il vérifie les informations
retirées de l’autre place, la projection visuelle et les sons/caméras d’un impact
dupliqué. `snapshotStream.test.ts` vérifie la relance d’un flux muet et la
conservation d’un flux sain.

Le contrôle navigateur utilise deux contextes séparés, reconnexion, rechargement,
commande réelle de Basho, ancienne génération refusée par HTTP et largeurs
1440/390/320 px. Le passage sans WebGL contrôle le réseau et le rendu de secours ;
il ne mesure pas le GPU. Les endpoints de production utilisent le protocole lu
dans les sources plutôt qu’une version ancienne codée dans le script.

Les relevés sont conservés dans
[`ui-tests/fighting-network`](../../../ui-tests/fighting-network/README.md).
Les essais sur deux machines et une connexion Internet réelle restent nécessaires
pour qualifier le ressenti ; les pertes applicatives simulées ne constituent pas
un test de pertes de paquets réseau physiques.

## Résultats du 17 novembre 2026

- **379 tests ciblés** passent dans quatre fichiers sur le poste partagé.
- Une copie basée sur `33c7df36`, avec les fichiers de l’étape 4 et sans les
  changements de combos simultanés, valide **3 820 tests réseau dans 18 fichiers**.
  Son typage web ne présente aucune erreur ; quatre avertissements préexistants
  restent dans la route Infiltration de cette base. Le lint des fichiers de
  l’étape 4 passe également.
- Les deux navigateurs et les quatre duels des vrais endpoints de production
  passent. Le serveur de test temporaire est ensuite arrêté.
- Le build de production, les 17 tâches de typage globales, les 17 contrôles du
  cliquet et le contrôle documentaire passent.

La suite globale exécutée sur le dépôt partagé ne peut pas être annoncée verte :
elle termine avec quatre échecs dans `movesets.test.ts`, `clashLearning.test.ts`
et `duelRules.test.ts`, pendant les modifications de combos en cours. Le contrôle
suivant des trois fichiers fait passer `movesets.test.ts` ; les trois autres
échecs subsistent. Le dernier lint global rencontre aussi six complexités trop
élevées dans les modules d’IA hors du périmètre réseau. Ces fichiers n’ont pas
été modifiés par cette étape. Les résultats isolés, les rapports globaux et les
limites de qualification sont distingués dans le relevé de référence.
