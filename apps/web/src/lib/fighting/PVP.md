# Clash : PvP privé (phase 7)

La [phase 8](./CAREER.md) ajoute les saisons, le profil, la vue spectateur et des
secrets séparés pour rejoindre ou regarder. Le protocole `clash-pvp-5` inclut le ruleset moteur courant ;
les descriptions de l’autorité et des conditions de combat ci-dessous restent valables.

L’[étape 4](./STEP4.md) ajoute les générations de commandes après suspension,
le retour au neutre, le watchdog SSE et les essais jusqu’à 300 ms de RTT simulé.

Depuis « Jouer en duel privé », `/fighting/pvp` crée une invitation pour deux
joueurs. Les quarante personnages, les trois formats, les arènes, les ressources
scénarisées, les aiguilles et la juridiction de LSDF utilisent les configurations
ordinaires de Clash. L’invité reçoit la deuxième place ; les deux joueurs
confirment la même configuration avant le duel, puis avant chaque nouvelle manche.

## Autorité et commandes

`pvp/serverMatch.ts` exécute le moteur existant en versus local, sans IA. Le serveur
avance à pas fixes de 60 Hz selon sa propre horloge. Les deux lots de commandes
sont appliqués avant la résolution commune des échanges : les impacts simultanés,
Cat’s Name, les copies, contrats et branches de Parallel Future gardent leurs
règles. Seul le moteur attribue les manches et le match. Un résultat envoyé par
un navigateur n’entre pas dans le protocole.

Le transport HTTP envoie au plus huit commandes par requête et seize commandes
en attente par place. Les entrées maintenues expirent après 250 ms sans nouveau
paquet. Chaque place possède une séquence croissante ; un reçu perdu peut être
redemandé avec le même paquet sans exécuter ni payer une seconde fois l’action.
Une réutilisation du numéro avec un autre contenu est refusée.

Les enveloppes HTTP doivent aussi fournir la manche et l’`inputEpoch` courant
délivré par le serveur. Une ancienne génération est refusée après reprise, même
dans la même manche. Le client vide alors les intentions anciennes et exige le
relâchement des commandes ; un ancien reçu ne peut pas acquitter un nouvel envoi.

`pvp/commands.ts` couvre les coups, Emperor Time, appels au corps, Easter Eggs,
actions nommées de Battle Cantabile, parole, Blinky, papier de Kalluto, Bloody Mary, poème,
offre/réponse Moonlight et questions de Lynch. Le serveur déduit le camp du jeton.
Les commandes de panneaux sont sémantiques : les patches d’état des replays,
les coordonnées, les ressources, les ticks et les verdicts clients sont refusés.
Les gestes passent par les actions et conditions ordinaires du Nen. Un livre
copié ne crée ni flûte, ni aiguilles, ni partisans.

## Synchronisation et perception

La version `PVP_RULESET` inclut celle du moteur/replay. Toute modification des
règles doit changer cette version. L’empreinte de configuration inclut le roster,
les règles, le terrain et la préparation ; les propriétés optionnelles absentes
et `undefined` ont la même représentation réseau. Les clients incompatibles ou
qui confirment une autre empreinte ne démarrent pas le match.

Chaque réponse contient une révision croissante, un tick et une empreinte de l’état autoritaire commun,
ainsi qu’un instantané propre au destinataire et son empreinte. Le client valide
l’identité, la structure et l’empreinte avant affichage ; une incohérence suspend
les nouvelles commandes, puis demande un instantané frais. Ces empreintes
détectent les divergences ; ce ne sont pas des signatures cryptographiques.

`pvp/view.ts` applique la perspective de Parallel Future avant transmission.
L’autre joueur ne reçoit pas cette vision. Les réponses de Body and Soul,
Secret Window, Melody Hearing, Combo Master, l’analyse de Predator, les paroles
rapportées par le papier, le buffer adverse et les pages conservées dans le livre
restent privés. Les mêmes retraits sont appliqués aux frames de vision.
Les projectiles et liens cachés suivent la perception de Gyo/En ; une attaque
dissimulée ne livre pas son identité sans Gyo. Cela ne constitue pas un système
général de dissimulation de tout l’état du monde : le client reçoit encore la
géométrie nécessaire au rendu, notamment les positions corporelles.

Les vues sont réorientées pour que chaque joueur utilise ses commandes P1, y
compris clavier remappable, manette et tactile. Les propriétaires, cibles et
verdicts sont réorientés avec eux ; les textes prononcés restent inchangés.
Le champ de présentation `pvpSeat` conserve la véritable place. Le mode
`versus-ai` de cet instantané sert uniquement à verrouiller les panneaux et
sélecteurs de perspective sur son propriétaire ; aucun client ne simule d’IA.
Le HUD affiche les deux places humaines.

## Connexion et durée de vie

