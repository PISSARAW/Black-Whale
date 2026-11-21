# Phase 8 : carrière, saisons et présentation

`/fighting/profile` rassemble le profil local et la saison PvP ;
`/fighting/tournament` porte le tableau de tournoi. Le menu de Clash et le
laboratoire d’apprentissage donnent accès à ces pages.

L’[étape 6](./STEP6.md) ajoute `/fighting/pvp/online` : identité récupérable,
historique serveur et statistiques par personnage, files non classée et classée,
séries vérifiées et tournois en ligne. Le tournoi local ci-dessous garde sa saisie
manuelle et reste distinct du tableau en ligne alimenté par le serveur.

L’[étape 7](./STEP7.md) ajoute `/fighting/profile/solo` : parcours scénarisés,
Survie, Contre-la-montre et Score Attack. Les récits, titres et records restent
locaux ; les états marqués `soloSession` sont exclus de la carrière de duel.

## Historique et maîtrise

`career/profile.ts` conserve le pseudo, trois habillages, les préférences de
présentation et les 200 derniers matchs dans `localStorage`. Les totaux des
quarante personnages survivent à l’éviction des anciens matchs ; un journal
borné de 2 000 identifiants empêche de recompter les résultats récents.
Une révision permet de reprendre les résultats écrits par un autre onglet avant
une nouvelle écriture. Un stockage bloqué laisse la session fonctionner.

Le profil suit P1 en jeu local et le propriétaire de l’écran en PvP, y compris
s’il occupe la deuxième place. Seul un match terminé par le verdict ordinaire
en deux manches gagnantes donne de la pratique. Les manches seules, les duels
quittés, les démonstrations du laboratoire et les replays importés ou relus
n’accordent pas de progression.

`career/practice.ts` observe les états réels. Les compteurs de combo sont ceux
de la cible dans le moteur ; ils sont donc attribués à l’attaquant dans le profil.
Les PV perdus sont les diminutions effectives de la santé du propriétaire,
y compris les coûts physiques ; ce n’est pas une attribution de dégâts à un
adversaire. Les soins et résurrections n’annulent pas les pertes déjà observées.
Le temps est celui du chronomètre effectif. Les frames de prévision sont exclues.

`career/runtime.ts` est un observateur optionnel du runtime local. Le lecteur de
replay ne l’appelle pas. En PvP, les mesures viennent du serveur ; le client ne
les enregistre qu’après vérification de l’instantané terminal et les réoriente
vers sa propre place. La collecte ne modifie ni la simulation, ni la graine.

La maîtrise vaut 20 points par match terminé, cinq par manche gagnée et au plus
20 pour le meilleur combo. Le niveau est borné à 20. Ces nombres représentent
de la pratique de jeu : aucun niveau, habillage ou résultat ne fournit d’aura,
d’équipement, de Hatsu, de statistiques ou de conditions acquises.

## Fatigue morale entre les matchs

Le résultat décisif le plus récent de chaque combattant laisse un résidu au début
de son prochain duel de carrière. Une défaite sévère 0–2 ajoute temporairement de
l’appréhension ; une victoire nette 2–0 ajoute de la résolution. Le résultat d’un
autre combattant, un match serré, l’entraînement, les parcours solo et les équipes
n’appliquent rien. L’état est annoncé sur la carte d’ouverture, puis se dissipe par
la récupération psychologique ordinaire du combat. Le résultat est marqué comme
consommé au lancement : quitter ce duel ne reporte pas son résidu sur le suivant.

## Saison PvP partagée

L’inscription est volontaire et distincte du pseudo local. `clashSeasons.ts`
émet une identité et un jeton opaques ; seul le jeton est utilisé pour retrouver
l’identité lors de la création ou de la prise d’une place PvP. Les identités
sont fixées dans le salon avant le combat. Les en-têtes des requêtes ultérieures
ne permettent pas de changer le bénéficiaire du résultat.

Seul `ClashPvpRegistry` transmet les verdicts terminaux à la saison. Deux profils
inscrits distincts sont nécessaires. Une manche, un abandon, un résultat manuel
de tournoi ou des données locales ne modifient pas ce classement. Le résultat
est appliqué une seule fois. Les points commencent à 1 200, avec un ajustement
Elo de facteur 24 ; les gains et pertes sont équilibrés entre les participants.
Chaque mois UTC ouvre une nouvelle saison. Le tableau montre les cent premières
entrées ; les jetons n’y sont jamais exposés.

