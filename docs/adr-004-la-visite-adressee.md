# ADR-004 : La visite adressée — lire, atteindre et adresser les personnages de /tour

**Statut :** Accepté — 2026-08-04
**Date :** 2026-08-04
**Décideur :** mainteneur unique du dépôt
**Dépend de :** ADR-001 (« le canon compile ») — s'y conforme ; ADR-002 (découpage 500) —
s'y conforme ; **ADR-003 (la visite habitée) — lève son §6.1 et son §6.2**
**Périmètre :** `/tour` (`apps/web/src/lib/tour/cast`, `lib/tour/bodyKinds.ts`, le load serveur du tour)
**Hors périmètre :** les emplois du temps et les déplacements scénarisés (ADR-003 §6.3, inchangé) ;
toute conséquence durable sur un corps du canon (voir §2.3)

---

## 1. Contexte

L'ADR-003 a peuplé la visite et s'est arrêté à la porte : les silhouettes sont
là, elles portent leur aura, elles castent d'office — et le visiteur ne peut
rien faire d'elles. Le geste existant s'arrête au constat : viser un corps rend
sa fiche de provenance (`cast/provenance.ts`), exactement comme viser un
pilier rend la sienne. Trois choses manquent, et l'ADR-003 les avait nommées
lui-même en les remettant à plus tard (§6.1 et §6.2) :

| Ce qui manque                            | Où le trou se voit                                                                                                                                                                                    |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Le Nen du visiteur ne rencontre personne | `NenObjectInteraction` (`auraInteraction.ts`) ne connaît que des solides ; le En du visiteur balaie une pièce sans jamais dire qui s'y tient                                                          |
| Les hatsu ne visent pas un corps         | `TourCastInput` a `targetId` (pièce) et `targetSolidId` (solide), rien pour une personne                                                                                                              |
| Cinq hatsu restent inertes               | `needle`, `truth-punch`, `postmortem-curse`, `damage-transfer`, `training-shot` : le catalogue les tient (`hatsuProfiles.gen.ts`), la marche ne les porte pas, **parce qu'ils agissent sur des gens** |
| On ne peut pas leur parler               | rien, nulle part                                                                                                                                                                                      |

Le gel qui bloquait les cinq est levé : le chantier 3 de l'ADR-001 a livré
`hatsuProfiles.gen.ts` et `interactionManifests.gen.ts`, les profils sont
projetés du catalogue au lieu d'être redéclarés.

La difficulté de ce chantier n'est pas technique. Elle est doctrinale, et elle
tient en une phrase : **la marche n'a pas le droit d'affirmer sur un personnage
nommé ce que le manga n'affirme pas.** Un visiteur qui tue Kurapika dans un
couloir, un garde qui répond une réplique que personne n'a écrite, une aiguille
d'Illumi qui laisse un pantin derrière elle après que le visiteur a changé de
pont : chacune de ces trois choses serait la plus grosse invention du site,
au sens exact où `tour-immersion.md` l'entend.

---

## 2. Décision

Ouvrir **trois gestes** sur le corps visé, et un seul modèle de conséquence.

### 2.1 Le corps est une cible, avec l'identité qu'il a déjà

La cible est le `characterId` que l'apparition `avatar` porte déjà — l'ADR-003
§6.1 avait écrit que ce serait « l'interface qu'elles attendront », et c'est
elle. Le viseur est `aimedPerson()`, qui existe, qui est pur et qui ne fait pas
un second raycaster. **Aucune nouvelle façon de désigner quelqu'un n'est
introduite** : le corps qu'on interroge est celui dont on lit déjà la fiche.

Corollaire : ce qui n'est pas dessiné n'est pas atteignable. Une personne que
le cap du lecteur ne montre pas n'est pas une cible, parce qu'elle n'est pas là.

### 2.2 Trois gestes, trois modules, trois vocabulaires distincts

