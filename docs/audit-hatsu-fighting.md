# Audit — fidélité des Hatsu du mode Fighting (2D)

Audit du 2026-11-16, sans modification de code. Périmètre : `apps/web/src/lib/fighting/hatsu/*`,
`hatsu.ts`, `techniqueContracts.ts`, comparés aux fiches canon de `packages/ability-modules`
(champs `rule`, `condition`, `cost`) et au manga.

**Référence utilisée.** La fiche `ability-modules` fait foi : elle est déjà la source de l'Arena 3D
et du site. Pour les personnages de la Guerre de succession, cet audit ne revérifie pas la fiche
chapitre par chapitre ; une fiche fausse le reste ici. Les points marqués _à sourcer_ demandent
une vérification dans le manga avant d'être corrigés.

## Légende

| Verdict | Sens                                                                               |
| ------- | ---------------------------------------------------------------------------------- |
| **A**   | Contredit le canon : le jeu affirme un effet que la fiche ou le manga réfute.      |
| **B**   | Effet juste, condition ou coût canon absent : le Hatsu marche sans payer son prix. |
| **C**   | Effet inventé, sans rapport avec la capacité (souvent un bonus chiffré générique). |
| **D**   | Fidèle, ou abstraction raisonnable d'un effet canon.                               |

## Constats transversaux

1. **Deux sources de canon.** `techniqueContracts.ts` ne décrit que 10 coups (Kurapika, Hisoka).
   Les 605 autres reçoivent « Black Whale: Clash combat interpretation », y compris les coups qui
   portent le nom d'une technique du manga. Les fiches `ability-modules` ne sont pas lues.
2. **Un seul contrôle canon exécuté.** `canonicalTechniqueAllowed` ne vérifie que Chain Jail contre
   la Brigade. Toutes les autres `condition` des fiches (`anchor-or-contact`,
   `book-and-theft-conditions`, `warning-before-restraint`, `death-by-attacker`…) sont ignorées.
3. **Coût unique.** `FIGHT_HATSU_AURA_COST = 40` pour tous. Les fiches déclarent de 6 (Ripper
   Cyclotron) à 24 (Chain Jail). Les coûts non-aura (durée de vie d'Emperor Time, serment mortel,
   doigts coupés de Franklin) ne sont modélisés nulle part dans l’état initial.
   _Franklin corrigé le 2026-11-16 : les dix doigts sectionnés sont représentés
   comme une restriction permanente ; le Hatsu produit des rafales de projectiles._
4. **La règle du roster est violée par le roster lui-même.** _Traité le 2026-11-16 :_ Cluck, Beyond et Sayird jouent en martial pur (`martialOnlyHatsu`). Furykov dispose désormais de l’alerte immédiate de Combo Master, distincte des travaux sur plusieurs jours. Silent Majority est retiré du roster jouable, qui passe à 40.
   Musse utilise son pistolet physique et Secret Window comme surveillance privée au contact, sans dégâts ni esquive.
   Le README exclut « les pouvoirs qui
   exigent une préparation incompatible avec un duel ». Le déchiffrage et la fabrication de
   Combo Master restent donc exclus ; son alerte immédiate convient au duel. Le contrôle
   d’oiseaux de Cluck reste réel et retenable par Steal Chain, mais sans oiseau cible fourni
   dans ce mode ; la livraison de courrier n’est pas une restriction canonique.
   Beyond (malédiction posthume préparée), Silent Majority (dix suspects),
   Sayird (surveillance) n'ont aucun Hatsu de duel canon. Leurs effets en jeu sont
   inventés. **Décision à prendre :** les garder en martial pur, étiqueter honnêtement
   `gameplay-abstraction`, ou les retirer du roster.
5. **Une capacité volée reste à son propriétaire.** _Corrigé pour Skill Hunter le 2026-11-16 ; reste à faire pour Steal Chain._ Canon (Skill Hunter, Steal Chain) : la victime
   perd l'usage de la capacité tant qu'elle est tenue. Rien ne le modélise.
