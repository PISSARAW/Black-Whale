# Étape 6 : services compétitifs

`/fighting/pvp/online` rassemble recherche d’adversaire, séries non classées et
classées, récupération d’identité, historique serveur et tournois en ligne. Les
pages de profil, de duel privé et de tournoi local y donnent accès. Le duel
autoritaire, ses commandes et les conditions des quarante personnages restent
ceux des [étapes réseau](./STEP4.md). Aucun pouvoir ni bonus de Nen n’est ajouté.

## Identité récupérable

Le code opaque des identités de saison sert à retrouver la même identité sur un
autre navigateur ou après redémarrage du serveur. L’écran permet de le conserver
dans un fichier privé, de saisir le code ou d’importer ce fichier. La récupération
interroge le serveur : un pseudo ou un identifiant local ne suffit pas. Les codes
sont envoyés dans les en-têtes, jamais dans les URL. `seasons.json` conserve leurs
empreintes SHA-256 ; les jetons de place ne sont pas écrits dans le nouveau journal.

Cette identité est pseudonyme et liée à son code, sans compte d’e-mail ni preuve
qu’une personne ne possède qu’une seule identité. Un stockage navigateur bloqué
laisse la session fonctionner ; il faut conserver le code pour la retrouver.

## Recherche et séries

Chaque identité choisit un personnage, une file et une tolérance de connexion de
100, 200, 300 ou 500 ms. Une sonde aléatoire, à usage unique et liée à l’identité,
mesure le trajet serveur → client → serveur avec l’horloge serveur. Le client ne
peut pas fournir son propre chiffre. Les mesures incluent le temps applicatif ;
elles ne sont ni une mesure du ping entre deux personnes ni une garantie de jeu
sur Internet. Les essais navigateur utilisent une horloge contrôlée, sans
qualification de latence matérielle.

Deux mesures datant d’au plus trente secondes et dont la somme respecte les deux
tolérances sont nécessaires. Le client renouvelle sa mesure toutes les vingt
secondes en attente. Sans présence entrante pendant quinze secondes, une entrée
de file expire. Un même profil ne peut pas occuper les deux places ou rechercher
un autre adversaire pendant sa série ou son inscription à un tournoi actif.

Les files non classée et classée restent séparées. La seconde commence avec un
écart Elo maximal de 150 points, élargi de 25 points par quinze secondes jusqu’à
400 points. Chaque participant reçoit exclusivement le jeton de sa propre place.
Le rechargement et la récupération d’identité retrouvent cette place tant que le
coordinateur et le match sont présents.

Une série se joue au premier à **deux matchs gagnés**. Chaque match conserve les
manches du moteur ordinaire. Le terrain commun est la Tour Céleste sans
interactions, avec la préparation normale du duel. Les deux joueurs confirment
la configuration dans l’écran PvP existant. Une nouvelle rencontre crée un duel
ordinaire ; elle ne copie pas une vue privée ou une prévision du navigateur.

Le registre appelle l’observateur compétitif uniquement sur un verdict terminal.
La commande HTTP n’accepte ni vainqueur, ni score, ni patch d’état, ni classement.
Les matchs non classés et les tournois en ligne ne donnent pas de points Elo.
Une série classée complète fournit un seul résultat de saison, avec le facteur
24 existant. Les invitations privées entre deux profils inscrits conservent leur
comportement de classement antérieur ; elles ne passent pas par la file non classée.

## Interruptions et journal durable

La perte de présence suspend toujours le duel après trois secondes et laisse les
trente secondes de grâce existantes. Après le début d’un match ou un premier
résultat de la série, une déconnexion unilatérale définitive ou un départ
volontaire produit un **forfait de série**, distinct d’une victoire par K.-O.
Les PV, le corps et le `matchWinner` du moteur ne sont pas remplacés par ce forfait.
L’absence des deux places n’attribue pas arbitrairement un vainqueur.

Une rencontre de file non commencée expire après deux minutes sans inventer de
résultat. Un retrait volontaire d’une rencontre de tournoi constitue un forfait
explicite du participant. L’historique conserve séparément combats, forfaits et
tentatives interrompues. Les statistiques par personnage comptent les matchs
réellement terminés ; les forfaits disposent de leur propre compteur.

`competition.json` conserve les séries, scores, reçus, inscriptions, tableaux et
signalements. Le fichier privé est synchronisé puis remplacé atomiquement. Un
échec d’écriture ne publie pas le résultat compétitif comme enregistré et peut
être retenté. Le journal est écrit avant l’Elo ; un accusé de comptabilisation
permet de reprendre une écriture partielle sans doubler les points. Le reçu garde
le mois UTC de fin de série même si la reprise a lieu le mois suivant.

Après redémarrage, les résultats écrits et les scores de série restent présents.
Le match qui était encore en cours est marqué interrompu, sans vainqueur ni
sanction de déconnexion. Les participants peuvent préparer un nouveau match de
la même série. Les files en attente expirent et peuvent être relancées. Une
sauvegarde endommagée rend le service indisponible au lieu de créer un historique
vide. Un salon disparu du registre volatile est traité comme une interruption.

## Tournois, diffusion et signalements