- **Lire** (`cast/reading.ts`) — ce que le Nen du visiteur lui apprend du corps
  visé. Pur : `(post, état Nen du visiteur) → lecture`. Le vocabulaire est
  celui du manga et rien d'autre : sans aura, on ne lit rien ; le Ren se sent ;
  le En dit qu'un corps est dans son rayon ; le Gyo seul perce ce qu'un Zetsu
  ou un In cache. La lecture ne rend que des faits que l'archive porte :
  catégorie déclarée (`characters.json` → `nen.typeLabel`), aura portée
  (la conduite de l'ADR-003), présence d'une bête. **Le Ko est refusé**, pour
  la raison symétrique que `cast/nen.ts` refuse déjà de le donner à un garde :
  le Ko est l'engagement d'un coup, et la marche ne porte pas de coup.
- **Atteindre** (`cast/reach.ts`) — le hatsu tenu, appliqué au corps visé. Une
  table **fermée** : un `kind` qui n'y est pas ne peut rien faire à personne,
  et le refus est un résultat affiché (« cette technique ne s'adresse pas à un
  corps »), pas un silence.
- **Adresser** (`cast/address.ts`) — la parole. Voir §2.4.

### 2.3 Rien ne persiste, rien ne blesse — le monde des prises est à part

Ce que les hatsu font aux corps vit dans `cast/bodies.ts`, **hors de
`TourWorld`**, et ce n'est pas un détail d'implémentation : c'est la décision.

- Une prise porte sa fin (`until`). Elle expire toute seule sur l'horloge que la
  page tient déjà.
- Une prise meurt quand le visiteur quitte la pièce, et quand l'aura tombe.
  Le corps redevient exactement ce que la projection du chapitre dit qu'il est.
- **Aucun état de corps n'est modifié** : pas de `BODY_STATE_CHANGED`, pas de
  mort, pas de blessure, pas de contrôle qu'on emporte avec soi. Yomotsu Hegui
  ne tue personne dans la marche : elle pose une malédiction visible et datée
  qui s'éteint, ce qui est la seule moitié de la technique que la visite puisse
  montrer sans mentir.
- La marche reste une **visite**. Une conséquence qui survivrait au pas suivant
  serait une branche de récit, et les branches de récit ont déjà leur moteur
  (`simulation-engine`) et leur surface ; les y verser plus tard ne coûtera que
  de brancher `cast/bodies.ts` dessus, précisément parce qu'il est séparé.

### 2.4 La parole est une lecture du catalogue, jamais une réplique

Le catalogue n'a aucun dialogue, et **on n'en écrira pas** : une réplique
écrite à la main dans `apps/web` serait la septième déclaration de faits que
l'ADR-001 principe 1 interdit, et l'option C de l'ADR-003 (« scripter des
scènes ») la refusait déjà.

Ce que le catalogue a, en revanche, est daté et abondant : un rôle à bord
(`shipLocation.role`), une faction, une trajectoire chapitre par chapitre
(`mapTrajectory`, 374 étapes), une catégorie de Nen déclarée et sourcée
(`nen`), une liste de techniques (`abilities.json` par propriétaire). **Adresser
un corps, c'est lui poser une de ces questions et recevoir la ligne du
catalogue qui y répond, avec son chapitre.** Six questions, une réponse chacune,
chacune badgée `panneau` comme la fiche de provenance :

| Question             | Ce qui répond                                       |
| -------------------- | --------------------------------------------------- |
| Qui êtes-vous ?      | `canonicalName` + `shipLocation.role`               |
| Pour qui ?           | la faction                                          |
| Depuis quand ici ?   | l'étape de trajectoire courante (`fromChapterId`)   |
| Où êtes-vous passé ? | les étapes ≤ cap, dans l'ordre                      |
| Votre Nen ?          | `nen.typeLabel`, ou le silence de l'archive         |
| Vos techniques ?     | les capacités du catalogue dont il est propriétaire |

Trois règles closent la porte aux abus :

