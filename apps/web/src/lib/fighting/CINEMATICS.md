# Gros plans des 40 combattants

`cinematicCatalogue.ts` recense exactement le roster sélectionnable. Les règles
personnelles sont complétées par les lancements, impacts confirmés, changements
significatifs de Nen, interactions de décor et événements de victoire.
Les règles lisent les changements d’état réellement produits par le moteur ;
elles n’exécutent aucune commande et ne modifient ni le temps, ni les dégâts,
ni les positions, ni le hasard. Les mêmes règles suivent P1, P2, l’IA, les replays,
les duels miroirs et les capacités effectivement exécutées par copie ou emprunt.

## Déclencheurs personnels

Les identifiants `personnage.événement` sont exposés dans `data-camera-event`
pour les contrôles navigateur. Les tableaux ci-dessous correspondent aux règles
exécutables, pas à une seconde liste de coups indépendante du moteur.

| Combattant   | Changements suivis et sujets de caméra                                                                                                                                                                                                                                          |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Kurapika     | Yeux écarlates, fin d’Emperor Time, blackout, Chain Jail et libération, soin effectif de Holy Chain, attachement/rupture de Steal Chain, vol achevé, chargement/usage de Dolphin, implantation de Judgment Chain et serments fatals. Pointes et maillons suivent la vraie main. |
| Hisoka       | Attachement, rétraction, propulsion et rupture de Bungee Gum ; Texture Surprise ; cartes et ancrages dans le décor.                                                                                                                                                             |
| Chrollo      | Livre ouvert/fermé, page, marque-page, acquisition, deux marques, détonation, contrôle de Black Voice et sa fin. Les pages exécutées reprennent les règles et cadrages de leur source.                                                                                          |
| Benjamin     | Nouvel héritage, marque de Secret Window, capture de carte et restitution de Culdcept ; Air Blow et arme à feu au lancement/contact.                                                                                                                                            |
| Tserriednich | Yeux fermés, vision effectivement disponible, réouverture/divergence et préparation interrompue. La disponibilité privée de la vision suit le spectateur autorisé.                                                                                                              |
| Feitan       | Blessures accumulées, armure, soleil réellement créé, première atteinte thermique, dissipation et fin d’armure.                                                                                                                                                                 |
| Saiyu        | Chaque sceau sensoriel séparément : vue, ouïe, parole ; manifestations et frappes du bâton au lancement/contact.                                                                                                                                                                |
| Theta        | Cadrages physiques du pistolet, du projectile et de son impact ; aucun éveil de Hatsu inventé.                                                                                                                                                                                  |
| Biscuit      | Révélation et retour de forme, corps complet, puis coups réels dans cette forme.                                                                                                                                                                                                |
| Phinks       | Moulinet, tours complets, charge engagée dans le poing droit et résultat réel de la frappe.                                                                                                                                                                                     |
| Franklin     | Début de rafale, mains, projectiles réels, impacts et couvert détruit. Aucun panneau par balle.                                                                                                                                                                                 |
| Machi        | Suture réellement accomplie, pistage/ligature, rupture du fil et libération de la contrainte.                                                                                                                                                                                   |
| Illumi       | Implantation crânienne, consigne effectivement changée, préparation et changement de visage.                                                                                                                                                                                    |
| Kalluto      | Fragment implanté, poupée, paroles effectivement reçues, fin d’écoute ; flux de papier et contacts.                                                                                                                                                                             |
| Bonolenov    | Danse, Prologue, forme de Metamorphosen et retour, Jupiter réel, danse interrompue et collision.                                                                                                                                                                                |
| Shizuku      | Aspiration, objet mémorisé, sang réellement extrait, plaies bouchées, fin d’aspiration et restitution ; embout de Blinky et matière réelle.                                                                                                                                     |
| Hinrigh      | Chaque changement de phase des objets physiques, menottes effectivement fermées et libération. Les objets ont un identifiant visuel par camp.                                                                                                                                   |
| Mizaistom    | Avertissement, contrainte après désobéissance et libération ; carte et cage réelles.                                                                                                                                                                                            |
| Leorio       | Transmission par la surface, émergence au point fixé et contact ; poing émergent nommé par projectile.                                                                                                                                                                          |
| Hanzo        | Séparation, double disponible, traversée du couvert, retour/réveil. Les impacts visant le corps endormi cadrent ce corps.                                                                                                                                                       |
| Rihan        | Observation, cible étudiée, disponibilité réelle de Predator, chasse, dévoration, scellement du Nen du prédateur et abandon. Découvrir une proie ne signifie pas avoir terminé son analyse.                                                                                     |
| Zakuro       | Plaie, tendril et ses phases, capture/libération, projection au sol, gouttes-yeux et perfusion.                                                                                                                                                                                 |
| Melody       | Préparation de la flûte, performance active, auditeur apaisé, oreilles couvertes, interruption et seuil réel d’écoute cardiaque.                                                                                                                                                |
| Basho        | Écriture, poème prêt, inflammation confirmée et écriture interrompue ; feuille et pinceau visibles dans la scène.                                                                                                                                                               |
| Camilla      | Les quatre phases réelles : apparition, capture, absorption, résurrection ; puis vie restaurée. Le pistolet conserve un cadrage physique.                                                                                                                                       |
| Halkenburg   | Volonté collective, charge prête, flèche armée, possession même à travers une garde, partisan endormi et fin de possession.                                                                                                                                                     |
| Gel          | Bras-serpent et rétraction ; tête du serpent en extension et contact physique.                                                                                                                                                                                                  |
| Lynch        | Question réellement posée et nouvelle réponse privée, y compris après saturation de l’historique.                                                                                                                                                                               |
| Luini        | Pièce ancrée, invalidation et déplacement discontinu réel entre lieux admissibles. Une marche ordinaire n’est pas une téléportation.                                                                                                                                            |
| Bill         | Croissance effectivement appliquée à une graine préparée.                                                                                                                                                                                                                       |
| Furykov      | Console, alerte réelle, signature devenue connue et personne affectée confirmée. L’affichage conserve « ? » quand l’identité est inconnue.                                                                                                                                      |
| Cluck        | Oiseau réel envoyé et livraison accomplie.                                                                                                                                                                                                                                      |
| Beyond       | Cadrages des frappes physiques, du Nen commun et du décor ; aucun déclenchement fictif de malédiction.                                                                                                                                                                          |
| Longhi       | Première signature/offre, pacte actif après acceptation, résolution et Zetsu des signataires en cas de violation.                                                                                                                                                               |
| Musse        | Hibou réellement attaché, observations et fin de surveillance, visibles uniquement à son utilisateur sélectionné.                                                                                                                                                               |
| Padaille     | Outil choisi et retour à la main ; marteau, foret, hache et leurs impacts physiques.                                                                                                                                                                                            |
| Sayird       | Animal réel contrôlé et fin du relais privé.                                                                                                                                                                                                                                    |
| Terebellum   | Transfert, absorption/retour et réceptacle de décor ; les deux mains et le destinataire sont cadrés ensemble.                                                                                                                                                                   |
| Voconte      | Réseau connecté/fermé et transit réellement enregistré, que le passage soit utilisé par le propriétaire ou son adversaire.                                                                                                                                                      |
| Yokotani     | Intervention, alerte renforcée, escorte, expulsion et fin d’intervention, sous les conditions territoriales du moteur.                                                                                                                                                          |

