# Clash — audit des personnages à un seul affrontement

Audit et implémentation du 17 novembre 2026 — `clash-combat-26`. Périmètre : le roster de quarante
personnages, le manga jusqu'au chapitre 420, les deux adaptations animées et les
films _Phantom Rouge_ et _The Last Mission_. Une séquence continue compte comme
un affrontement, même si elle comporte plusieurs adversaires. Les simples
présences, entraînements rapportés et menaces sans affrontement supplémentaire
ne créent pas un nouveau combat.

Ce document rapproche les scènes référencées des comportements exécutables du
duel. Il ne certifie pas une reproduction planche par planche de toutes les
chorégraphies ni une couverture des capacités jamais montrées.

## Sélection du lot

Dix personnages ont un seul affrontement identifié : Theta, Mizaistom, Basho,
Melody, Rihan, Bill, Musse, Padaille, Terebellum et Yokotani. Sayird est inclus
comme onzième cas : l'agression de Kurton et sa neutralisation par Kurapika
forment une même séquence, alors qu'il est manipulé.

Les personnages sans combat, notamment Longhi, Gel, Cluck et Beyond, ne sont pas
assimilés à des personnages à un combat. Kalluto a plusieurs interventions,
dont l'opération contre les Dix Doyens ; Luini a plusieurs séquences de meurtres
avant Nobunaga ; ils ne font donc pas partie de ce lot.