6. **Le motif « `hitStun ≥ 2` par frame » sert de paralysie générique** pour neuf Hatsu (Machi,
   Illumi, Mizaistom, Melody, Zakuro, Luzurus, Momoze, Longhi, Black Voice). Il efface les
   différences canon entre contrôle total, entrave physique, transe et contrat.
   _Longhi corrigé le 2026-11-16 : le contrat exige deux signatures volontaires et ne paralyse plus._

## Bug repéré en passant

- **Hinrigh se paralyse lui-même.** `hinrigh.ts` pose `biohazardFrames` sur le lanceur, puis
  `tickBiohazard` impose `hitStun ≥ 2` à quiconque porte cet effet. Pendant 90 frames, Hinrigh est
  en pose `hit`, sans garde (`engine.ts:361`) et sans pouvoir tamponner d'attaque
  (`fighterAttacks.ts:88`). Le test existant (`hatsuRegistry.test.ts:284`) ne vérifie que les
  facteurs de dégâts. **Confirmé puis corrigé le 2026-11-16** : le décompte ne touche plus `hitStun`, et le test
  « never stuns Hinrigh with his own Biohazard » le verrouille.

## Fiche par combattant

### Première vague

| Combattant   | Hatsu en jeu                                       | Canon (fiche)                                                      | Verdict  | Écart                                                                                                                                                                                                              |
| ------------ | -------------------------------------------------- | ------------------------------------------------------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Kurapika | Cinq chaînes distinctes, soin, capture persistante, vol à usage unique et Emperor Time | Serment Brigade, Zetsu et immobilisation, coût en vie, Dolphin verrouillé, jugement conditionnel | A | Effets et contraintes implémentés et testés ; règle de duel du jugement : rester en Zetsu. Pas de tiers à qui prêter Dolphin dans ce format. Valeurs de soin, drainage et portée adaptées au duel. |
| Hisoka | Bungee Gum et Texture Surprise partageaient le même effet | Attache, traction, propulsion et masque de surface distincts | D (fait) | Le 2026-11-16 : L attache au contact non gardé ; →+L tire la cible et ←+L propulse Hisoka, avec sa propre liaison tendue. Les utilitaires attendent leur startup et ne frappent pas. ↓+L masque un panneau du vêtement sans protection ; le contact reçu expose le masque. H consomme la liaison sur un coup réussi. Support, préparation au sol et interruption du masque sont des adaptations de duel. Une seule liaison entre combattants ; aucun filament détaché ni ancrage au décor. |
| Chrollo | Livre à pages conservées, Double Face, Sun and Moon, Black Voice | Livre ouvert à droite, un signet, deux capacités actives au plus | B (fait) | Pages et signet jouables ; vol observé au contact, victime privée du pouvoir ; fermeture libérant les mains ; marques posthumes persistantes ; antenne puis ordre de recul. Arsenal historique du duel contre Hisoka. Restent abstraits : entretien du vol, rencontre des marques sur une cible, charge et durée de contrôle. |
| Benjamin     | Trois héritages distincts : Air Blow, Secret Window, Culdcept | Baton : capacités de soldats loyaux décédés, diplômés de l’académie et membres de son armée | D (adapté) | Corrigé le 2026-11-16 : plus de charges de dégâts. Héritages acquis avant le duel ; oiseau de surveillance au contact sans dégâts, rectangle chargé et carte consommée au rejeu. Air Blow et la capture de projectiles restent des adaptations déclarées, leurs règles complètes étant inconnues. Culdcept ne capture ni balles réelles ni flèche de Halkenburg. La mitraillette tire trois balles physiques indépendamment du Nen. |
| Tserriednich | Zetsu volontaire, yeux fermés, prévision de 600 frames puis divergence | Vision de dix secondes ; l’adversaire perçoit le déroulement prédit | D (adapté) | Corrigé le 2026-11-16 : préparation vulnérable interrompue par une touche ; branche déterministe sans dégâts ni verdict appliqués au réel ; réouverture des yeux, deux perceptions, collisions sur le corps réel, aucune esquive automatique. Préparation de 30 frames et lecture suspendue de la vision : réglages de duel. En local, commandes présentes prolongées puis rejouées : décisions humaines futures impossibles à connaître. |
| Feitan | Pain Packer sur blessures reçues ; armure thermique ; Rising Sun en zone persistante | Douleur convertie en chaleur, tenue protectrice, danger de zone | D (fait) | Corrigé le 2026-11-16 : L engage les blessures sans soin ni frappe ; H dépense la charge en soleil fixe. Chaleur, rayon et durée croissent avec les blessures ; garde physique inefficace, fuite possible, protection thermique seule. Zetsu et vol dissipent le Nen. Timings, coûts, dépense de charge et scoring sont des adaptations au duel. |
| Saiyu | Mizaru : vue ; Kikazaru : ouïe ; Iwazaru : parole | Chaque singe retire sa propre faculté sur contact (ch. 349) | B (fait) | Corrigé le 2026-11-16 : sceaux indépendants, masque visuel, silence du mix, appel de Hanzo impossible sans parole/ouïe ; aucun Zetsu ni stun supplémentaire. Modalités du duel explicitement adaptées. |
| Theta | Pistolet physique, sans drainage ni Zetsu forcé | Garde et instructrice de Nen ; Hatsu personnel inconnu | A | Tirs matériels sans coût d’aura, visées adaptées au duel ; aucune capacité de neutralisation inventée, aucun finisher ni Hatsu volable. Références : ch. 385 et 387. |
| Biscuit | Corps naturel : ×1,35 dégâts, ×0,68 dégâts reçus | Vraie forme corporelle ; Cookie soigne et repose | D (fait) | Corrigé le 2026-11-16 : deux silhouettes, retour au corps naturel par L sans direction, sans coup ni coût d’aura, persistant jusqu’à la manche suivante. Corps séparé des Hatsu copiables ; Cookie hors duel. « Massage éclair » remplacé par « Direct du maître ». Les multiplicateurs restent un équilibrage arcade. |
| Phinks | Rotations réelles du bras droit, puis un poing chargé | Ripper Cyclotron : chaque rotation complète renforce le coup de poing droit (ch. 226) | D (adapté) | Corrigé le 2026-11-16 : L lance/arrête le moulinet ; H engage tous les tours terminés dans un seul poing, sans bonus général aux dégâts. Aucun plafond de sept tours ni minimum canonique de quatre. Cadence, prix par tour, formule de dégâts et dépense sur coup manqué/gardé/interrompu sont des conventions de duel. Le « coût canon 6 » de l’ancienne ligne était un paramètre interne, pas un fait du manga. |