## Cadre et continuité

### Projections au corps-à-corps

`throwCinematic.ts` reconnaît une projection réellement confirmée : impact physique,
mise au sol, attaque de type projection et absence de garde, esquive, parade ou
invulnérabilité. Un raté ou une déprojection ne déclenche aucun plan de réussite.
La prise, le renversement, l'arrivée au sol et le retour au jeu suivent la
récupération réelle : au moins 54 frames pour la normale et 84 pour la super.
Les [dix premières paires personnelles](./throws/README.md) relient les vingt
chorégraphies, leurs accessoires et leurs quatre plans au choix Aura + projection.

`throwCinematicMotion.ts` et `throwPresentationLayer.ts` dessinent une courte
trajectoire entre la prise et la vraie position de chute. Les corps restent ceux
du match, dans le même décor ; les coordonnées et volumes de simulation ne sont
jamais réécrits. La victime conserve sa pose au sol jusqu'à la relevée réelle.
`throwCinematicCamera.ts` passe de la prise à une orbite de renversement puis à
un angle bas, avec un cadrage commun aux deux silhouettes et aux formats portrait.
Les instants suivent les frames d'attaque, donc le hitstop et la pause les figent.
Un nouvel impact, une nouvelle manche ou une fin de contrainte annule la séquence.

