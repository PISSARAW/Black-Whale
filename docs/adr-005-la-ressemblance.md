# ADR-005 : La ressemblance — dessiner les nommés comme le canon les dessine

**Statut :** Accepté — 2026-08-04, mis en œuvre 2026-08-04 (P0 à P4 ; voir §7)
**Date :** 2026-08-04
**Décideur :** mainteneur unique du dépôt
**Dépend de :** ADR-001 (« le canon compile ») — s'y conforme ; ADR-002 (découpage 500) —
s'y conforme ; ADR-003 (la visite habitée) — prolonge sa phase 1 ;
`docs/tour-2.0.md` — son rejet des GLTF reste entier
**Périmètre :** `apps/web/src/lib/tour` (`humanProfiles`, `humanHead`, `humanFigure` — et
deux fichiers nouveaux), `data/characters`, `packages/contracts`
**Hors périmètre :** modèles 3D externes (§3), textures et UV, rig squelettique,
expressions animées au-delà des cinq existantes, bêtes gardiennes
(`nenCreatureFigure` les tient déjà)

---

## 1. Contexte

L'ADR-003 a peuplé la visite, l'ADR-004 lui a donné la parole — et personne n'y
ressemble à personne. Mesures du 2026-08-04 :

| Fait vérifié                     | Valeur                                                                                                                          |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Ressemblance individuelle à bord | **2 sur 224** : `morena` (profil dédié) et `silent-majority` (masque), via `addMorenaDetails` / `addSilentMajorityCostume`      |
| Tout le reste                    | 9 profils de **rôle** (`ROLE_PROFILES`) + variation par `identityHash` : taille ×0,96–1,04, 5 peaux, 6 coiffures tirées au hash |
| Tête                             | `SphereGeometry(0.19, 10, 8)` écrasée en 3 visages ; yeux = 2 plans de 5,5 cm ; 8 coiffures génériques ; 5 expressions          |
| Kurapika au poste 1014           | dessiné comme n'importe quel `hunter` : couleurs de rôle, coiffure au hash                                                      |
| Grammaire de rendu               | aplats `MeshBasic` + contour en coque inversée (×1,045/1,055) — déjà celle d'une planche                                        |

Le constat tient en une phrase : **le renderer sait déjà « faire manga »**
(aplats et encre), ce qui manque n'est pas une technique mais une donnée —
rien, nulle part dans `data/`, ne dit à quoi ressemble Kurapika.

Et l'anime ne viendra pas au secours : l'adaptation de 2011 s'arrête avant
l'embarquement. Pour l'arc de la succession, la seule source visuelle est le
manga, majoritairement en noir et blanc. La couleur y est donc un problème de
provenance à part entière (§2.3).

---

## 2. Décision

**La ressemblance est un fait de catalogue, pas un effet de rendu.** On déclare
`data/characters/appearance.json` — une entrée par personnage d'une **liste
fermée** (annexe A), schéma zod dans `packages/contracts` — et
`humanProfiles.ts` la projette, exactement comme `wardrobe.ts` projette le
costume depuis le rôle.

### 2.1 Une déclaration par visage — pas d'inférence, pas de défaut

Même logique que `wardrobe.ts` : table fermée. L'absence d'entrée rend le
profil de rôle actuel, hash compris — un garde non déclaré est dessiné
aujourd'hui comme hier. Un personnage sans planche exploitable **reste non
déclaré** : ne pas inventer un visage est le même geste que ne pas inventer un
passager. Deux tests le tiennent :

- **couverture** : chaque id de l'annexe A a son entrée (sauf celles marquées
  « différée », listées avec le motif) ;
- **anti-invention** : chaque entrée d'`appearance.json` cite un id existant de
  `characters.json`, et rien d'autre.

### 2.2 La silhouette d'abord