Un propriétaire ouvre des inscriptions et partage une invitation distincte du
tableau public. Deux à seize identités rejoignent volontairement le tournoi avec
leur personnage. Le propriétaire peut démarrer ou annuler les inscriptions ; il
ne peut pas saisir de vainqueur. Les exemptions utilisent le tableau existant.
Une rencontre attribuée crée une série serveur ; seul son résultat réel ou un
forfait explicitement identifié fait avancer le tableau. Au chargement, celui-ci
est reconstruit à partir des reçus de séries, sans croire un champion enregistré
arbitrairement dans le fichier.

`/fighting/pvp/online/tournament/[id]` présente noms, tours et scores pour la
diffusion. Cette vue ne reçoit ni jetons de places, ni invitation d’inscription,
ni corps de simulation, aura, pages cachées ou branches de Parallel Future.
Regarder le tableau ne renouvelle aucune présence de joueur. Les liens spectateur
de combat existants restent des liens à partager volontairement, avec leur filtre
public de Nen inchangé.

Un participant peut signaler comportement, connexion ou suspicion de triche pour
sa série. Le serveur déduit l’autre participant, limite à un signalement par
personne et par série, et à dix par heure. Ces signalements privés sont conservés
pour l’opérateur ; ils ne changent ni verdict ni classement et ne constituent pas
des accusations publiques ou un système de sanctions automatiques.

Les commandes restent bornées à 8 Kio. Les routes compétitives ont des limites
par adresse et par identité, en complément des protections du transport PvP.
Une ancienne réponse du navigateur ne doit pas rétablir une recherche annulée ou
remplacer les données de l’identité nouvellement récupérée.

## Déploiement et capacités

Le déploiement cible reste **un coordinateur Node unique**, propriétaire des
salons en mémoire et d’un volume durable `CLASH_DATA_DIR` absolu, conservé et
sauvegardé entre versions. Les fichiers ne constituent pas une base pour des
workers concurrents ; aucun déploiement multi-instance n’est annoncé.

Les bornes sont explicites : 200 recherches, 1 000 sondes récentes, 100 salons
PvP, 10 000 séries conservées, 500 tournois et 5 000 signalements. L’écran montre
les cent dernières séries du propriétaire. Les statistiques couvrent les séries
conservées. Les anciens essais sans verdict peuvent être élagués pour conserver
au plus 32 événements par série ; les vrais résultats et le score restent intacts.
Les bornes de douze saisons et 5 000 identités restent celles du classement.
L’opérateur doit prévoir l’archivage avant saturation ; une capacité pleine
refuse l’admission au lieu d’effacer les résultats. Aucun repli sur un résultat
calculé par le navigateur n’est prévu.

## Vérification

```sh
pnpm --filter @black-whale/web exec vitest run src/lib/server/competition clashPvp clashSeasons clashSeasonFile
pnpm --filter @black-whale/web test:online-ui
pnpm lint
pnpm test:ratchet
pnpm typecheck
pnpm test
```

Les tests utilisent de vraies commandes et collisions du serveur pour terminer
des matchs. Ils couvrent séparation des files, sonde non falsifiable par une
valeur client, propriétaires des places, roster, saison UTC, écritures partielles,
redémarrage, corruption, forfaits, résultats de tournoi et absence de secrets dans
le tableau public. Le [contrôle navigateur](../../../ui-tests/fighting-online/README.md)
utilise quatre contextes isolés, FR/EN et les largeurs 1280, 390 et 320 px.

## Résultats du 17 novembre 2026

Une copie de la base committée `abce3da8`, complétée uniquement par cette étape,
valide les changements indépendamment des travaux simultanés du dossier partagé :

- **134 tests dans onze fichiers**, dont 94 cas des nouveaux services et les
  régressions existantes des salons, commandes HTTP, flux, saisons et fichiers.
- Le contrôle navigateur complet passe dans quatre contextes isolés : deux vrais
  matchs terminent une série classée, l’Elo compte une seule fois, le code retrouve
  l’identité après redémarrage et le tableau suit un forfait serveur explicite.
  Les contrôles FR/EN et 1280/390/320 px passent sans débordement ni erreur navigateur.
- Le lint de tous les fichiers du lot passe. Le typage de cette copie ne présente
  aucune erreur ; quatre avertissements antérieurs restent dans Infiltration.
- Le build de production avec l’adaptateur Node passe. Les vingt tests du cliquet
  et du contrôle documentaire de cette copie passent. Les index des routes et des
  tests sont régénérés depuis le contenu préparé du commit.

Sur le dossier partagé, les **17 tâches de typage globales** passent sans erreur
ni avertissement web, et les **22 tests du cliquet et des contrôles documentaires**
passent. La suite globale termine avec **16 893 tests web réussis et six échecs**
dans `bill.test.ts`, `kurapika.test.ts`, `sayird.test.ts` et `training.test.ts`.
Ces échecs concernent les capacités copiées ou retenues et les commandes de combat,
dont les règles ne sont pas modifiées par cette étape. Les autres tâches de test
terminent normalement. Le lint global de cette exécution relève huit erreurs de
console dans cinq scripts de cinématiques hors du lot, et trois avertissements
de types dans leur fixture. Ces résultats globaux ne sont pas annoncés verts.