### Deuxième vague

| Combattant | Hatsu en jeu                                   | Canon (fiche)                                                           | Verdict  | Écart                                                                                                                                                                                             |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Franklin   | Rafales de balles de Nen depuis les dix doigts | Double Machine Gun : tirs rapides depuis les deux mains, renforcés par les doigts sectionnés | D | Corrigé le 2026-11-16 : vrais projectiles, tirs interrompus à l’impact, doigts ouverts et chaînettes. Restriction permanente documentée. Aucun bonus d’impact invisible ni seuil de PV pour la rafale prolongée. Les gardes Nen restent actives ; le manga ne justifie pas un percement universel. |
| Machi | Suture, marque de pistage et ligature distinctes | Fils : suture, pistage et contention ; résistance liée à la longueur et au maintien | C (fait) | Corrigé le 2026-11-16 : véritable lien, perte de contention si trop long/lâché/interrompu, aucun stun automatique. Réglages de duel explicités. |
| Illumi     | −12 aura, paralysie 2 s                        | Aiguilles : contact **et** ordre, marionnette jetable                   | B        | Abstraction acceptable ; l'ordre et une limite (une aiguille par marionnette) manquent.                                                                                                           |
| Kalluto    | 3 marques → 18 dégâts (« morsure de serpent ») | Fiche : poupées de papier de surveillance                               | C        | Le combat de Kalluto au papier est canon, mais le serpent est _à sourcer_.                                                                                                                        |
| Bonolenov  | Buff ×1,3 / ×0,82 pendant 2 s                  | Battle Cantabile : musique par les orifices, rythme continu             | B        | Ni rythme à tenir ni mouvement continu. Piste : séquence de trois temps (`three-beat-sequence`).                                                                                                  |
| Shizuku    | Draine PV et aura d'un **vivant**, la soigne   | Blinky n'aspire que le **non-vivant** désigné                           | D (fait) | Corrigé le 2026-11-16 : plus aucun drain du vivant ; Blinky avale pendant 0,5 s les objets réels lancés contre Shizuku (cartes, balles, aiguilles, pierres), jamais l'aura émise ou matérialisée. |
| Hinrigh    | Buff ×1,2 / ×0,86 (et auto-paralysie)          | Biohazard : objets touchés deviennent des animaux                       | **A**    | Effet inventé (le bug d'auto-paralysie est corrigé). Piste : transformer un projectile ou un objet en bête.                                                                                       |
| Mizaistom | Carton jaune sans frappe ; ordre visible, contrainte après désobéissance | Cross Game : avertissement puis carton retourné ; entrave brève et parole libre | Corrigé | Coups physiques conservés ; cartes offensives, zone et Verdict retirés. Timings et ordre précis adaptés au duel. |
| Leorio     | Poing transmis dans le sol, sortie différée au point visé | Remote Punch : l’aura traverse une surface (ch. 325) | A | Corrigé : aucune collision sous le sol, aucun bonus de contact ni boule d’aura. Variantes médicales, double émission et finisher retirés ; portée et délai restent des réglages arcade. |
| Hanzo      | Double piloté, corps endormi distinct          | Hanzo Skill 4 : corps vulnérable, double flottant et capable de frapper | D (fait) | Corrigé le 2026-11-16 : aucune esquive gratuite ; coups et contact au corps interrompent la projection, retour volontaire près du corps, étranglement au contact. T/V ou le bouton tactile permettent aussi d'interpeller le corps à proximité, sans dégâts. |

### Troisième vague

| Combattant | Hatsu en jeu                          | Canon (fiche)                                                       | Verdict  | Écart                                                                                                                                                                                                                                                                                                               |
| ---------- | ------------------------------------- | ------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rihan | Analyse personnelle d’un Hatsu précis, puis prédation ciblée | Predator : contre-mesure conçue après déduction de la capacité ; 48 h sans Nen pour son utilisateur après consommation | D (fait) | `predator.ts` et `predatorPrey.ts` ciblent une manifestation observée, sans dégâts au corps, Zetsu adverse ni défense générique. Le coût de 48 h simulées persiste entre les manches (`predatorSeal.ts`). Observation de 180 frames, catalogue de manifestations, vitesse et résistance du chasseur sont des adaptations de duel explicites. |
| Zakuro     | Entrave 1,6 s                         | Bloody Mary : son propre sang, gouttes autonomes de recherche       | C        | Inventé.                                                                                                                                                                                                                                                                                                            |
| Melody | Musique portée par des coups, transe fixe | Performance continue, auditeurs capables d’entendre ; ouïe passive | D (fait) | L prépare puis maintient la musique sans dégâts ni score. La perte de son (portée, oreilles couvertes, Saiyu), de flûte ou de Nen, et les interruptions libèrent les auditeurs. L’ouïe lit le rythme cardiaque, même en Zetsu, avec une tolérance de parade manuelle explicitement arcade. Aucun finisher musical offensif. |
| Basho | Poème écrit, embrasement conditionné au contact du poing | Great Hiker : le poème fait effet ; puissance selon sa qualité (ch. 68) | D (fait) | Corrigé le 2026-11-16 : saisie des trois vers, écriture exposée, effet incendiaire réservé aux poings qui touchent. Bonus général et techniques inventées retirés. Une seule composition attestée est reconnue ; coût, durée et dégâts sont des adaptations déclarées, sans notation littéraire inventée. |
| Camilla | Cat’s Name en quatre phases, verdict commun des décès, pistolet physique | Mort, capture du meurtrier, absorption de sa vie et résurrection | D (adapté) | Aucun contre de son vivant ni finisher à faible santé. Séquence de 120 frames, victoire différée, PV maximum restaurés ; points/temps/TKO sans chat. Coups, tirs, chaleur, transferts et Judgment Chain partagent le verdict. Meurtrier déjà mort/sans auteur et miroir : convention de duel déclarée, sans prétendre fixer les inconnues du manga. |
| Halkenburg | +20 dégâts et Zetsu si non gardé      | Flèche qui perce **toute défense**, échange deux âmes               | B (fait) | Corrigé le 2026-11-16 : plus de Zetsu ; la volonté de la cohorte se charge en 8 s (abstraction), la flèche perce la garde, livre le corps à un partisan 2 s et coûte 8 PV à Halkenburg ; son tir à distance devient une pierre. Restent abstraits : la cohorte, l'armure collective, et les dégâts du coup porteur. |
| Gel | Bras-serpent et allonge, sans effet ajouté | Transformation du bras montrée ; nom officiel, catégorie et propriétés détaillées inconnus | **D** | Corrigé : venin, drainage et finisher létal supprimés. Les frappes directionnelles, dégâts, portées et coûts restent des adaptations de duel ; aucune entrave par paliers inventée. |
| Lynch | Stun + vulnérabilité ×1,25 | Body and Soul : question puis poing, réponse véridique privée | D (fait) | Question audible puis contact du poing sur une cible encore consciente. Réponse limitée au fait demandé au moment du contact, sans prédiction. Aucun stun ajouté, malus de défense ni finisher. Réponses masquées dans l’écran partagé ; copies soumises aux mêmes conditions. |
| Luini      | Une esquive par téléportation         | Entrées préparées et retour marqués                                 | B        | Il manque les points d'entrée posés à l'avance.                                                                                                                                                                                                                                                                     |
| Bill       | Coups physiques et Ken ; Erigeron conservé comme soutien | Erigeron : croissance du vivant et soutien au développement du Nen (ch. 388) | C (fait) | Soins personnels, bonus automatiques, attaques végétales et finisher retirés. Le duel sans cible de soutien indique Erigeron indisponible, sans coût ni frappe ; les copies gardent cette limite de contexte. |

### Quatrième vague et Yokotani

| Combattant      | Hatsu en jeu                       | Canon (fiche)                                                                                | Verdict  | Écart                                                                  |
| --------------- | ---------------------------------- | -------------------------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------- |
| Furykov         | Console d’alerte informative       | Combo Master : alerte immédiate AFFECTED USERS ; déchiffrage/fabrication sur plusieurs jours | D (fait) | Corrigé le 2026-11-16 : L ouvre la console sans frappe ; alerte sur Nen réellement dissimulé dirigé contre lui, signature illisible « ? », destinataires confirmés uniquement. Aucun buff, esquive, prédiction ou déchiffrage accéléré. Coût, engagement et lisibilité par Gyo sont des adaptations au duel. |
| Cluck | Coups martiaux ; contrôle d’oiseaux retenable par Steal Chain | Contrôle d’oiseaux attesté pour distribuer des bulletins de vote ; conditions complètes inconnues | D (fait) | Corrigé le 2026-11-16 : pouvoir réel distinct des coups, sans restriction au courrier. Aucun oiseau fourni dans ce duel, aucun effet de volée inventé ; rétention après contact et drainage, sans chargement de Dolphin ni verrouillage d’Emperor Time. |
| Beyond          | Malédiction : −15 aura, ×1,2 reçus | Malédiction posthume liée à un sacrifice préparé                                             | D (fait) | Martial pur depuis le 2026-11-16 : aucun effet de Hatsu.               |
| Longhi | Contrat volontaire, prêt à usage unique et sanction de Zetsu | Moonlight Act : termes expliqués et deux signatures volontaires (ch. 401) | D (fait) | Corrigé le 2026-11-16 : proposition, acceptation ou refus explicites ; aucune entrave sur touche ni finisher offensif. Les deux signataires subissent Zetsu en cas de violation. La trêve de cinq secondes et la sanction limitée au match sont des adaptations déclarées. |
| Musse | Pistolet et surveillance privée | Secret Window : hibou espion | D (fait) | Pistolet physique et surveillance au contact, sans dégâts ni esquive. |
| Padaille        | ×1,25 dégâts pendant 3 s           | Bras-outil **au hasard** : marteau, foret ou hache                                           | B        | Piste simple : tirage déterministe de l'outil, trois effets distincts. |
| Sayird          | Martial ; Little Eye retenable par Steal Chain | Contrôle un petit animal réel (jusqu’au hamster), partage vue et ouïe ; exclut les créatures matérialisées par le Nen | D (fait) | Corrigé le 2026-11-16 : Little Eye distinct des coups, volable par Kurapika, sans cible ni effet inventé en duel. |
| Silent Majority | 3 marques → 22 dégâts              | Dix suspects, quatre serpents, retour si révoqué sans victime                                | Retiré   | Retiré du roster le 2026-11-16 : aucune aptitude martiale connue.      |
| Terebellum      | Transfert réel des blessures       | Sweet Home : **transfère** les dégâts par contact simultané                                  | D (fait) | Corrigé le 2026-11-16 : contacts de mains vérifiés pendant les frames actives ; gauche seule pour ses blessures, droite et gauche pour celles d’autrui ; sans réceptacle, l’absorption à droite blesse sa main gauche. Coups et projectiles conservent les dégâts, sans esquive gratuite. Portée et coups porteurs restent des abstractions du duel. |
| Voconte         | Une esquive par porte              | Portes reliant des salles préparées de la base Heil-Ly                                       | B        | Le README veut qu'un terrain ne change aucune règle : à arbitrer.      |
| Yokotani | Gardes LSDF autonomes, expulsion sans dégâts | Planque Heil-Ly, Morena présente, présentation à un intrus en infraction | D (fait) | Corrigé le 2026-11-16 : juridiction explicite, gardes invulnérables, aucun dégât/point/knockdown ; Yokotani reste vulnérable. |

### Enregistrés mais hors roster jouable

`registry.ts` déclare aussi Morena, Marayam, Fugetsu, Kacho, Luzurus, Momoze, Salesale, Zhang Lei,
Gidal, Tubeppa et Tyson. Ils ne sont pas jouables ; à ne traiter que s'ils le deviennent. Écarts
notables : Momoze exige un **oui** explicite, Salesale échoue contre qui retient sa respiration,
Gidal exige le suicide de l'utilisatrice, Kacho est un double posthume.

## Bilan

| Verdict | Audit (41 jouables) | Au 2026-11-16 (40 jouables) |
| ------- | ------------------- | --------------------------- |
| A       | 13                  | 3                           |
| B       | 14                  | 15                          |
| C       | 11                  | 8                           |
| D       | 3                   | 14                          |

## Ordre de traitement proposé

1. ~~Corriger le bug Hinrigh~~ — fait.
2. **Constat 4 : traité.** Cluck, Beyond et Sayird jouent en martial pur ; Furykov conserve l’alerte informative de Combo Master ;
   Silent Majority est retiré du roster (utilisateur anonyme, aucune aptitude martiale connue).
3. **Les A à effet contraire**, du plus visible au moins visible : ~~Hisoka~~, ~~Chrollo~~, ~~Shizuku~~, ~~Camilla~~, ~~Halkenburg~~, ~~Hanzo~~ (faits), ~~Gel~~, ~~Longhi~~, ~~Yokotani~~ (fait).
4. **Le socle commun** : lire `condition` et `cost` depuis les fiches `ability-modules` (bloc
   `fighting` compilé, comme `arena`), puis une table de prédicats partagée avec l'Arena 3D.
5. **Les B**, par ordre de rendement : Mizaistom (carton jaune), Padaille (outil tiré), ~~Basho (trois
   vers)~~ (fait), ~~Leorio (poing par le sol)~~ (fait), ~~Phinks (rotations et poing droit)~~ (fait), ~~Terebellum (transfert)~~ (fait).
6. **Les C** : remplacer chaque bonus générique par l'effet de la fiche, ou l'étiqueter
   `gameplay-abstraction` dans le contrat.
