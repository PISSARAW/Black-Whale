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
   doigts coupés de Franklin) ne sont modélisés nulle part.
4. **La règle du roster est violée par le roster lui-même.** _Traité le 2026-11-16 pour cinq des six :_ Furykov, Cluck, Beyond, Musse et Sayird jouent en martial pur (`martialOnlyHatsu`). Silent Majority est retiré du roster jouable, qui passe à 40.
   Le README exclut « les pouvoirs qui
   exigent une préparation incompatible avec un duel ». Or Furykov (jours de co-présence), Cluck
   (oiseaux messagers), Beyond (malédiction posthume préparée), Silent Majority (dix suspects),
   Musse et Sayird (surveillance) n'ont aucun Hatsu de duel canon. Leurs effets en jeu sont
   inventés. **Décision à prendre :** les garder en martial pur, étiqueter honnêtement
   `gameplay-abstraction`, ou les retirer du roster.
5. **Une capacité volée reste à son propriétaire.** _Corrigé pour Skill Hunter le 2026-11-16 ; reste à faire pour Steal Chain._ Canon (Skill Hunter, Steal Chain) : la victime
   perd l'usage de la capacité tant qu'elle est tenue. Rien ne le modélise.
6. **Le motif « `hitStun ≥ 2` par frame » sert de paralysie générique** pour neuf Hatsu (Machi,
   Illumi, Mizaistom, Melody, Zakuro, Luzurus, Momoze, Longhi, Black Voice). Il efface les
   différences canon entre contrôle total, entrave physique, transe et contrat.

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
| Kurapika     | Chain Jail : Zetsu forcé 3 s                       | Restreint aura **et mouvement**, Brigade seulement, serment mortel | B        | Condition Brigade appliquée ; pas d'entrave du mouvement ; Emperor Time et son coût en vie absents.                                                                                                                |
| Hisoka       | Bungee Gum : **téléporte** la cible à 9 u          | Élastique, force selon la tension, rupture à 10 m                  | D (fait) | Corrigé le 2026-11-16 : traction élastique sur plusieurs frames, d'autant plus forte que la gomme est tendue ; la gomme reste attachée. La limite canon de 10 m n'est pas modélisée : la piste fait moins de 10 m. |
| Chrollo      | Copie le dernier Hatsu reçu ; Black Voice sur coup | Skill Hunter : livre + conditions de vol ; Black Voice : antenne   | B (fait) | Corrigé le 2026-11-16 : vol d'un Hatsu vu en action, par contact, que la victime perd ; Black Voice lié à son coup ; Sun and Moon n'explose qu'en paire. Reste abstrait : la question et la réponse.               |
| Benjamin     | +1 charge de dégâts par coup (max 3)               | Baton : capacités de soldats loyaux **décédés**                    | C        | Les charges ne correspondent à aucune capacité héritée (Air Blow est dans la fiche, absent du jeu).                                                                                                                |
| Tserriednich | Une esquive (« future sight »)                     | Vision à dix secondes, exige Zetsu et yeux fermés au préalable     | B        | L'esquive est juste ; la préparation visible (Zetsu, yeux clos), qui le rend vulnérable, manque.                                                                                                                   |
| Feitan       | Dégâts des spéciaux × (1 + blessures × 1,8)        | Pain Packer : restitue les dégâts déjà subis                       | D        | Fidèle dans l'esprit. Manque l'armure Rising Sun et le seuil de blessure.                                                                                                                                          |
| Saiyu        | 3 coups scellent 3 sens, puis Zetsu forcé          | Trois singes : vue, ouïe, parole                                   | B        | Les sceaux sont justes ; le Zetsu final est inventé. Piste : masquer réellement l'info du joueur visé.                                                                                                             |
| Theta        | Projectile : Zetsu forcé 1,5 s, −18 aura           | Zetsu imposé ; trois secondes d'immobilité le lèvent               | B        | La sortie par immobilité (choix tactique) manque.                                                                                                                                                                  |
| Biscuit      | Transformation : ×1,35 dégâts, ×0,68 dégâts reçus  | Hatsu canon = Magical Esthetician Cookie (soin, repos)             | C        | La vraie forme est son corps, pas un Hatsu ; Cookie n'existe pas en jeu. Étiquette à corriger.                                                                                                                     |
| Phinks       | +1 tour par déclenchement (max 7), +22 %/tour      | Ripper Cyclotron : moulinet visible ; < 4 tours = rien             | B        | Pas de seuil minimal ; tours gagnés sans moulinet visible. Coût canon 6, pas 40.                                                                                                                                   |

### Deuxième vague

