# Clash — personnages à deux séquences de combat

Audit du 18 novembre 2026, suite du [lot à une séquence](./clash-combats-uniques.md).
Périmètre : les quarante personnages du roster, manga jusqu'au chapitre 420,
adaptations animées et films. Le lot utilise les groupes d'affrontements du
recensement initial : une même opération peut réunir plusieurs victimes ou
échanges successifs. Les chiffres ne désignent pas un nombre de duels sportifs.

## Personnages retenus

| Personnage | Première séquence                                                                                                                                                | Seconde séquence                                                                                            |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Zakuro     | Intervention contre Bille, ch. 390 ; éclaireurs déployés ensuite, ch. 391.                                                                                       | Rencontre avec Bonolenov déguisé en Hisoka, avec Lynch, ch. 392–393 ; révélation de l'imposture au ch. 405. |
| Luini      | Série d'assassinats des gardes de l'entrepôt Cha-R, ch. 378–379. Les victimes appartiennent au groupe déjà recensé ; une partie des actes est connue après coup. | Apparition devant la Brigade puis attaque mortelle de Nobunaga, ch. 392–393.                                |
| Camilla    | Opération contre Musse, puis Wolfe, Furykov, Benjamin et Balsamilco, ch. 372–373.                                                                                | Confrontation avec Benjamin et son escorte sous la loi martiale, ch. 416.                                   |

Le comptage suit les séquences retenues, en particulier pour Camilla. Séparer
chaque cible ou chaque pièce de son opération du ch. 373 donnerait davantage
de combats. Hanzo conserve les autres entrées du recensement : chasse, Gon,
Pokkle et Tuffdy. Franklin, Kalluto, Bonolenov et Hinrigh ont aussi davantage
d'interventions recensées ; ils ne sont pas ramenés à deux duels développés.