À distance de marche (LOD à 24 m, instancing au-delà de 20 corps), la
reconnaissance tient à quatre choses, dans cet ordre : le **gabarit** (dont
deux gabarits nouveaux, `child` et `infant` — Marayam et Woble n'en ont
aucun aujourd'hui), la **coiffure**, la **palette**, une ou deux **pièces
signatures**. Le visage (yeux, expression) ne compte qu'au premier plan.
L'annexe A est écrite dans cet ordre, et les phases de rendu (§4) le suivent.

### 2.3 La couleur porte sa base, comme une date

Miroir exact du `basis` d'`occurredAt` (`data/CONVENTIONS.md`) : chaque bloc de
couleurs déclare

- `basis: "attested"` — page couleur du magazine, couverture de volume, anime
  2011 (personnages d'avant ch. 340), matériel officiel cité ;
- `basis: "chosen"` — choix éditorial stable, documenté dans `note`.

Un `chosen` déguisé en `attested` est le mensonge exact que la convention des
dates interdit déjà.

### 2.4 Schéma (exemple : `kurapika`)

```json
{
  "id": "kurapika",
  "body": { "build": "slim", "height": 0.97, "frame": "adult" },
  "head": { "face": "narrow", "hairStyle": "bob", "expression": "severe" },
  "colours": {
    "basis": "attested",
    "source": "anime 2011 ; couvertures vol. 34–37",
    "skin": "0xf0e0cc",
    "hair": "0xe8c860",
    "attire": {
      "jacket": "0x232430",
      "shirt": "0xf2efe8",
      "trousers": "0x232430",
      "accent": "0xb01e2e"
    }
  },
  "attire": "suit",
  "signatures": ["chain-right-hand"],
  "verified": { "chapterIds": ["ch-358"], "status": "confirmed" },
  "note": "Les yeux écarlates sont un état (EFFECT_STATE_CHANGED via Emperor Time), pas un fait d'appearance."
}
```

Les vocabulaires (`hairStyle`, `signatures`, `attire`) sont fermés : annexe B
et §4-P2. Une valeur hors vocabulaire est une erreur zod, pas une variante.

### 2.5 Priorités d'habillage

`attire` déclaré > `wardrobe.ts` (rôle) > rôle brut. `wardrobe.ts` reste
l'autorité pour tout non-déclaré ; `appearance` ne dit jamais ce que fait la
personne — seulement de quoi elle a l'air.

---

## 3. Ce qu'on ne fait pas

- **Modèles 3D externes (GLTF/GLB)** : le rejet de `tour-2.0.md` est maintenu
  tel quel — un asset importé casse le bake par sommet, la collision, la
  provenance, et les modèles « trouvés » de personnages HxH sont des rips sans
  licence. Un GLB skinné casserait de surcroît le rig procédural
  (`turns`, `humanAnimation`), le LOD et l'instancing. La porte « modèles
  auteur sourcés un par un » reste où `tour-2.0.md` l'a laissée : fermée, et ce
  n'est pas cet ADR qui l'ouvre.
- **Textures et UV** : zéro. Les marques de visage (croix de Chrollo, étoile et
  larme de Hisoka) sont de petits meshes plats, comme les yeux le sont déjà.
- **Photoréalisme** : la cible est la planche, pas le portrait.
- **Apparence générée** : aucune entrée d'`appearance.json` n'est produite par
  un modèle génératif ; chaque champ est écrit à la main contre une planche
  citée dans `verified.chapterIds`.

---

## 4. Rendu — cinq phases

| Phase | Contenu                                                                                                                                                                                                                                                                                              | Durée  |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| P0    | Schéma zod ; `appearance.json` pour l'annexe A ; chaque « à confirmer » tranché planche en main, chaque « différée » statuée ; doublon `pyon`/`piyon` du catalogue résolu ; tests couverture + anti-invention                                                                                        | ~1-2 j |
| P1    | `humanProfile()` lit `appearance` avant le rôle ; `humanStateKey` l'intègre (rebuild du rig au changement) ; **migration Morena** : le profil en dur devient la projection de son entrée — une déclaration par fait                                                                                  | ~1 j   |
| P2    | Gabarits `adult`/`child`/`infant` ; proportions de planche par `build` ; **`humanHair.ts`** (nouveau, ≤500 l) : mèches par style en primitives (cônes, lathe, extrusion) ; styles nouveaux fermés : `slicked-back`, `pompadour`, `drills`, `chonmage`, `hime`, `curly`, `afro`, `wild`, `bald-crown` | ~2-3 j |
| P3    | **`humanSignature.ts`** (nouveau, ≤500 l) : pièces de l'annexe B ; `humanCostume.ts` (424 l) n'est pas grossi                                                                                                                                                                                        | ~2-3 j |
| P4    | Second ton d'ombre baké **par sommet** (pipeline de bake existant) ; contour de silhouette épaissi au premier plan ; grille de portraits en captures de référence CI                                                                                                                                 | ~1-2 j |

La coiffure passe en premier (P2 avant P3) parce qu'elle est le premier
porteur d'identité d'un dessin de Togashi — avant le visage, avant le costume.

---

## 5. Garde-fous

- **« L'anonyme reste anonyme »** : un corps sans entrée `appearance` rend un
  diff de capture nul contre la référence actuelle.
- **Budget** : le cache de géométrie partagé de `humanFigure` reste la règle —
  pas de géométrie par individu hors pièces signatures ; `renderer.info`
  surveillé comme dans tour-2.0.
- **ADR-002** : deux fichiers nouveaux ≤500 l, aucun existant ne franchit 500,
  aucun ajout aux exemptions.

---

## 6. Scène d'acceptation

Couloir du 1014, dernier événement sous cap ch. 361 :

- Kurapika — carré blond, costume sombre, chaîne à la main droite — est
  reconnaissable **avant** d'être visé ; Bill à côté de lui, distinct.
- Dans la pièce, Oito (jeune, frange, robe simple) porte Woble (gabarit
  `infant`) : les deux silhouettes vont ensemble.
- King's Living Quarters : Nasubi barbu, couronné, en robe d'apparat.
- Salon de Camilla : le diadème suffit à la nommer de loin.
- Un garde sans entrée est rendu strictement comme aujourd'hui.
- La fiche de provenance au viseur cite les `chapterIds` de l'appearance à côté
  de ceux de la présence.

---

## Annexe A — la liste fermée : à quoi ils ressemblent

71 ids, dont 4 différées. Chaque entrée est un brouillon sourcé de mémoire de
lecture : la phase 0 relit **chaque** entrée planche en main avant de l'écrire
dans `appearance.json`, et les mentions _(à confirmer)_ sont tranchées là.
L'ordre de chaque notice suit §2.2 : gabarit, coiffure, palette, signatures,
visage.

### A.1 Le roi et les reines (9)

- **`nasubi-hui-guo-rou`** — Massif sans être un combattant : poitrail de
  patriarche, barbe noire dense qui encadre toute la mâchoire, moustache,
  cheveux gominés en arrière, petits yeux satisfaits. Robe d'apparat et
  couronne kakine. Signatures : `beard-full`, `crown`. Couleurs : chosen.
- **`unma-hui-guo-rou`** — Première épouse : âgée, port massif et droit,
  visage lourd et immobile, chignon strict. Robe de cour _(coiffure exacte à
  confirmer)_.
- **`duazul-hui-guo-rou`** — Mère de quatre prétendants sérieux : mûre,
  altière, longs cheveux sombres, regard dur de stratège _(à confirmer)_.
- **`tang-zhao-li-hui-guo-rou`** — Réservée, chignon serré, tenue
  traditionnelle sobre ; la mère effacée d'un fils calme _(à confirmer)_.
- **`katrono-hui-guo-rou`** — **différée** : pas de planche exploitable
  recensée — à statuer en phase 0.
- **`swinko-swinko-hui-guo-rou`** — **différée** : idem.
- **`seiko-hui-guo-rou`** — **différée** : idem.
- **`sevanti-hui-guo-rou`** — Ronde, sourcils froncés en permanence, cheveux
  courts bouclés serrés ; l'autorité domestique faite reine (scènes avec
  Momoze et Marayam).
- **`queen-oito`** — La huitième et la plus jeune : fine, jolie, cheveux
  sombres mi-longs et raides, frange, grands yeux inquiets ; robe simple, loin
  du faste des aînées ; Woble contre elle — les deux silhouettes vont
  ensemble.

### A.2 Les quatorze princes

- **`prince-benjamin`** — Le colosse de la fratrie : le plus grand et le plus
  lourd, cou plus large que le crâne, musculature d'haltérophile sous
  l'uniforme militaire à décorations. Cheveux noirs courts dressés en brosse,
  **favoris épais** qui descendent le long de la mâchoire, petits yeux
  enfoncés. Signatures : `mutton-chops`, carrure hors gabarit
  (`shoulders` ≈ 1,3).
- **`prince-camilla`** — Jeune femme fine au port méprisant : longs cheveux
  noirs et lisses, frange, **diadème**, robe de cour sombre à col montant. La
  moue est le visage — hautaine au repos, folle dans la colère _(coiffure
  exacte à confirmer)_. Signatures : `tiara`.
- **`prince-zhanglei`** — Corpulence tranquille, visage plein, cheveux noirs
  très courts plaqués, petit sourire permanent de négociant. **Tunique
  chinoise à col droit** plutôt que costume occidental. Signatures : `attire`
  dédié (`changshan`).
- **`prince-tserriednich`** — Grand, mince, le beau visage anguleux de la
  fratrie : cheveux noirs coiffés en arrière dont deux ou trois **mèches
  retombent sur le front**, sourcils fins, sourire qui monte trop haut.
  Élégance parfaite. Le même visage doit pouvoir porter « séduisant » et
  « abject » — l'écart entre les deux est le personnage.
- **`prince-tubeppa`** — Visage fermé de chimiste, cernes, cheveux sombres
  mi-longs et raides, frange irrégulière ; tenue stricte, gants _(gants à
  confirmer)_. Expression : `severe`.
- **`prince-tyson`** — Ronde et rayonnante : boucles volumineuses, cils
  dessinés, mouche, tenue de scène à froufrous et cœurs — le Livre de Tyson
  est aussi son style graphique. Signatures : `curly` en volume, `frills`.
- **`prince-luzurus`** — Grand, détendu jusqu'à l'avachissement, **paupières
  tombantes**, cheveux mi-longs raides encadrant le visage (coupe rideau) ;
  tenue décontractée. Expression : `tired`.
- **`prince-salesale`** — Corpulent, **lèvres énormes** — la signature absolue
  du personnage —, cheveux courts gominés, chemise ouverte de bon vivant.
  Signatures : `lips-full` (seul renflement de bouche du vaisseau).
- **`prince-halkenburg`** — Grand, mince, droit ; cheveux mi-longs tombant sur
  les épaules, **lunettes fines**, visage grave d'honnête homme ; costume
  sobre sans décorations — le refus du faste est son costume. Signatures :
  `glasses-thin`. Couleur des cheveux : chosen (châtain clair).
- **`prince-kacho`** — Jeune femme au sourire de scène : cheveux noirs longs
  et lisses, frange, maquillage d'idole, tenue glamour. L'expression publique
  est un masque — le rendu ne montre que le masque, la provenance raconte le
  reste.
- **`prince-fugetsu`** — Jumelle de Kacho, mêmes traits, la douceur en plus et
  l'assurance en moins : mêmes cheveux longs, regard ailleurs. La paire doit
  être manifestement une paire — **même profil, deux expressions**.
- **`prince-momoze`** — Adolescente menue, cheveux mi-longs sages, serre-tête
  _(à confirmer)_, l'air de s'excuser d'être là. Expression : `anxious`.
- **`prince-marayam`** — Petit garçon, **gabarit `child`** (nouveau), cheveux
  noirs sages, tenue princière miniature ; toujours près de Sevanti.
- **`prince-woble`** — Nourrisson, **gabarit `infant`** (nouveau) : dans les
  bras d'Oito, touffe de cheveux clairs, grands yeux. Woble n'est jamais une
  silhouette debout.

### A.3 Hunters à bord (12)

- **`kurapika`** — Mince, androgyne, **carré blond** impeccable, grands yeux
  gris-brun — écarlates quand Emperor Time s'allume : un état d'EFFECT, pas un
  fait d'appearance. À bord : **costume sombre et cravate** d'employé de la
  famille, chaîne matérialisée à la main droite quand il caste. Couleurs :
  attested (anime, couvertures). Signatures : `chain-right-hand`.
- **`leorio-paradinight`** — Grand, costume, petites **lunettes teintées
  rondes**, cheveux noirs courts en brosse, bouc naissant, mallette.
  Couleurs : attested.
- **`cheadle-yorkshire`** — Petite, lunettes, **cheveux verts** au carré
  (attested), blouse sur tailleur ; l'air d'un médecin qui n'a pas dormi.
- **`mizaistom-nana`** — Grand gabarit tranquille, mâchoire large, cheveux
  courts, veste à **motif pie noir et blanc** (la Vache). Attested.
- **`botobai-gigante`** — Le plus massif des zodiaques : sexagénaire
  monumental, moustache, costume — le Dragon.
- **`kanzai`** — Jeune, cheveux hérissés à mèches bicolores (le Tigre), veste
  courte, l'impatience au visage _(teintes à confirmer)_.
- **`saiyu`** — Grand, dégingandé, bâton, cigarette, yeux mi-clos — le Singe.
- **`saccho-kobayakawa`** — Le Cheval : costume, carrure posée _(silhouette à
  confirmer)_.
- **`cluck`** — La Poule : femme aux cheveux relevés en crête souple _(à
  confirmer)_.
- **`ginta`** — Le Mouton : colosse hirsute _(à confirmer)_.
- **`gel`** — Le Serpent : femme longiligne aux cheveux lisses _(à
  confirmer)_.
- **`beyond-netero`** — Vieillard hors gabarit : masse de vieux chêne, longue
  crinière et barbe, sourire du père — en cellule, mais la cellule se visite.
- _Note de catalogue :_ `pyon` **et** `piyon` existent tous deux dans
  `characters.json` — doublon probable (la Lapine), à statuer en phase 0 avant
  toute entrée.

### A.4 Gardes importants (17)

- **`bill`** — Jeune, visage long, cheveux courts, l'air fiable et fatigué ;
  premier compagnon de poste de Kurapika _(détails à confirmer)_.
- **`melody`** — Minuscule, ronde, crâne presque nu à deux touffes latérales,
  grandes oreilles, dents proéminentes, petits yeux doux ; flûte à la
  ceinture. L'apparence est la cicatrice de la Sonate : la dessiner avec la
  tendresse que le manga lui porte, jamais en monstre.
- **`biscuit-krueger`** — Silhouette de fillette en robe à volants,
  **couettes blondes torsadées en anglaises** (`drills`), grands yeux ;
  gabarit `child` pour la forme montrée — la vraie forme est un fait
  d'ability, pas d'appearance. Attested.
- **`hanzo`** — Crâne rasé, sourcils fins, sourire commercial, carrure sèche
  de shinobi ; tenue sombre. Attested.
- **`basho`** — Grand gabarit, rouflaquettes et bouc, banane courte, veste ;
  l'air du garde du corps qui écrit des senryū.
- **`izunavi`** — Cheveux mi-longs ondulés, barbe de trois jours, nonchalance
  de maître en congé _(à confirmer)_.
- **`theta`** — Jeune femme athlétique en tailleur de service, carré clair
  ondulé, visage rond et décidé — la peur de Tserriednich se joue dans ses
  yeux.
- **`salkov`** — Mince, cheveux plaqués à raie nette ; l'employé de maison
  parfait _(à confirmer)_.
- **`babimyna`** — Trapu, cheveux courts, paupières lourdes, le regard qui
  pèse ; uniforme de l'armée royale.
- **`balsamilco-might`** — Sec, âgé, crâne dégarni, moustache : l'état-major
  de Benjamin tient dans ce visage.
- **`vincent`** — Carrure sèche, cheveux courts, mâchoire serrée :
  l'exécuteur. (Mort tôt dans l'arc — l'appearance sert la timeline d'avant.)
