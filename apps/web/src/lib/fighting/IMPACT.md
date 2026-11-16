# PvP : de la commande au contact confirmé

Le transport `clash-pvp-4` couvre directement les 40 identités du roster. Le
ruleset des replays reste inchangé. Le serveur conserve le moteur de combat,
son horloge à 60 Hz, ses fenêtres de cancel, ses buffers et ses conditions de Nen.

## Envoi et autorité

`pvp/inputPipeline.ts` retire l’attente de la réponse HTTP entre deux envois.
Chaque intention reçoit un numéro de paquet immuable. Un envoi transporte le
préfixe encore non confirmé et les nouvelles entrées, dans l’ordre. Une requête
plus récente peut ainsi réparer un envoi perdu avant le retour de son reçu.

Les limites sont explicites : 20 envois/s, rafale initiale de trois, quatre
requêtes actives, huit paquets non reçus et huit commandes au total dans cette
fenêtre et la file locale. L’enveloppe reste sous la limite HTTP de 8 192 octets,
y compris avec huit poèmes de 240 caractères Unicode. Le serveur garde les
empreintes exactes des 64 derniers paquets par place ; un ancien paquet identique
est un doublon sans effet, et un contenu différent sous le même numéro est refusé.
Une garde ancienne ne peut pas rétablir une touche déjà relâchée.

L’endpoint `inputs` renvoie seulement la place, le match, la manche et le prochain
numéro attendu. Il n’encode plus un état du monde pour chaque reçu. Les vues SSE
privées peuvent aussi confirmer la réception et libérer une requête dont la
réponse HTTP reste bloquée. Un reçu confirme la réception ; seul
`appliedSequence` dans une vue confirmée retire une intention de la prédiction.
Un préfixe admis avant un refus `BUSY` reste récupérable, sans abandon silencieux.

Chaque lot indique la manche connue du serveur. Un lot retardé d’une autre
manche est refusé avant admission. Le client vide son ancienne fenêtre au
changement de manche, même s’il a manqué les vues d’intermanche. Au relâchement
des contrôles, les intentions non envoyées sont annulées ; les paquets déjà
partis gardent leur numéro jusqu’à confirmation pour éviter un trou de séquence.

Les contrôles de connexion restent séparés des envois de combat. Le polling
prend le relais en l’absence de SSE ; un flux ouvert sans état frais depuis
250 ms déclenche aussi une resynchronisation. Les jetons restent dans les
en-têtes, avec les mêmes limites HTTP et les mêmes vues filtrées.

Aucun client n’envoie de tick, de position, de dégât, de ressource ou de verdict.
Les impacts, la garde, les coûts, les copies, les contrats, Parallel Future et
Cat’s Name restent arbitrés par le serveur. La présentation prédite conserve
ses limites et ses replis confirmés ; ce transport n’ajoute pas de rollback du
combat ni de compensation rétroactive des touches.

## Vérifications du combat

`pvp/impactNetwork.test.ts` vérifie **1 600 scénarios** : les 160 routes de combos
et les 40 exercices garde/punition, sur les deux places, avec RTT de
0/50/100/150 ms, jitter, envois perdus, reçus supprimés et vues manquées.

Les traces contiennent des entrées temporellement définies, sans transmettre
leur horaire au serveur. Les contacts proviennent de la simulation autoritaire :
ordre des coups, compteur du combo, garde réelle et punition réelle. Un moteur
local indépendant reçoit les commandes effectivement admises ; ses empreintes
sont comparées au serveur. Le journal est ensuite resimulé jusqu’à la même
empreinte finale. Une animation prédite ne valide jamais une touche.

Ce banc vérifie l’exécution sous transport retardé. Il ne simule pas une personne
qui attend chaque confirmation visuelle distante avant de choisir sa prochaine
entrée. Cette attente peut toujours dépasser une fenêtre courte ; les règles du
moteur continuent alors à refuser le cancel. Une validation entre joueurs sur
deux machines et un réseau réel reste distincte.

La campagne large a passé **7 151 tests dans 35 fichiers** : roster et 1 600
paires, anciens profils réseau, combos, défense, Nen partagé, personnages de
référence, copies, Hanzo, futur parallèle, post-mortem et replays. Après le
durcissement du banc et de la séparation des manches, les 1 600 scénarios réseau
ont été rejoués avec succès et les contrôles d’intégration ont été revérifiés.
Ces campagnes se recouvrent et leurs nombres ne s’additionnent pas.

Le build SvelteKit de production passe. Le typage du périmètre passe sans erreur
ni avertissement ; le typage global passe sans erreur, avec quatre avertissements
préexistants dans la page d’infiltration. Les limites de code et le cliquet
ADR-002 passent sur ce changement.

## Comparatif déterministe avant / après

`scripts/check-fighting-impact.mjs` compare les 16 routes de Kurapika, Hisoka,
Chrollo et Benjamin. Le budget d’envoi et les entrées sont identiques ; « avant »
attend chaque reçu HTTP, « après » utilise le pipeline. Le jitter est conservé ;
les pertes sont réservées à la campagne de régression ci-dessus.