Les listes de scènes et de personnages de [Phantom Rouge](https://hunterxhunter.fandom.com/wiki/Hunter_%C3%97_Hunter%3A_Phantom_Rouge)
et de [The Last Mission](https://hunterxhunter.fandom.com/wiki/Hunter_%C3%97_Hunter%3A_The_Last_Mission)
n'ajoutent aucun combat à ces trois personnages. Leurs scènes de référence
proviennent du manga après la période adaptée à l'écran.

## Zakuro : sang réel, rappel et reconnaissance

Références : [Zakuro](https://hunterxhunter.fandom.com/wiki/Zakuro_Custard),
[chapitre 390](https://hunterxhunter.fandom.com/wiki/Chapter_390),
[chapitre 391](https://hunterxhunter.fandom.com/wiki/Chapter_391) et
[chapitre 392](https://hunterxhunter.fandom.com/wiki/Chapter_392).

La prise par le sang, la projection, le rappel de la matière, la perfusion,
les gouttes dotées d'yeux et leur reformation existaient. Une blessure déjà
ouverte permettait aussi de déployer le sang sans se couper une seconde fois.

Les manques corrigés :

- **Exploration d'une paroi** : nouvelle commande pour une paroi réellement
  présente à proximité — mur de la pièce de scénario ou face d'un objet de
  l'arène. Les gouttes parcourent le trajet puis montent et redescendent.
  Elles ne créent pas leur propre support et retombent si celui-ci disparaît.
- **Retour depuis une hauteur** : le rappel suit les deux coordonnées ; la
  réserve récupère uniquement les gouttes revenues au corps.
- **Arrêt du saignement** : le rappel ferme le flux des plaies existantes sous
  contrôle du Nen. Il ne restitue aucun PV, ne régénère pas les tissus et ne
  ferme pas une blessure reçue ultérieurement. Une nouvelle émission rouvre
  ce flux ; perdre le Nen retire ce contrôle.
- **Information acquise** : un couvert réel peut empêcher une goutte de voir
  le corps voisin. La dernière position observée reste privée dans le HUD et
  dans les snapshots PvP ; son âge reste affiché.
- **Emprunt** : Dolphin sélectionne l'application de reconnaissance avant son
  unique usage, avec son coût réel. Il conserve les exigences du sang, de la
  plaie et de la perfusion du bénéficiaire.

La durée de trente minutes simulées conserve la borne basse annoncée au manga.
Le nombre de gouttes, les unités de sang et les vitesses restent des réglages
du duel. La scène contre Bonolenov n'apporte pas une nouvelle attaque de sang :
son déguisement ne révèle pas son identité aux éclaireurs.

## Luini : choisir la sortie et exposer seulement le buste

Références : [Luini](https://hunterxhunter.fandom.com/wiki/Luini),
[chapitre 379](https://hunterxhunter.fandom.com/wiki/Chapter_379),
[chapitre 392](https://hunterxhunter.fandom.com/wiki/Chapter_392) et
[chapitre 393](https://hunterxhunter.fandom.com/wiki/Chapter_393).

L'ancrage depuis une pièce close à porte unique, le départ vers un lieu visité,
le retour et l'invalidation de la pièce existaient. Ces prérequis sont conservés.

Les manques corrigés :

- **Choix du lieu** dans les destinations réellement visitées par l'utilisateur.
  Une destination sélectionnée devenue indisponible fait échouer le départ ;
  elle n'est pas remplacée silencieusement par une autre.
- **Passage partiel par une porte ou un plafond**, puis choix de rentrer ou
  de sortir entièrement. Ces activations utilisent le chemin normal de coût,
  récupération, jugement, contrat et accès au Nen.
- **Vulnérabilité physique** : le buste apparaît à la sortie, le bas du corps
  reste à l'origine. Deux zones de collision affectent une seule réserve de PV.
  Un coup peut interrompre le passage et empêcher un retrait immédiat. La sortie
  n'accorde ni invulnérabilité ni esquive automatique.
- **Rendu du même état** : haut et bas du modèle sont séparés sans second
  combattant, le plafond inverse le buste, les ouvertures et les deux positions
  sont visibles. La caméra englobe aussi la partie restée dans la pièce.
- **Couteau matériel** : arme portée par la main droite, frappes physiques et
  entailles pouvant ouvrir une plaie. La copie du Hatsu ne fournit pas ce couteau.
  Les noms des coups ordinaires ne leur attribuent plus de faille offensive ou
  d'enlèvement spatial.

Pendant l'apparition partielle, parler reste possible. Les attaques et la
locomotion attendent une sortie complète : aucun assaut avec un demi-corps
n'est ajouté à la scène de dialogue. L'IA peut sélectionner un lieu utile et
terminer son passage. Skill Hunter exige la page et les visites du copieur ;
Dolphin reste occupé jusqu'à l'achèvement de son passage unique.

Les plafonds sont représentés à une hauteur conventionnelle de seize unités
dans les destinations de scénario. Le coût de vingt aura par activation est
un réglage de jeu. L'ouverture d'une pièce ou la perte du Nen supprime le
passage ; aucune règle de sectionnement ou de mort automatique lors de cette
fermeture n'est déduite de la mort de Luini sous le katana de Nobunaga.

## Camilla : pistolet fini et restauration du corps

Références : [chapitre 373](https://hunterxhunter.fandom.com/wiki/Chapter_373),
[Camilla](https://hunterxhunter.fandom.com/wiki/Camilla_Hui_Guo_Rou) et
[chapitre 416](https://black-whale-nexus.sarbast.dev/chapters/416).
Les synopsis récents sont des analyses de fans ; l'[index VIZ](https://www.viz.com/shonenjump/chapters/hunter-x-hunter?locale=en)
identifie l'édition officielle.

Le pistolet matériel, son usage sans aura, la garde de Nen adverse et le chat
post-mortem existaient. Le chat ne s'active pas manuellement et ne soigne pas
une blessure non mortelle. L'attribution d'une mort à un adversaire vivant et
la séquence de capture, absorption et résurrection restent contrôlées.

Les manques corrigés :

- **Chargeur fini** : douze balles fournies pour le duel. Une balle est dépensée
  au départ effectif du projectile, même si celui-ci rate ou rencontre une garde.
  Interrompre la préparation avant le tir ne consomme pas de balle. Une arme
  vide ne tire plus ; la résurrection ne la recharge pas. La capacité exacte
  du chargeur n'étant pas établie ici, douze est explicitement un réglage de jeu.
- **Corps ressuscité** : les anciennes plaies physiques ne restent plus ouvertes
  après la restauration des PV. Cette remise en état ne recrée ni aura, ni
  munitions, ni arme confisquée.

Au ch. 416, la contamination, la question du responsable d'une mort par maladie
et l'endurance annoncée ne montrent pas une nouvelle application exécutée du
chat. Le lot ne programme donc pas une réponse garantie à ce dilemme, une
hibernation déjà accomplie ou un effet inconnu de sa bête gardienne. La
malédiction de Moswana appartient à Moswana.

## Vérification

Les tests `twoCombatLuini`, `twoCombatZakuro` et `twoCombatCamilla` vérifient les
actions réelles, refus de condition, interruptions, ressources, copies et resets.
`twoCombatPresentation` contrôle le modèle de production et les panneaux privés.
`twoCombatReplay` passe par le journal réel des panneaux et le protocole PvP.
Les commandes du protocole ne permettent pas au client de fournir une position
de corps, une observation ou un résultat de combat.

Résultat de la régression après corrections : **490 tests réussis dans 30
suites**, dont les cinq nouvelles suites `twoCombat*`, les trois personnages,
les tirs et ressources, les armes des gardes, Blinky, les copies, la préparation,
l'IA, l'ordre des imports, les replays, les snapshots et le protocole PvP.
ESLint sur les fichiers concernés et `git diff --check` ciblé passent.
`pnpm --filter @black-whale/web typecheck` termine avec **zéro erreur et zéro
avertissement** ; le formatage des fichiers concernés est validé par Prettier.

Les paramètres numériques et limites de géométrie ci-dessus sont des
adaptations explicites ; cet audit ne remplace pas une comparaison de toutes
les planches avec chaque image rendue.
