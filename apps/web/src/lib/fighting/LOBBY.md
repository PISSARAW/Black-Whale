# Préparation et navigation de Clash

Le menu `/fighting` mène à trois pages : `/fighting/characters`,
`/fighting/stage` puis `/fighting/options`. `/fighting/academy` rassemble les
leçons, l’école de combos et les défis / parcours Arcade ; `/fighting/replays`
porte la bibliothèque. Le duel utilise `/fighting/battle`. Chaque chemin existe
aussi sous `/fr` ; le PvP conserve ses routes indépendantes.

Le layout `routes/fighting/+layout.svelte` garde `FightingGame.svelte` monté.
La clé de transition du layout racine reste identique entre ces pages, grâce à
`fightNavigation.ts`. Les sélections et la préparation avancée survivent donc
aux retours, et consulter les replays peut suspendre puis restaurer un match.
La simulation et les commandes de combat ne tournent que sur l’écran de duel.
`fightingLifecycle.ts` possède l’horloge et les abonnements clavier / focus.

`fightSetupDraft.ts` conserve en session le duo, le mode, le format, le terrain
et l’option d’arène interactive. Un rechargement ne restaure pas un combat en
cours ni la préparation scénarisée avancée. Un accès direct à `/battle` sans
match revient aux règles du combat. Le stockage indisponible ou invalide
retombe sur les valeurs par défaut.

Les composants `FightLobby`, `FightMainMenu`, `FightCharacterSelection`,
`FightStageSelection`, `FightRulesSelection` et `FightAcademy` portent les pages.
La recherche et les filtres réduisent les catalogues ; les portraits du roster
se chargent à l’apparition et deviennent des images statiques après rendu.
Les modèles et le terrain réutilisent les composants 3D du jeu.

## Combat et pause

`FightBattle.svelte` conserve l’arène à la taille de la fenêtre : vie, aura,
chrono, manches et alertes ponctuelles. Les commandes tactiles restent
disponibles, avec les techniques Nen dans un volet compact. Les consignes des
leçons et des parcours utilisent `FightActiveObjective`.

Le bouton « Menu pause », Échap, la touche de pause configurée et Start ouvrent
`FightPauseMenu`, un dialogue modal natif avec confinement du focus. Le chrono,
les ressources, l’IA, les commandes et les replays restent figés. Les sections
regroupent combat, techniques et états, commandes, affichage / son, replays et
entraînement. Reprendre restitue la même scène et ses réglages.

`fightPausePlan.ts` conserve au plus seize actions choisies dans la pause. Elles
sont transmises à la file normale du moteur après la reprise, puis revalidées
et enregistrées sur un tick réel. Quitter, recommencer ou lancer un exercice
efface ce plan. L’avance d’une frame du laboratoire peut l’exécuter explicitement.
Les simples choix de cible de Blinky restent des réglages, sans avance du temps.

Le composant `FightStage` garde sa présentation historique par défaut pour le
PvP et les bancs de test ; la nouvelle interface active son option `minimal`.
`FightAudioSettings` partage les réglages du directeur audio déjà monté : ouvrir
le menu ne crée pas de second moteur sonore.

`FightResults` affiche un résultat distinct pour la manche et le duel complet,
le vainqueur P1 / P2 ou processeur, et le score de chaque combattant. Le bouton
principal passe de « Manche suivante » à « Rejouer le duel » une fois le match
terminé. Changer de personnage et revenir au menu utilisent les mêmes sorties
que la pause. Le focus clavier arrive sur l’action principale ; les répliques
de victoire restent disponibles dans un détail replié. Le banc
`ui-tests/fighting-results` expose victoire, défaite, P2, manche et égalité.

Vérification : `fightNavigation.test.ts`, `fightSetupDraft.test.ts`,
`tests/fighting-navigation.spec.ts` et les parcours existants de commandes,
leçons et replays, adaptés à la préparation en plusieurs pages.

## Combat tactile

`FightTouchControls` sépare la croix directionnelle à gauche des six attaques à
droite. Les boutons n’affichent plus les touches du clavier. En paysage court,
les commandes se superposent dans les coins inférieurs et laissent le centre de
l’arène libre ; en portrait elles disposent d’un bandeau réservé. Les cibles font
au moins 44 px et respectent les zones sûres de l’écran. « Combos » suspend le
combat et ouvre directement la liste des coups avec les noms des boutons tactiles.
« Nen + » ouvre les actions secondaires sans déplacer la croix ni les attaques.

`fightTouchDirection.ts` suit un seul doigt sur la croix, accepte les diagonales
et glissés, et libère les directions au centre ou à l’annulation. Les autres
doigts peuvent maintenir Aura / Garde et attaquer simultanément. Les attaques
simples partent au contact ; le Hatsu conserve sa charge et son déclenchement au
relâchement. Une perte de capture ou une pause annule la charge sans la lancer.
Les contrôles Nen utilisent le même cycle de maintien et sont libérés quand leur
volet disparaît.

`fightFullscreen.ts` demande le plein écran natif depuis un geste utilisateur,
avec masquage de la navigation puis verrouillage paysage quand ces API existent.
Le bouton reste accessible pendant le combat et dans la pause. Si le navigateur
refuse ou ne propose pas l’API, le jeu occupe la fenêtre visible en `100dvh`, sans
défilement de la page, avec `viewport-fit=cover`. Safari sur iPhone peut conserver
ses barres : le bouton explique alors l’ouverture comme app web depuis l’écran
d’accueil. Quitter le combat rétablit le défilement et libère l’orientation.

`fightMobile.test.ts` vérifie les gestes simultanés, les annulations, les libellés
et les chemins plein écran standard, préfixé, refusé ou indisponible.