| RTT simulé | Application serveur p95 avant → après | Routes complètes avant → après |
| ---------- | ------------------------------------: | -----------------------------: |
| 0 ms       |                              0 → 0 ms |                        16 → 16 |
| 50 ms      |                         116,7 → 50 ms |                        12 → 16 |
| 100 ms     |                         150 → 66,7 ms |                        13 → 16 |
| 150 ms     |                        250 → 116,7 ms |                        11 → 16 |

Ces délais vont de la mise en file à la consommation effective par le moteur.
Ils excluent l’observation de la confirmation côté client et le matériel.
Les routes aériennes incluent leur saut ordinaire ; aucun état de combat n’est
injecté à l’arrivée pour forcer un résultat.

## Mesures navigateur

Le banc `check-fighting-response.mjs` ajoute une mesure distincte : mise en file,
envoi, observation de l’application et observation du contact dans la vue privée.
Chaque coup est isolé, approché par les déplacements ordinaires et réellement
gardé par l’adversaire. La mesure de contact inclut le startup du coup, le trajet
retour et l’ordonnancement ; elle ne représente pas une latence manette-écran.

`RESPONSE_SERIAL_COMMIT=ce85118e` remplace effectivement le seul module client
par sa version commitée, avec assertion du remplacement. Le moteur, la scène,
la prédiction visuelle et le proxy sont identiques. `RESPONSE_AFTER_ONLY=1`
évite l’ancien scénario historique sans prédiction décrit dans REACTIVITY.md.

La campagne des 40 personnages valide **200 contacts gardés sur 200**
**27 490 frames** une cadence de **60 00 FPS** pour chaque cas et
**aucun intervalle supérieur à 25 ms**. L’intervalle maximal est de
**16,8 ms**. Les 40 paires sont également vérifiées via les
vrais endpoints SvelteKit et leurs deux places privées sans modifier les
limites de fréquence de production.

Le comparatif navigateur des quatre références, avec cinq essais par cas, donne :

| Personnage | Envoi p95 avant → après | Contact confirmé observé p95 avant → après |
| ---------- | ----------------------: | -----------------------------------------: |
| Kurapika   |          41,4 → 14,6 ms |                           257,5 → 227,1 ms |
| Hisoka     |          60,6 → 12,0 ms |                           253,7 → 175,9 ms |
| Chrollo    |          94,9 → 11,2 ms |                           296,8 → 208,0 ms |
| Benjamin   |          61,0 → 15,6 ms |                           248,7 → 207,6 ms |

Sur le roster complet, l’envoi p95 par cas varie de **7,6 à 84,9 ms** ;
le maximum vient d’un essai de Kalluto. Ce passage ne garantit donc pas un
départ sous une frame dans toutes les situations, malgré la cadence stable.
Les quantiles portent sur ces essais courts et incluent l’ordonnancement du
poste. Le contact observé et l’application serveur du tableau déterministe
mesurent deux étapes différentes ; leurs valeurs ne sont pas interchangeables.

Les résultats de la campagne courante sont consignés dans
`ui-tests/fighting-response/reference/impact-2026-11-17.json`. Les conditions de référence sont Apple M5 / 16 Go,
Chrome / ANGLE Metal, secteur, deux contextes privés dont un seul rend WebGL,
salle de banquet avec bloom, DPR 2 plafonné à 1,75, RTT imposé de 100 ms avec
jitter et pertes applicatives. Chaque personnage effectue cinq coups en dix
secondes nominales, après échauffement. L’approche ajoute du temps mesuré.

Ce passage ne couvre pas simultanément les 1 600 paires au GPU, tous les effets
de Hatsu ni le comportement physique d’une manette. Aucun réglage graphique
n’est réduit par ce changement.

## Reproduire

Depuis `apps/web` :

```sh
pnpm exec vitest run src/lib/fighting/pvp src/lib/server/clashPvpInputs.test.ts \
  src/lib/server/clashPvp.test.ts src/lib/server/clashPvpHttp.test.ts \
  src/lib/server/clashPvpStream.test.ts --maxWorkers=1 --minWorkers=1
IMPACT_OUTPUT=/tmp/clash-impact node scripts/check-fighting-impact.mjs
RESPONSE_AFTER_ONLY=1 RESPONSE_IMPACT=1 RESPONSE_SERIAL_COMMIT=ce85118e \
  RESPONSE_SECONDS=10 RESPONSE_WARMUP_MS=3000 RESPONSE_OUTPUT=/tmp/clash-before \
  node scripts/check-fighting-response.mjs
RESPONSE_ROSTER=1 RESPONSE_AFTER_ONLY=1 RESPONSE_IMPACT=1 \
  RESPONSE_SECONDS=10 RESPONSE_WARMUP_MS=3000 RESPONSE_OUTPUT=/tmp/clash-after \
  node scripts/check-fighting-response.mjs
# Après compilation et démarrage du serveur SvelteKit :
RESPONSE_BASE_URL=http://127.0.0.1:4197 \
  node scripts/check-fighting-response-endpoint.mjs
```