Ce classement est celui d’une instance du serveur, avec des pseudonymes et sans
comptes ou matchmaking. La [phase 9](./PHASE9.md) conserve désormais les identités,
saisons et reçus de résultats sur disque, avec des jetons hachés. Les salons de
combat restent en mémoire ; leur redémarrage invalide les invitations en cours.
Douze saisons, 5 000 identités et 50 000 résultats par saison bornent le registre.
L’historique de pratique local reste dans le navigateur.

## Spectateurs et invitations

Le créateur dispose d’un lien spectateur distinct. Le protocole passe à
`clash-pvp-2` : l’invitation de joueur contient désormais son propre secret,
indépendant du secret de visionnage et des jetons des deux places. Un détenteur
du seul lien spectateur ne peut pas rejoindre le salon, confirmer, commander ou
produire un résultat. Un ancien client est refusé par le contrôle de version.

`pvp/spectator.ts` prépare une vue commune à partir des corps réels, sans utiliser
les branches de Parallel Future. Les observations privées des deux places,
buffers, pages conservées, visions et réponses de Lynch sont retirés. Les
réserves d’aura sont masquées. Les projectiles de Nen et le lien dissimulés ne
sont pas envoyés ; les objets physiques restent visibles. Le HUD indique une
vue publique, sans sélecteur Gyo/En ni panneaux de commandes. Ce filtre ne
constitue pas un système général de dissimulation de toute la géométrie.

Les requêtes spectateur peuvent faire avancer l’horloge réelle du serveur, mais
ne servent jamais de présence à un joueur. Elles ne permettent pas de reprendre
un combat interrompu ou de retarder son abandon. Le jeton de visionnage reste
dans le fragment du lien, puis dans l’en-tête d’autorisation de la requête.

## Tournois locaux

`career/tournament.ts` crée un tableau à élimination directe pour deux à seize
participants distincts. L’ordre des graines répartit les exemptions ; seuls
deux adversaires connus peuvent produire un résultat manuel. Les vainqueurs
avancent, une finale produit un champion et un résultat déjà saisi ne peut pas
être remplacé. Le chargement reconstruit une progression légale au lieu de faire
confiance à un champion enregistré dans un fichier modifié.

Le tableau est conservé dans ce navigateur. L’organisateur saisit les résultats
de ses duels ; cet outil n’est pas relié à la saison ni à une autorité de tournoi
en ligne. Remplacer le tableau est une action explicite dans son formulaire.

## Présentation et conditions du Nen

Trois thèmes changent le cadre et les cartes de cérémonie. Les introductions
peuvent être complètes, brèves ou coupées. Les dialogues sont des textes
originaux de Clash, disponibles pour les quarante personnages et présentés comme
tels ; ils ne lisent ni page cachée, ni analyse, ni manifestation dissimulée.
Les boutons ordinaires de départ et de manche restent utilisables immédiatement.

Les poses salut, garde et repos modifient uniquement le rig rendu après le
verdict. Le corps doit être vivant et libre : attaque, projection, liens, mains
occupées ou manipulation conservent leur animation native. Cat’s Name ne reçoit
aucune pose de victoire avant sa résolution. `sceneReaction.ts` extrait la
sélection de réaction précédente sans en changer le comportement. Les animations
de carte respectent la préférence système de mouvement réduit. Les cadrages et
effets cinématiques existants restent indépendants de ces choix de profil.

## Vérification

- `career/*.test.ts` : persistance, mesures, maîtrise, replays exclus, tableaux,
  dialogues et poses sur un rig, avec invariance de l’état de jeu.
- `server/clashSeasons.test.ts` : identités, saison UTC, résultats uniques et
  classement après deux vraies manches résolues par le serveur.
- `pvp/spectator.test.ts` : séparation des secrets, perte de présence et retrait
  des informations privées / de la vision de Parallel Future.
- `node scripts/check-fighting-career.mjs` depuis `apps/web` : profil et
  préférences, match réellement terminé, inscription de saison, tournoi,
  rechargement, anglais et vue spectateur aux largeurs 1440, 390 et 320 px.
  Ce parcours utilise le rendu de secours par défaut ; `CAREER_CHECK_WEBGL=1`
  permet d’y inclure les modèles WebGL.
- `PVP_CHECK_NO_WEBGL=1 node scripts/check-fighting-pvp.mjs` : régression des
  deux places, des nouvelles invitations et de la reconnexion.