Les jetons opaques restent dans `sessionStorage`, séparés du lien d’invitation.
Les réponses API ne sont pas mises en cache, les requêtes sont bornées en taille
et en fréquence. Le rechargement de la page restaure la même place et la prochaine
séquence. Le ping affiché mesure l’aller-retour HTTP ; ce n’est pas une mesure
de latence entre les deux personnes.

Avant le premier départ, le salon laisse le temps de préparer les écrans ; les
deux confirmations et les deux connexions doivent être présentes. Une fois le
combat commencé, après trois secondes sans contact d’une place, le duel est suspendu : entrées et
commandes en attente sont libérées. Une reconnexion avant trente secondes depuis
le dernier contact reprend le même combat, sans rattrapage brutal. Après ce délai
ou un départ volontaire, le duel devient abandonné ; aucun K.-O. ni victoire
de combat n’est inventé. Un match déjà gagné conserve son verdict.

Le registre est en mémoire du processus, limité à cent invitations et à trente
minutes d’inactivité. Il faut un coordinateur partagé ou un routage vers le même
processus pour plusieurs serveurs ; un redémarrage perd les invitations. Il n’y a
ni matchmaking dans cette phase. Le classement par instance et les spectateurs
sont ajoutés par la phase 8.

## Latence et validation

Le client lit les contrôles sur chaque frame et envoie les entrées sans attendre
50 ms après la fin d’une requête. Un pipeline cumulatif maintient au plus quatre requêtes actives et huit paquets
non confirmés, avec 20 envois/s et une rafale de trois. Les reçus compacts et
les vues privées confirment les numéros reçus ; le serveur déduplique les lots
et refuse ceux d’une autre manche. Les garanties et mesures jusqu’au contact
sont détaillées dans [IMPACT.md](./IMPACT.md).
Un flux SSE authentifié pousse jusqu’à 30 vues privées/s, indépendamment de
l’aller-retour des commandes. Le jeton reste dans les en-têtes. Le flux sortant
ne renouvelle jamais la présence d’un joueur ; le polling HTTP reste le repli si
le serveur intermédiaire ne prend pas en charge le streaming.

`nextSequence` confirme la réception, `appliedSequence` confirme la consommation
par le moteur et `appliedAtTick` indique son tick. Toutes les commandes
sémantiques du roster sont rejouées dans le bac à sable privé ; leurs coûts et
résultats publiés restent exclusivement ceux du serveur. Le client ignore les révisions
anciennes et rejoue les intentions non appliquées depuis le dernier état privé
confirmé. Aucun numéro de frame ni résultat simulé par le client n’est envoyé.

Pour les duels entre les 40 personnages du roster, une simulation locale
bornée à douze frames anticipe uniquement le corps contrôlé : déplacement,
garde et animation de coup. Les petits écarts sont amortis ; interruption,
nouvelle manche, dégâts ou K.-O. font immédiatement autorité. Après 250 ms sans
état frais, l’anticipation cesse. Les séquences actives de Parallel Future et Cat’s Name reviennent à l’affichage
confirmé. Les pages copiées de Chrollo sont prises en charge ; une activation de
Parallel Future suspend aussi leur simulation provisoire avant de créer une prévision.
Hanzo anticipe les déplacements d’une projection confirmée ; le changement de corps
attend le serveur. Les positions publiques adverses sont extrapolées au
maximum sur deux frames ; aucune action adverse cachée n’est inventée.

Le HUD, le Nen, les coûts, les impacts, les projectiles et les verdicts utilisent
toujours l’état serveur. Il s’agit d’une prédiction de présentation réconciliée,
pas d’un rollback complet des deux joueurs. Les mécanismes de confidentialité
ci-dessus s’appliquent avant toute simulation locale. Ce chantier ne modifie pas les règles
des replays déterministes.

Le [rapport de réactivité](./REACTIVITY.md) décrit les mesures en production,
les limites du banc et les commandes de reproduction. Les délais et pertes
applicatives simulés ne prouvent pas une qualité de jeu sur Internet.

Les tests `pvp/*.test.ts`, `server/clashPvp.test.ts` et
`server/clashPvpHttp.test.ts` couvrent validation, authentification des places,
séquences, reçus, divergence, coût/interruption, consentement, copies, impacts
simultanés, post-mortem, futur parallèle, manches et verdict de match complet.

Depuis `apps/web`, `node scripts/check-fighting-pvp.mjs` lance deux contextes
navigateurs séparés sur les composants de production et les adaptateurs HTTP :
invitation, confirmations, poème réellement exécuté, place P2, rechargement,
coupure/reconnexion, départ et rendu à 1440, 390 et 320 px. Le scénario prépare
l’invitation dans une fixture dédiée ; les pages SvelteKit sont vérifiées par le
typage et les endpoints par les tests HTTP.

`PVP_CHECK_NO_WEBGL=1` permet de refaire le scénario réseau avec le rendu de
secours lorsque le poste ne dispose pas de WebGL ; ce passage ne valide pas les
modèles 3D. Le contrôle par défaut conserve WebGL.