| Combattant | Hatsu en jeu                                   | Canon (fiche)                                                           | Verdict  | Écart                                                                                                                                                                                             |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Franklin   | +10 dégâts et stun                             | Double Machine Gun : rafale soutenue, les constructions n'arrêtent rien | D        | Correct. Pourrait percer les défenses Nen ; doigts coupés (serment) non mentionnés.                                                                                                               |
| Machi      | Paralysie 1,5 s sur tout coup                  | Fils de Nen : suture, pistage                                           | **C**    | Paralysie inventée. Le canon donne soin (suturer ses plaies) et marquage de la cible.                                                                                                             |
| Illumi     | −12 aura, paralysie 2 s                        | Aiguilles : contact **et** ordre, marionnette jetable                   | B        | Abstraction acceptable ; l'ordre et une limite (une aiguille par marionnette) manquent.                                                                                                           |
| Kalluto    | 3 marques → 18 dégâts (« morsure de serpent ») | Fiche : poupées de papier de surveillance                               | C        | Le combat de Kalluto au papier est canon, mais le serpent est _à sourcer_.                                                                                                                        |
| Bonolenov  | Buff ×1,3 / ×0,82 pendant 2 s                  | Battle Cantabile : musique par les orifices, rythme continu             | B        | Ni rythme à tenir ni mouvement continu. Piste : séquence de trois temps (`three-beat-sequence`).                                                                                                  |
| Shizuku    | Draine PV et aura d'un **vivant**, la soigne   | Blinky n'aspire que le **non-vivant** désigné                           | D (fait) | Corrigé le 2026-11-16 : plus aucun drain du vivant ; Blinky avale pendant 0,5 s les objets réels lancés contre Shizuku (cartes, balles, aiguilles, pierres), jamais l'aura émise ou matérialisée. |
| Hinrigh    | Buff ×1,2 / ×0,86 (et auto-paralysie)          | Biohazard : objets touchés deviennent des animaux                       | **A**    | Effet inventé (le bug d'auto-paralysie est corrigé). Piste : transformer un projectile ou un objet en bête.                                                                                       |
| Mizaistom  | Entrave 1,5 s sur tout coup                    | Cross Game : **avertissement** avant l'entrave, parole libre            | B        | Il manque le carton jaune. Facile : premier coup = avertissement, second = entrave.                                                                                                               |
| Leorio     | +8 dégâts, stun                                | Remote Punch : l'aura traverse une surface                              | B        | Le poing devrait sortir du sol ou du mur, pas frapper au contact.                                                                                                                                 |
| Hanzo      | Une esquive par « clone »                      | Hanzo Skill 4 : double invisible, **corps endormi et immobile**         | **A**    | Le double n'esquive pas : il laisse le corps vulnérable. L'effet est inversé.                                                                                                                     |

### Troisième vague

| Combattant | Hatsu en jeu                          | Canon (fiche)                                                       | Verdict | Écart                                                                                    |
| ---------- | ------------------------------------- | ------------------------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------- |
| Rihan      | Buff + Zetsu forcé 3 s sur la cible   | Predator : plus fort à chaque condition correctement déduite        | C       | Le Zetsu est inventé. Piste : se renforcer en lisant les techniques adverses déjà vues.  |
| Zakuro     | Entrave 1,6 s                         | Bloody Mary : son propre sang, gouttes autonomes de recherche       | C       | Inventé.                                                                                 |
| Melody     | Transe 1,25 s, **même gardée**        | Musique qui apaise les auditeurs ; exige d'entendre                 | D       | Traverser la garde est cohérent avec le son. Manque la performance continue.             |
| Basho      | ×1,25 dégâts pendant 3 s              | Great Hiker : trois vers, puissance selon la qualité du poème       | B       | Piste forte : une saisie en trois temps dont la précision fixe la puissance.             |
| Camilla    | Contre qui soigne 12 PV sur tout coup | Cat's Name : seulement à sa **mort**, tue le tueur direct           | **A**   | Devrait annuler un K.-O. direct et renvoyer le coup fatal, une fois.                     |
| Halkenburg | +20 dégâts et Zetsu si non gardé      | Flèche qui perce **toute défense**, échange deux âmes               | **A**   | La flèche devrait être imparable ; le Zetsu est inventé ; les partisans requis manquent. |
| Gel        | Venin : drain d'aura                  | Snake Arm : bras-serpent qui enserre, bloqué dès la 2ᵉ étreinte     | **A**   | Aucun venin dans la fiche. Devrait être une entrave par paliers.                         |
| Lynch      | Stun + vulnérabilité ×1,25            | Body and Soul : question puis coup, le corps répond la vérité       | C       | Capacité d'information. Piste : révéler la prochaine action de l'adversaire.             |
| Luini      | Une esquive par téléportation         | Entrées préparées et retour marqués                                 | B       | Il manque les points d'entrée posés à l'avance.                                          |
| Bill       | Se soigne 10 PV et se renforce        | Erigeron : forte sur les plantes, **faible** sur un Nen-user vivant | C       | Le buff personnel est inventé.                                                           |

### Quatrième vague et Yokotani

| Combattant      | Hatsu en jeu                       | Canon (fiche)                                                                                | Verdict  | Écart                                                                  |
| --------------- | ---------------------------------- | -------------------------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------- |
| Furykov         | Focus combo ×1,2 pendant 3 s       | Combo Master : **jours** de co-présence ; aucun autre Hatsu pendant                          | D (fait) | Martial pur depuis le 2026-11-16 : aucun effet de Hatsu.               |
| Cluck           | ×1,15 dégâts pendant 3 s           | Oiseaux messagers                                                                            | D (fait) | Martial pur depuis le 2026-11-16 : aucun effet de Hatsu.               |
| Beyond          | Malédiction : −15 aura, ×1,2 reçus | Malédiction posthume liée à un sacrifice préparé                                             | D (fait) | Martial pur depuis le 2026-11-16 : aucun effet de Hatsu.               |
| Longhi          | Entrave 2 s                        | Moonlight Act : accord **volontaire** aux termes explicites                                  | **A**    | Le consentement manque, et c'est toute la capacité.                    |
| Musse           | Une esquive                        | Secret Window : hibou espion                                                                 | D (fait) | Martial pur depuis le 2026-11-16 : aucun effet de Hatsu.               |
| Padaille        | ×1,25 dégâts pendant 3 s           | Bras-outil **au hasard** : marteau, foret ou hache                                           | B        | Piste simple : tirage déterministe de l'outil, trois effets distincts. |
| Sayird          | Une esquive                        | Little Eye : insecte qui filme                                                               | D (fait) | Martial pur depuis le 2026-11-16 : aucun effet de Hatsu.               |
| Silent Majority | 3 marques → 22 dégâts              | Dix suspects, quatre serpents, retour si révoqué sans victime                                | Retiré   | Retiré du roster le 2026-11-16 : aucune aptitude martiale connue.      |
| Terebellum      | Une charge d'évitement             | Sweet Home : **transfère** les dégâts par contact simultané                                  | B        | Devrait rediriger les dégâts, pas les annuler.                         |
| Voconte         | Une esquive par porte              | Portes reliant des salles préparées de la base Heil-Ly                                       | B        | Le README veut qu'un terrain ne change aucune règle : à arbitrer.      |
| Yokotani        | Une garde LSDF                     | Gardiens invincibles **dans la planque de Morena**, Morena présente ; expulsent sans blesser | **A**    | Hors de la planque, LSDF ne fonctionne pas.                            |

### Enregistrés mais hors roster jouable

`registry.ts` déclare aussi Morena, Marayam, Fugetsu, Kacho, Luzurus, Momoze, Salesale, Zhang Lei,
Gidal, Tubeppa et Tyson. Ils ne sont pas jouables ; à ne traiter que s'ils le deviennent. Écarts
notables : Momoze exige un **oui** explicite, Salesale échoue contre qui retient sa respiration,
Gidal exige le suicide de l'utilisatrice, Kacho est un double posthume.

## Bilan

| Verdict | Audit (41 jouables) | Au 2026-11-16 (40 jouables) |
| ------- | ------------------- | --------------------------- |
| A       | 13                  | 7                           |
| B       | 14                  | 15                          |
| C       | 11                  | 8                           |
| D       | 3                   | 10                          |

## Ordre de traitement proposé

1. ~~Corriger le bug Hinrigh~~ — fait.
2. **Constat 4 : traité.** Furykov, Cluck, Beyond, Musse et Sayird jouent en martial pur ;
   Silent Majority est retiré du roster (utilisateur anonyme, aucune aptitude martiale connue).
3. **Les A à effet contraire**, du plus visible au moins visible : ~~Hisoka~~, ~~Chrollo~~, ~~Shizuku~~ (faits), Camilla,
   Halkenburg, Hanzo, Gel, Longhi, Yokotani.
4. **Le socle commun** : lire `condition` et `cost` depuis les fiches `ability-modules` (bloc
   `fighting` compilé, comme `arena`), puis une table de prédicats partagée avec l'Arena 3D.
5. **Les B**, par ordre de rendement : Mizaistom (carton jaune), Padaille (outil tiré), Basho (trois
   vers), Leorio (poing par le sol), Phinks (seuil de quatre tours), Terebellum (transfert).
6. **Les C** : remplacer chaque bonus générique par l'effet de la fiche, ou l'étiqueter
   `gameplay-abstraction` dans le contrat.