Un K.-O. attend la fin de cette projection avant sa cinématique de victoire ;
les dégâts, le verdict, les fenêtres de déprojection, les replays et les commandes
ne sont pas retardés. Caméra stable et mouvements réduits gardent les protections
de confort existantes. Les projections astrales de Hanzo ne sont pas confondues
avec ces prises physiques.

`throwCinematic.test.ts` vérifie les quarante combattants, les deux places, les
refus, la pause, le hitstop, les positions finales, le K.-O. et l'absence de mutation.
Depuis `apps/web`, `node scripts/check-fighting-throws.mjs` capture les quatre
temps de la scène de production en P1/P2, ainsi que les formats 390 et 320 px.

La seconde caméra rend la même scène posée au même instant. Les sujets peuvent
être une articulation, un accessoire visible, un projectile, une entité préparée
ou plusieurs points de contact. Le cadrage est calculé à partir de leur volume
réel, pour les formats larges et portrait. Une absence de modèle utilise un
ancrage corporel approprié ; elle ne crée pas une manifestation manquante.

La vue principale réserve progressivement la place du panneau et conserve les
corps dans son cadre. Les corps supplémentaires de Hanzo, le grand corps de
Biscuit, Cat’s Name et les distances minimales des décors gardent leurs protections.
Un corps absorbé ou expulsé reste repérable grâce à une silhouette translucide
étiquetée. Ce repère ne restaure ni ses PV ni sa présence dans les collisions.

Les plans du jeu disposent d’une fenêtre de 180 frames (3 s), ou de 228 frames
(3,8 s) pour un éveil. Les événements importants peuvent prendre le relais après
une première exposition ; les phases de Cat’s Name suivent leur déroulement réel.
Les impacts d’une rafale sont regroupés et un même plan est plafonné à 6 s.
Quand une observation cesse d’être vraie, l’encadré suit les articulations actuelles
avec la mention « Suivi après ». Il ne conserve ni soleil éteint, ni projectile
disparu, ni pose enregistrée. Les confirmations restent soumises aux règles de
confidentialité et expirent. La file est bornée à huit événements.
Aucun replay, ralenti ou arrêt moteur n’est ajouté. Les plans expirent après le
verdict même si la simulation est finie. Le profil compact reste disponible pour
les pistes de montage déjà écrites.

## Laplace Demon : réalité et image prédite

`FightLiveScene` réserve l’encadré existant à la branche calculée par le moteur
durant la vision et la divergence. La vue principale montre la réalité pour
l’utilisateur du pouvoir, l’entraînement et le versus local partagé. L’adversaire
en solo conserve sa perception illusoire : ses commandes restent actives et ses
coups, tirs, projections, dégâts apparents et sons sont simulés dans une branche
séparée. Aucun panneau, compteur de divergence ou encadré ne lui annonce l’effet.
Le vrai prince se déplace librement dans la simulation réelle. La fin du pouvoir
réaffiche directement sa position et ses PV réels. Un K.-O. illusoire déclenche
la même cinématique, le son de victoire, le score de manche et l’écran de résultats
qu’un vrai verdict, sans mention de Laplace. Le verdict perçu garde sa frame et
son chronomètre de fin afin que la cinématique ne redémarre pas à chaque tick réel.
« Manche suivante » et « Rejouer le duel » poursuivent uniquement la branche
illusoire ; le score réel, le corps du prince et la durée du pouvoir continuent
indépendamment. La rupture du pouvoir retire immédiatement la fausse victoire.
Le champ prolongé sous Zetsu conserve cette perception après les dix premières
secondes, jusqu’à sa rupture.

