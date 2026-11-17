# Clash — arsenal intégral et usage du Nen

## Exigence retenue le 17 novembre 2026

Les quarante personnages doivent avoir accès à toutes leurs techniques attestées,
à leurs applications et aux techniques de Nen qu'ils maîtrisent. L'IA doit savoir
préparer et utiliser ces actions ; la simple présence d'un coup dans un catalogue
ne suffit pas. Les fonctions de soutien, surveillance, transformation, déplacement,
soin, contrat et Nen post-mortem font partie du périmètre.

Deux décisions explicites de l'utilisateur s'appliquent :

- **Le On reste présent et utilisable**, avec ses commandes et son IA existantes.
  Cette exception demandée n'autorise pas l'invention d'autres pouvoirs.
- **L'arsenal est rétrospectif** : les techniques montrées à différentes époques
  doivent être disponibles, même acquises ou perdues entre-temps. La disponibilité
  historique élargie ne supprime pas leurs conditions d'exécution.

Un coût numérique de duel peut être réglé. Une obligation de contact, une ressource
matérielle, un serment, un consentement, une cause de décès, une durée explicitement
canonique ou une différence entre apparence et corps ne devient pas facultative.
Une condition inconnue reste inconnue. Les aptitudes non révélées ne sont pas
complétées par un pouvoir inventé.

## Passe livrée : utilisation des capacités existantes

`arsenalAiFirst.ts` et `arsenalAiSecond.ts` donnent un plan explicite à chacun des
quarante combattants. `arsenalAi.ts` ajoute des alternatives martiales ;
`movesetAi.ts` vérifie portée et admission avant de retenir une commande. Les
plans ne fournissent aucune ressource, blessure, page, signature ou cible manquante.
Les réponses aux menaces et aux habitudes observées restent prioritaires.

- Kurapika distingue soin utile, Chain Jail admissible, drainage, chargement de
  Dolphin, Judgment et gestion d'Emperor Time. L'IA ne réserve plus l'activation
  d'Emperor Time aux seuls PV bas et peut l'arrêter entre deux applications.
- Hisoka utilise traction et rebond sur sa liaison réelle. Chrollo referme le
  livre et utilise la Lune après le Soleil, plutôt que de recommencer le Soleil.
- Saiyu choisit les singes correspondant aux sens encore disponibles. Machi
  distingue suture, pistage, ligature et engagement final. Biscuit révèle son corps
  naturel sans coût d'aura avant ses attaques propres à cette forme.
- Bonolenov utilise Prologue, lance, Jupiter et un modèle réellement appris pour
  Metamorphosen. Zakuro peut déployer ses gouttes de surveillance puis rappeler son
  sang avant une nouvelle prise. Padaille utilise les trois outils montrés.
- Les plans de soutien et de surveillance tentent leurs commandes préparées ;
  Camilla conserve son déclenchement à la mort, Beyond ses coups physiques en
  l'absence de sacrifice et Theta son Hatsu personnel inconnu.
- `arsenalAiAction.ts` ajoute l'usage des armes à distance déjà représentées.
  `arsenalAiNen.ts` utilise In et Ko dans les cas retenus : même surcoût, même
  engagement et mêmes zones corporelles exposées que pour un joueur. Aucun futur
  privé ni commande cachée n'est utilisé pour reconnaître une ouverture.

`arsenalAi.test.ts` vérifie les quarante plans, les coûts et conditions par le
chemin réel du moteur, les ressources absentes, les trois singes, les outils,
les liens et Soleil/Lune. `arsenalAiNen.test.ts` vérifie In, Ko, la perception,
le refus sous Zetsu et la conservation explicite du On. Les imports d'un plan
avant le moteur restent testés : le hook de Predator est résolu à l'appel.

La première passe portait le ruleset à `clash-combat-8` : les décisions de l'IA font partie de la
simulation des replays. Les enregistrements d'un ruleset précédent sont refusés
plutôt que rejoués avec des décisions différentes. Le protocole PvP reprend
automatiquement cette version depuis `REPLAY_RULESET`.

## Extension jouable du 17 novembre 2026

Les commandes supplémentaires sont accessibles dans le panneau Techniques et
préparations, pour chacun des deux joueurs locaux et par le protocole PvP
validé côté arbitre. Les choix sont enregistrés par le mécanisme de replay du
panneau. La préparation ne fournit ni consentement ni équipement manquant.

- **Biscuit : Cookie** est une invocation de soutien distincte du corps naturel.
  Massage progressif de la fatigue, consentement pour autrui, traitement
  interruptible, et Piano Massage après **30 minutes de sommeil simulé**. Aucun
  dégât, soin de plaie ou transformation corporelle n'est associé au traitement.
  Cookie est volable séparément ; Dolphin consomme un seul traitement et reste
  chargé jusqu'à la fin de son effet.
- **Skill Hunter : acquisition** vérifie l'observation visuelle du Hatsu,
  l'entretien avec réponse audible et le contact de la paume sur la couverture,
  dans une heure simulée. Le contact offensif vise les mains et ne blesse pas.
  La victime perd le Hatsu concerné, sans perdre tout son Nen ou ses autres Hatsu.
- **Pages historiques :** Gallery Fake produit une copie inerte, sans pouvoir,
  avec deux mains libres et une durée de 24 heures. Order Stamp exige une copie
  humanoïde avec tête attachée et un ordre vocal ; la destruction de la tête
  arrête le contrôle. Les marques Sun/Moon maintiennent les copies après la
  fermeture de leur page. Convert Hands change l'apparence et préserve le corps,
  l'identité et les pouvoirs. Fun Fun Cloth enveloppe et restitue intact ; son
  contact et celui de Convert Hands ont une préparation interruptible. Indoor
  Fish requiert une pièce close et diffère les blessures jusqu'à disparition.
  La téléportation reprend l'application montrée sur autrui ; ses conditions
  complètes restent inconnues.