1. **Le cap borne la réponse comme il borne la présence.** Une étape de
   trajectoire postérieure au cap n'est pas dite ; elle est _comptée_ comme non
   dite (« l'archive en sait plus que votre chapitre »), ce qui est une vérité
   sur l'archive et pas un spoiler.
2. **Ce que l'archive ne date pas ne se dit qu'à un lecteur sans cap.**
   `suspectedAllegiance` et `identity` (l'identité usurpée) sont des faits réels
   du catalogue, mais sans chapitre : la marche ne peut pas prouver qu'ils ne
   spoilent pas, donc elle se tait devant un lecteur capé. C'est le seul endroit
   de la marche où l'absence de provenance rend une donnée muette, et c'est
   volontaire.
3. **Le corps ne fait jamais que citer.** Aucune réponse n'est reformulée à la
   première personne au-delà de la phrase-cadre traduite : la ligne affichée est
   la valeur du catalogue.

**Body and Soul, seule exception, et elle est la démonstration.** La technique
de Lynch extrait ce qu'un corps ne dirait pas : dans la marche, elle descelle
les deux lignes de la règle 2 — et seulement pour un lecteur sans cap, qui est
justement celui à qui elles ne sont pas cachées. Un lecteur capé reçoit le refus
de la règle 2, ce qui est le comportement correct d'une archive, et le seul
« coup » de la marche n'obtient donc jamais plus que ce que l'archive donne.

### 2.5 Les cinq hatsu « à personnes », portés par une seconde porte

Ils entrent par `cast/reach.ts` et **non** par `castInTour`. Deux raisons :

- `hatsu.ts` fait 5 364 lignes, il est exempté du cliquet ADR-002, et l'ADR-003
  §4 s'était engagé à ne pas le grossir. Cet ADR le touche en **deux lignes** :
  `worksInTour` accepte désormais l'union des kinds de pièce et des kinds de
  corps, ce qui est ce qui rend les cinq sélectionnables dans le dock.
- La liste des kinds qui atteignent un corps vit dans `lib/tour/bodyKinds.ts`,
  un module-feuille sans dépendance, pour que `hatsu.ts` et `cast/` la lisent
  tous les deux sans cycle.

Aucune technique n'est inventée, aucun `kind` n'est créé : les cinq existent
dans `hatsuProfiles.gen.ts`, projetés depuis `data/abilities/abilities.json`.
Ce que cet ADR ajoute est **ce qu'ils font dans une marche**, ce qui est une
règle de rendu, bornée par le §2.3.

---

## 3. Options considérées

| Option                                                                       | Verdict                                                                                                                                                                                                                    |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A. Répliques écrites par personnage (dans `data/` ou dans le site)           | ⛔ faits non sourcés, contredits par l'ADR-001 principe 1 et l'option C de l'ADR-003. Et 224 personnages à écrire, donc 224 occasions d'inventer                                                                           |
| B. **Trois gestes, effets réels et éphémères, parole projetée du catalogue** | ✅ retenue                                                                                                                                                                                                                 |
| C. Perception seule (les hatsu ne font que révéler)                          | ⛔ trop conservateur : rend inutiles quatre des cinq capacités que le §6.1 attendait, et ampute Chain Jail, Needle People, Nen Stitches de ce qu'elles sont                                                                |
| D. Effets durables versés dans une branche de simulation                     | ⏸ pas maintenant, et pas contre : `cast/bodies.ts` est séparé exprès pour que ce soit un branchement et non une réécriture. Une branche demande une UI de branche (bandeau, retour au canon), c'est un chantier à soi      |
| E. Parole par le knowledge-engine (« que savez-vous de X ? »)                | ⏸ doctrinalement le plus beau, mais la base porte cinq faits seedés : la quasi-totalité des corps n'aurait rien à dire. À reprendre quand `Fact`/`KnowledgeState` seront peuplés — l'interrogatoire du §2.4 est la même UI |

---

## 4. Conformité ADR-002

Tout le code nouveau vit sous `lib/tour/cast/` en modules ≤ 500 lignes,
complexité ≤ 10, ≤ 3 paramètres. **Aucune entrée ajoutée aux listes
d'exemption** — le cliquet ne peut que rétrécir. `hatsu.ts` gagne deux lignes et
aucune responsabilité. Les modules sont purs et testés sans canvas ni base,
comme le reste de `cast/`.

| Module                  | Responsabilité                                             |
| ----------------------- | ---------------------------------------------------------- |
| `lib/tour/bodyKinds.ts` | feuille : quels `kind` atteignent un corps                 |
| `cast/dossier.ts`       | pur : catalogue × cap → la fiche que le serveur envoie     |
| `cast/address.ts`       | pur : fiche → interrogatoire (question, réponse, chapitre) |
| `cast/reading.ts`       | pur : (poste, Nen du visiteur) → ce qu'on lit du corps     |
| `cast/bodies.ts`        | pur : les prises éphémères, leur pose et leur expiration   |
| `cast/reach.ts`         | pur : (kind, poste, prises) → résultat + prise             |
| `cast/nen.ts` (étendu)  | la conduite réagit à être visée personnellement            |

---

## 5. Conséquences

**Plus facile ensuite :** la branche de simulation (option D) n'a qu'à consommer
`cast/bodies.ts` ; le knowledge-engine (option E) n'a qu'à ajouter des questions
à `address.ts` ; la conduite de l'ADR-003 peut caster les cinq nouvelles
techniques le jour où on le veut, sans rien apprendre.

**Coûts :** la marche porte un second monde (petit, borné, expiré à chaque pas) ;
le payload du tour grossit d'une fiche par corps dessiné, bornée au cap ; six
questions × deux langues à tenir en parité i18n.

**À revisiter :** si `Fact`/`KnowledgeState` sont peuplés, le §2.4 doit passer
de la projection du catalogue à la requête de perspective — c'est la même
surface et une meilleure vérité.