La seconde scène dispose de ses propres modèles et effets. Le code de caméra
de `demos/fighting-showcase/cinematicCamera.ts` a été extrait dans
`cinematicTrack.ts` : le film de référence et le jeu utilisent désormais le même
dolly, les mêmes repères et le même ajustement aux corps, adapté au format réel
de l’encadré. La piste de 600 frames est mise en cache par prédiction. Elle lit les instantanés
des 600 frames prédites, sans simuler de coup supplémentaire et sans modifier le
combat. Elle affiche « Image prédite », des PV prédits et « K.-O. prédit » lorsqu’il
survient. Ainsi, Rising Sun peut brûler l’image de Tserriednich tandis que le vrai
prince s’éloigne. Les pertes de PV prédites commandent le flash et la mention
« Rising Sun frappe l’image » ; le K.-O. ne touche pas les PV réels. Le tableau final conserve les effets de cette image, sans
cérémonie de victoire réelle. La navigation dans la vision ne remplace plus la
vue principale par le futur dans ces modes de comparaison.

Le panneau de l’arène indique la phase, le temps écoulé sur dix secondes, le
temps restant, les PV du corps réel et la durée de chaleur restante de Rising Sun. Ces temps viennent exclusivement du
curseur moteur, y compris lors d’une inspection de la vision. Ils restent lisibles
sur mobile. La bête personnelle suit le corps réel de P1 ou P2 ; elle est privée
en solo et visible dans le versus local partagé. La caméra réserve son volume
en plus des deux combattants. Le cadrage portrait ajuste simultanément la
distance et le point visé pour conserver les corps sous l’encadré, même dans
une arène de 420 px de haut.

Le point de vue suit le choix P1/P2 de l’arène. Les informations privées et le Nen
dissimulé non perçu ne déclenchent pas de panneau ou mouvement révélateur. La
seconde passe restaure les visibilités, le brouillard, la cible, le viewport et le
scissor après le rendu. Caméra stable et réduction des animations désactivent les
gros plans automatiques. La lecture de Laplace conserve ses repères informatifs avec une caméra fixe
lorsque les mouvements sont désactivés. Les flashes prédits respectent le réglage
des flashes et la réduction des animations. Les exports avec une piste de caméra explicite la conservent.

## Vérification

- `cinematicCatalogue.test.ts` : correspondance des 40 personnages, une action
  moteur pour chacun dans les deux camps, prérequis absents, contrat et confidentialité.
- `cinematicInteractions.test.ts` : les quatre phases post-mortem, copies,
  passage réel, possession à travers la garde, priorités et seuils d’observation.
- `cinematicFocus.test.ts` : ancrages des 40 modèles 3D et projection dans trois
  formats, plus cadrage de plusieurs contacts.
- `cinematicFraming.test.ts` : deux corps hors du panneau pendant les sauts,
  séparations et changements de côté, sur cinq rapports d’image.
- `cinematicExtended.test.ts` : fenêtres prolongées pour les 40 personnages,
  suivi après effet, rafales bornées, miroir P1/P2 et simulation inchangée.
- `parallelFutureCamera.test.ts` : Rising Sun, K.-O. prédit distinct du réel,
  navigation, temps moteur et respect de la perception adverse en solo.
- `futureBeastScene.test.ts` : bête de P1/P2, suivi réel, confidentialité,
  disparition et libération des ressources.
- `cinematicDirector.test.ts` et `cinematicDetailScene.test.ts` : dédoublonnage,
  pause, reset, verdict, rendu secondaire et restauration même après exception.

```sh
node apps/web/scripts/check-fighting-camera-all.mjs
node apps/web/scripts/check-fighting-camera.mjs
node apps/web/scripts/check-fighting-live-cinematics.mjs
```

Le premier contrôle les 40 personnages en P1/P2 et une sélection de sujets aux
largeurs 390 et 320 px. Le second contrôle les yeux, armure, soleil, transformation,
chaînes, impacts, caméra stable et réduction des animations. Les captures et
rapports sont écrits dans `/tmp/black-whale-camera-all` et `/tmp/black-whale-camera-ui`.
Les scènes de contrôle déclarent leurs ressources avant l’action et emploient
les commandes du moteur pour produire les effets.