- **Love Dial 6700 :** saisie d'un profil de Nen, numéro conjuré, appel et
  indication privée de présence ou de coordonnées. Le quota quotidien existe
  dans le manga, mais **sa valeur n'est pas révélée**. Deux appels par jour et
  les seuils de localisation sont des réglages du scénario, jamais des nombres
  présentés comme canoniques.
- **Applications copiées :** une page acquise conserve l'identité de son Hatsu.
  Le panneau propose ses différentes commandes, avec leurs conditions natives.
  Bungee Gum donne accès à traction et rebond ; Texture Surprise reste séparé.
  Le changement de page interrompt les effets qui ne sont plus maintenus.
  Les corps, flûtes, aiguilles, munitions et réserves biologiques ne sont pas copiés.
  Dolphin propose également les applications admissibles du Hatsu chargé.
- **Hisoka :** colmatage des plaies sans restauration des PV ; interception
  préparée d'un projectile matériel puis renvoi du même objet. La force reçue
  peut blesser les mains. Aucune balle de Nen n'est absorbée automatiquement.
- **Longhi :** la sanction compte une semaine entière de simulation, y compris
  le hitstop, et conserve le temps restant entre les manches. La trêve de cinq
  secondes reste un contrat de scénario explicitement expliqué.

L'IA emploie Cookie dans une ouverture de récupération, prépare les copies,
les poissons ou le tissu quand le contexte le permet, et réutilise le plan du
Hatsu d'origine pour les commandes d'une page acquise. Elle prépare également
les interceptions physiques et les pansements d'Hisoka. Elle ne produit jamais
la réponse d'un joueur humain à l'entretien de Skill Hunter.

Les tests `cookie`, `skillHunterAcquisition`, `chrolloHistorical`,
`chrolloCopiedArsenal`, `hisokaArsenal` et `retrospectiveIntegration` couvrent
l'exécution, les pertes d'accès, les durées et les limites de confidentialité.
Les timestamps d'observation sont exclus des effets maintenus de Dolphin.

## Écarts qui empêchent encore d'annoncer « 100 % »

Les extensions ci-dessus ne terminent pas tout l'arsenal rétrospectif. L'[audit des quarante
combattants](./audit-hatsu-fighting.md) conserve les limites par personnage.
Les écarts suivants restent ouverts et ne doivent pas être masqués par un taux
de couverture des profils ou un nombre de tests :

| Personnage | Extension ou correction encore nécessaire                                                                                                                                                                                                           |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Chrollo    | Lovely Ghostwriter reste à représenter avec identité manuscrite, impossibilité de prédire son propre avenir et un contexte de futur défini. Les interactions matérielles de Black Voice et les limites non révélées doivent encore être contrôlées. |
| Hisoka     | Réseau de plusieurs liens simultanés, prothèses fonctionnelles et préparation post-mortem avec une véritable cause de mort admissible. L'interception et le colmatage sont désormais exécutables.                                                   |
| Kurapika   | Étendre les clauses de Judgment, les usages d'information de Dowsing Chain et le prêt de Stealth Dolphin à un tiers réel. Les chaînes ne doivent pas partager leurs restrictions par commodité.                                                     |
| Halkenburg | Représenter la protection collective et les consciences au lieu de réduire la possession à un arrêt temporaire du combattant.                                                                                                                       |

| Hinrigh | Étendre Biohazard aux autres objets et applications effectivement montrés, en conservant les fonctions matérielles originales. Les deux menottes ne constituent pas l'arsenal complet. |
| Basho | Étendre les compositions et effets attestés au-delà du seul poème d'inflammation reconnu ; ne pas interpréter librement une phrase comme un souhait illimité. |
| Beyond | Ajouter une préparation sacrificielle réelle et une cible déclarée avant de simuler sa malédiction. |
| Furykov | Représenter les travaux de déchiffrage et de fabrication dans un contexte où leur durée est réellement possible. |

Le contrôle des autres personnages doit également comparer leurs applications
attestées, leurs contreparties et les commandes effectivement accessibles.
Un pouvoir partiellement connu ne peut pas recevoir une certification exhaustive.

Une technique est terminée lorsque son entrée joueur est accessible, ses conditions
sont exécutées, son effet et ses interruptions sont visibles, l'IA peut préparer
et employer son usage utile, et les copies, resets, prévisions et replays gardent
le même comportement. Une simple déclaration dans `NEN_CANON` ne valide pas ce point.

## Références vérifiées et limites de la vérification

Les chapitres 68, 95–106, 123, 149, 351–357, 388, 401–406 sont les points de
référence pour ces extensions. L'[index officiel VIZ](https://www.viz.com/shonenjump/chapters/hunter-x-hunter?locale=en)
ne fournit pas toutes les planches en accès libre. Les synthèses de
[Chrollo](https://hunterxhunter.fandom.com/wiki/Chrollo_Lucilfer),
[Neon](https://hunterxhunter.fandom.com/wiki/Neon_Nostrade),
[Hisoka](https://hunterxhunter.fandom.com/wiki/Hisoka_Morow) et
[Longhi](https://hunterxhunter.fandom.com/wiki/Longhi) ont servi à recouper les
conditions ; elles ne remplacent pas une relecture intégrale des planches.
Les poèmes apocryphes de `data/prophecies` ne servent jamais de prophéties
canoniques ou de prédictions d'une décision humaine future.