Les index des combats de [Phantom Rouge](https://hunterxhunter.fandom.com/wiki/Hunter_%C3%97_Hunter%3A_Phantom_Rouge)
et de [The Last Mission](https://hunterxhunter.fandom.com/wiki/Hunter_%C3%97_Hunter%3A_The_Last_Mission)
ne donnent aucun affrontement supplémentaire aux onze retenus. Ils élargissent
notamment les références d'Hisoka, Machi, Kurapika, Leorio et Biscuit, qui ont
déjà plusieurs combats. Une marionnette ne compte pas comme le personnage réel.

## Contrôle des onze personnages

| Personnage et source                                                                                    | Applications confrontées au moteur                                                                                                                                  | Résultat de ce lot                                                                                                                                                                                                                                                                                                                                            |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Theta](https://hunterxhunter.fandom.com/wiki/Theta), ch. 385–387                                       | Pistolet matériel, visée, préparation vulnérable, Nen de base.                                                                                                      | Déjà exécutables : tirs physiques aux différentes hauteurs, interruption, garde, usage sans aura ou en Zetsu. Aucun Hatsu personnel n'est inventé.                                                                                                                                                                                                            |
| [Mizaistom](https://hunterxhunter.fandom.com/wiki/Mizaistom_Nana), **ch. 343**                          | Montrer le carton jaune, prononcer un ordre, enfermer seulement après désobéissance ; répéter après libération ; laisser parler la personne.                        | Déjà exécutables par `crossGame` : avertissement réel, délai de réaction, distinction entre mouvement volontaire et déplacement subi, libération et nouvel avertissement. La référence erronée au ch. 352 du catalogue est corrigée. Les cartons bleu/rouge ne reçoivent pas de sanctions inventées.                                                          |
| [Basho](https://hunterxhunter.fandom.com/wiki/Chapter_68), ch. 68, épisode 40 de 2011                   | Écrire puis frapper une chaise qui brûle ; écrire le second poème et interroger les candidats sous menace du feu.                                                   | Le poème du poing, les contacts physiques et l'inflammation des couverts existaient. Ajout du second texte, de son écriture, de sa lecture audible, des questions et des réponses volontaires. Le second poème ne déclenche pas l'effet du premier. La scène ne montre pas la sanction annoncée : aucune mort ou lecture de vérité automatique n'est ajoutée. |
| [Melody](https://hunterxhunter.fandom.com/wiki/Melody), ch. 68                                          | Distinguer l'accélération brusque et progressive du cœur pendant l'interrogatoire ; en déduire des indices de stress.                                               | L'ouïe corporelle existait, mais seulement avec un rythme régulier/agité. Ajout des questions audibles, réponses volontaires et tendances cardiaques privées, même sans Nen. La sincérité et le stress sont des choix indépendants du répondant dans ce duel : aucun verdict automatique de vérité. La musique montrée hors de ce combat reste disponible.    |
| [Rihan](https://hunterxhunter.fandom.com/wiki/Rihan), ch. 374 et 381                                    | Observation personnelle, prédateur adapté à la manifestation, dévoration et quarante-huit heures sans Nen.                                                          | L'analyse, le déplacement du prédateur, la consommation ciblée et le coût persistant existaient. Correction d'une référence de fonction capturée trop tôt dans un cycle d'importation, qui faisait échouer la dévoration de Bungee Gum. Les copies et le coût de Kurapika sont contrôlés également.                                                           |
| [Bill](https://hunterxhunter.fandom.com/wiki/Bill), ch. 364                                             | Résister aux tirs par une vraie garde de Nen, approcher Vincent et participer à sa maîtrise.                                                                        | Déjà exécutables : garde/Ken, coups physiques, interruptions et contact. Erigeron reste du soutien à autrui, avec graine réelle en scénario ; il ne fournit ni soin personnel ni bonus défensif automatique.                                                                                                                                                  |
| [Musse](https://hunterxhunter.fandom.com/wiki/Musse), ch. 366 et 372–373 ; surveillance reprise ch. 402 | Pistolet, hibou d'écoute à l'épaule à travers les obstacles, pose d'un hibou au contact, transmission privée des actions et paroles, consultation des observations. | Le tir et le hibou au contact existaient. Ajout du mode d'écoute, du choix/rappel via l'arsenal, des paroles réellement prononcées et de l'historique consultable. Un seul hibou actif ; le troisième construct sans fonctionnement révélé n'est pas inventé.                                                                                                 |
| [Padaille](https://hunterxhunter.fandom.com/wiki/Padaille), ch. 391                                     | Transformer la main droite en marteau, perceuse ou hache ; glisser hors d'une menotte avec la perceuse ; tenter de couper l'entrave avec la hache.                  | Les trois outils existaient. Ajout des tentatives interruptibles sur une vraie menotte Biohazard : la perceuse en sort sans la détruire, la hache doit vaincre sa résistance. Transformation payée, animation sur la main droite et IA ; aucune évasion universelle des entraves de Nen. Le succès de la coupe à la hache n'est pas montré dans la scène.     |
| [Sayird](https://hunterxhunter.fandom.com/wiki/Sayird), ch. 360–361                                     | Agressions physiques alors qu'il est manipulé ; neutralisation et vol de sa capacité par Kurapika.                                                                  | Les attaques physiques et le contrôle subi sont distincts de Little Eye. La seringue, le drainage, le vol, le prêt et le vrai petit animal du scénario existent. Aucune technique d'agression n'est attribuée à Little Eye.                                                                                                                                   |
| [Terebellum](https://hunterxhunter.fandom.com/wiki/Chapter_399), ch. 399                                | Déplacer sa propre blessure par la gauche ; absorber celle d'autrui par la droite ; la transmettre à un objet touché ou la recevoir faute de sortie.                | Les transferts entre deux corps et le transfert de sa propre blessure vers une caisse existaient. Ajout du choix explicite de l'objet gauche et du trajet **autre corps → main droite → objet gauche**. Les contacts, la présence et l'état de l'objet sont revérifiés à l'impact.                                                                            |
| [Yokotani](https://hunterxhunter.fandom.com/wiki/Yokotani), ch. 399                                     | Se présenter, qualifier l'infraction, invoquer les unités invulnérables dans la planque occupée de Morena, saisir, confisquer et expulser sans blessure.            | La juridiction, les unités et l'expulsion existaient. Ajout de la présentation réellement prononcée et de la confiscation persistante des armes portatives. Les projectiles physiques et aiguilles confisqués ne redeviennent pas utilisables à la fin de l'escorte ; le rendu du pistolet suit cette perte.                                                  |

## Commandes, copies et IA

Les nouvelles applications apparaissent dans l'arsenal rétrospectif, pour chaque
joueur humain. Basho conserve également sa saisie des trois vers et deux textes
attestés en français et en anglais. Les textes sont des traductions de sens,
pas la reproduction annoncée d'une édition licenciée.

Les oiseaux utilisent le chemin normal de démarrage, de coût et d'interruption
du Hatsu. Chrollo doit avoir la page accessible. Dolphin peut sélectionner le
mode avant son unique activation ; une fois le hibou maintenu, il ne peut pas en
invoquer un second. L'observation reste privée en PvP, y compris les archives et
le choix du mode. Le hibou à l'épaule apparaît sur l'utilisateur ; celui au
contact reste sur le corps suivi.

L'IA peut démarrer l'écoute à distance, passer à la pose au contact quand elle
approche, écrire et lire le second poème et préparer un récepteur pour Sweet
Home face à une attaque visible. Elle répond uniquement pour son propre camp.
Les interdictions de communication restent vérifiées par la parole réelle.
Padaille peut lancer sa tentative même lorsqu'il est menotté. Melody peut poser
ses propres questions ; le répondant choisit séparément la sincérité et un débit
calme ou anxieux. Cette représentation physiologique est un réglage de duel,
pas une règle canonique garantissant qu'un menteur est nerveux. Le menu et la
lecture cardiaque ne révèlent jamais cette intention à l'interrogateur.

## Limites explicites de l'adaptation

- Le format reste un duel à deux corps. Il n'ajoute pas les trois gardes du
  combat de Mizaistom, les participants de l'embauche Nostrade ou Yokotani comme
  troisième combattant d'une scène de Terebellum. Les applications sont
  transposées aux cibles effectivement présentes.
- Les récepteurs matériels de Sweet Home sont les caisses réelles présentes
  sur le terrain, en remplacement de la canette tenue au chapitre 399. Le
  contact de la main gauche reste obligatoire, sans restitution de PV
  antérieurs. La géométrie précise d'une pointe de katana ou d'un couteau fiché
  n'est pas une simulation d'armes supplémentaire.
- La confiscation utilise l'inventaire et les armes physiques du duel. Elle ne
  vole pas les chaînes matérialisées, le livre de Nen ou les transformations
  corporelles. Les frappes ordinaires restent des actions martiales d'arcade.
- Les archives de Secret Window conservent au plus 64 changements d'action et
  64 paroles reçues pendant le maintien du hibou. Elles ne reconstituent pas
  des scènes antérieures à l'observation et ne constituent pas un lecteur
  vidéo général du manga.
- La puissance littéraire des poèmes, les paramètres inconnus du troisième
  oiseau et les effets non montrés des autres cartons restent inconnus.
- Les coûts, durées, distances et dégâts numériques sont des réglages de duel.

Ces limites interdisent d'annoncer une reproduction intégrale à 100 %. Le lot
ajoute les applications et corrige les défauts décrits ; il ne transforme pas
les informations manquantes dans les sources en pouvoirs supplémentaires.

## Vérification

`singleCombatArsenal.test.ts` exerce les nouvelles commandes dans le moteur :
écoute et contact, parole réelle, confidentialité P1/P2, copies, écriture,
silence et réponses volontaires, perte du Nen, objet réel et confiscation.
`padailleEscape.test.ts` couvre les transformations en situation d'entrave,
l'interruption et la résistance réelle de la menotte. `melodyInterrogation.test.ts`
couvre les réponses, l'indépendance entre stress et sincérité, l'ouïe sans Nen,
la durée de l'indice et sa confidentialité.
Les suites propres aux onze personnages, la préparation, l'arène et les
replays/PvP complètent ce contrôle.

Résultats après les corrections du lot :

- **486 tests réussis, 29 suites** : personnages, nouvelles applications,
  préparation, IA, ordre des imports, panneaux Svelte, replays déterministes,
  protocole et snapshots PvP, commandes serveur.
- ESLint sur les fichiers TypeScript/Svelte concernés : aucune erreur.
- `pnpm --filter @black-whale/web typecheck` : aucune erreur ni avertissement.
- `git diff --check` : aucune erreur de whitespace.

Il s'agit de vérifications du moteur et des composants ; ce résultat n'est pas
une comparaison visuelle automatique de chaque planche du manga avec le jeu.