- **`furykov`** — Âgé, petites lunettes rondes, cheveux gris peignés ; l'œil
  qui identifie les emprunteurs _(à confirmer)_.
- **`musse`** — Jeune, mèche basse sur l'œil _(à confirmer)_.
- **`rihan`** — Cheveux mi-longs sombres, calme de préparateur (Predator).
- **`coventoba`** — Rond, petits yeux, suffisance d'agent double.
- **`vergei`** — Chauve à couronne de cheveux (`bald-crown`), grosse
  moustache, la colère bureaucratique du poste de Marayam.
- **`sayird`** — Jeune homme brun net, cheveux courts ; le manieur de Little
  Eye retiré tôt du jeu.

### A.5 La Brigade fantôme (11)

- **`chrollo-lucilfer`** — Cheveux noirs plaqués en arrière (ou lâchés sur le
  front, selon qu'il travaille), **croix inversée sur le front**, boucles
  d'oreilles, manteau sombre à col de fourrure, yeux sans fond. Signatures :
  `forehead-cross` (mesh plat), `fur-collar`, `earrings`. Attested.
- **`nobunaga-hazama`** — Le samouraï : **chonmage** (queue nouée haute), bouc
  fin, kimono, katana au côté — seul à porter son arme en évidence.
- **`feitan-portor`** — Petit, cheveux noirs mi-longs, col remonté jusqu'au
  nez, parapluie ; la silhouette la plus compacte et la plus dangereuse du
  groupe.
- **`phinks-magcub`** — Grand, blond, **sourcils quasi absents**,
  survêtement ; l'ancien pharaon d'York Shin en tenue de sport. Attested.
- **`machi-komacine`** — Kunoichi au visage fermé, **cheveux roses** relevés
  en arrière (attested), tenue courte.
- **`shizuku-murasaki`** — Carré noir, **lunettes rondes**, robe sombre sage,
  Deme-chan au bras : la panoplie tient en trois pièces. Attested.
- **`franklin-bordeau`** — Colosse cousu : carrure hors gabarit, visage de
  créature de Frankenstein, **coutures aux commissures**, doigts amovibles.
  Signatures : `stitches`.
- **`bonolenov-ndongo`** — Le boxeur bandé : corps entièrement sous
  **bandages**, silhouette de danseur poids plume, gants. Signatures :
  `bandages-full`.
- **`kalluto-zoldyck`** — Enfant androgyne en **kimono**, carré noir
  impeccable, éventail ; gabarit `child`. Signatures : `fan`.
- **`illumi`** — Cheveux noirs **très longs et parfaitement lisses**, visage
  de poupée sans expression, grands yeux fixes. Les épingles de Gittarackur
  sont un état, pas un visage.
- **`hisoka`** — Grand, athlétique, cheveux relevés **roux-magenta**
  (attested), **étoile et larme** peintes sur les joues, tenue de bouffon. À
  bord il avance masqué (Texture Surprise) : l'appearance déclare le vrai
  visage ; le masque est un fait d'événement. Signatures :
  `face-paint-star-tear`.

### A.6 Mafieux importants (8)

- **`morena-prudo`** — Jeune femme aux longs cheveux clairs, yeux cernés qui
  ne cillent pas, robe sombre. Le profil `morena` de `humanProfiles.ts` la
  tient déjà (0xd9b978, `gown`) : son entrée reprend ces valeurs et le profil
  en dur devient projection (§4-P1).
- **`hinrigh-biganduffno`** — Quadragénaire anguleux, cheveux sombres plaqués
  en arrière, costume : le lieutenant Xi-Yu qui fait le vrai travail _(à
  confirmer)_.
- **`zakuro-custard`** — Jeune, cheveux en bataille, canines apparentes,
  veste courte.
- **`lynch-fullbokko`** — Jeune femme, cheveux courts, tenue utilitaire ;
  frappe d'abord, pose les questions après _(à confirmer)_.
- **`onior-longbao`** — Vieux boss massif, crâne chauve, **moustache
  tombante**, robe chinoise : le padrone Xi-Yu.
- **`brocco-li`** — Vieux, long visage étroit, crâne dégarni : le boss Cha-R
  _(à confirmer)_.
- **`keni-wang`** — **différée** : pas de planche exploitable recensée.
- **`luini`** — Jeune homme quelconque au sourire tranquille — l'anonymat est
  son arme (Rêveur Éveillé) _(à confirmer)_.

---

## Annexe B — pièces signatures (vocabulaire fermé)

Chaque pièce est une géométrie procédurale de `humanSignature.ts` — primitives
et extrusions, zéro asset, zéro texture — attachée au rig existant (tête,
torse, main). Le vocabulaire est fermé : une pièce nouvelle passe par un
amendement de cette annexe.

| Pièce                  | Construction                                          | Porteurs (annexe A)                |
| ---------------------- | ----------------------------------------------------- | ---------------------------------- |
| `glasses-round`        | 2 tores fins + pont                                   | Leorio, Shizuku, Furykov           |
| `glasses-thin`         | 2 cadres plats + branches                             | Halkenburg, Cheadle                |
| `tiara`                | arc de tore + pointes                                 | Camilla                            |
| `crown`                | cylindre crénelé bas                                  | Nasubi                             |
| `beard-full`           | coque extrudée sous la mâchoire                       | Nasubi, Beyond                     |
| `moustache`            | 2 quarts de tore                                      | Balsamilco, Onior, Vergei, Botobai |
| `mutton-chops`         | 2 coques latérales de mâchoire                        | Benjamin, Basho                    |
| `goatee`               | cône court au menton                                  | Basho, Leorio, Nobunaga            |
| `forehead-cross`       | mesh plat (comme les yeux)                            | Chrollo                            |
| `face-paint-star-tear` | 2 meshes plats (joues)                                | Hisoka                             |
| `earrings`             | petites sphères pendantes                             | Chrollo                            |
| `chain-right-hand`     | chaînette basse résolution à la main droite (au cast) | Kurapika                           |
| `fur-collar`           | tore bosselé au col                                   | Chrollo                            |
| `katana`               | fourreau + garde à la ceinture                        | Nobunaga                           |
| `umbrella`             | canne + coupole fermée                                | Feitan                             |
| `fan`                  | éventail plié en main                                 | Kalluto                            |
| `flute`                | cylindre court à la ceinture                          | Melody                             |
| `bandages-full`        | anneaux de bandelettes sur les membres                | Bonolenov                          |
| `stitches`             | segments d'encre aux commissures                      | Franklin                           |
| `lips-full`            | renflement du mesh de bouche                          | Salé-salé                          |
| `frills`               | collerettes en anneaux ondulés                        | Tyson                              |

Les coiffures nouvelles (`slicked-back`, `pompadour`, `drills`, `chonmage`,
`hime`, `curly`, `afro`, `wild`, `bald-crown`) relèvent de `humanHair.ts`
(§4-P2), pas de cette table : une coiffure n'est pas une pièce, c'est le
premier trait du personnage.

---

## Annexe C — amendements

Le vocabulaire est fermé, donc l'étendre se fait ici et nulle part ailleurs.

- **`bun` (coiffure), 2026-08-04, phase 0.** Trois des reines — Unma, Tang Zhao
  Li, et le chignon strict que l'annexe A leur donne — portent un chignon, et
  aucun des dix-sept styles ne le rendait. Le classer sous `ponytail` aurait été
  l'archive mentant dans le seul champ où elle dit ne pas mentir, ce qui est
  précisément ce que la fermeture du vocabulaire doit produire : un amendement
  visible plutôt qu'une valeur approchée invisible. Dix-huit styles.
- **`changshan` et `kimono` (attire), 2026-08-04, phase 0.** Zhang Lei et Onior
  Longbao portent une tunique chinoise, Nobunaga et Kalluto un kimono, et aucun
  des six costumes de `wardrobe.ts` n'en est un. Sans eux, la priorité §2.5
  n'aurait rien à dire dans les deux cas où elle a le plus à dire.

---

## §7 — ce qui a été fait, et ce qui ne l'a pas été

**Fait.** P0 à P4, plus la fiche de provenance de §6. Soixante-sept
ressemblances déclarées, quatre différées, `pyon`/`piyon` statué (deux personnes,
pas un doublon). Schéma zod et deux invariants dans `packages/contracts` ;
`humanHair.ts` et `humanSignature.ts` créés, tous deux sous 500 lignes ; aucun
fichier existant au-dessus de 500 ; aucun ajout aux exemptions d'ADR-002.

**Écarts assumés, à statuer.**

1. **La grille de portraits est une grille de _rigs_, pas de pixels.** Une
   planche-contact des soixante-sept corps construits — meshes, échelle, pièces
   nommées — en snapshot vitest. Elle attrape ce qu'une grille d'images
   attraperait (une signature qui tombe, une géométrie partagée réutilisée) et
   échoue avec un nom dessus plutôt qu'avec un diff de deux PNG ; elle ne dira
   jamais qu'un visage est raté. `scripts/tour-shots.mjs` reste le seul moyen de
   regarder la visite pour de vrai.
2. **P4 bouge le rendu de tout le monde.** Le second ton et le contour épaissi
   sont des phases de rendu global. La garantie de §5 porte sur la projection de
   l'apparence — un corps sans entrée ne change pas de visage — et pas sur
   celles-là.
3. **Une robe non déclarée garde les cicatrices de Morena.** `gown` voulait dire
   Morena ; `addCourtGown` sépare le vêtement de la personne, mais seulement pour
   un corps déclaré, exactement pour tenir §5 au mot. Le résultat est qu'un rôle
   du vestiaire qui met une inconnue en robe la met toujours dans celle de
   Morena. C'est laid et c'est délibéré ; le lever demande d'accepter un diff de
   capture sur des corps anonymes.
4. **Les alias de `pyon` et `piyon` restent en l'état.** `characters.json` donne
   Rabbit à `pyon` et Boar à `piyon`, l'inverse de l'attribution habituelle des
   douze signes. Cet ADR n'a pas autorité pour corriger un fait de
   `characters.json` ; la réserve est écrite dans leurs motifs de différé.
