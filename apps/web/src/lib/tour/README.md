---
titre: tour
etage: 2
couvre:
  - apps/web/src/lib/tour/**
  - apps/web/src/lib/components/tour/**
depend-de: [05-la-visite]
revu-le: 2026-11-16
empreinte: 7df285c
decisions: [adr-003, adr-005, adr-006]
---

# `apps/web/src/lib/tour` — la visite first-person

**Promet :** transformer `data/ship/blueprint.json` en une scène 3D traversable, avec ses lumières, ses sons et les effets des Hatsu.
**Refuse :** de décider du canon ou des règles de jeu. Le canon vient de `data/`, les règles des modules Hatsu.
**Entrées publiques :** `apps/web/src/lib/tour/blueprint.ts`, `apps/web/src/lib/tour/TourRenderer.ts`, `apps/web/src/lib/tour/cast/index.ts`, `apps/web/src/lib/tour/reportSound.ts`.
**Carte :** [05 la visite](../../../../../docs/carte/05-la-visite.md)

Le plan courant compte 429 espaces sur 46 niveaux, dont 35 niveaux intérieurs.

## Découpage

| Groupe      | Fichiers                                                                                                                                                                                                                                                                                 | Responsabilité                                               |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Géométrie   | `apps/web/src/lib/tour/blueprint.ts`, `apps/web/src/lib/tour/geometry.ts`, `apps/web/src/lib/tour/mesh.ts`, `apps/web/src/lib/tour/types.ts`                                                                                                                                             | Lecture, validation et mesh du plan du navire                |
| Rendu       | `apps/web/src/lib/tour/TourRenderer.ts`, `apps/web/src/lib/tour/PortalRenderer.ts`, `apps/web/src/lib/tour/TierView.ts`, `apps/web/src/lib/tour/reporting.ts`                                                                                                                            | Boucle Three.js, caméra, portails, étages, seuils de rapport |
| Ambiance    | `apps/web/src/lib/tour/light.ts`, `apps/web/src/lib/tour/atmosphere.ts`, `apps/web/src/lib/tour/dust.ts`, `apps/web/src/lib/tour/sky.ts`, `apps/web/src/lib/tour/hour.ts`                                                                                                                | Lumières, brume, ciel, heure du chapitre                     |
| Dehors      | `apps/web/src/lib/tour/sea.ts`, `apps/web/src/lib/tour/byElevation.ts`                                                                                                                                                                                                                   | Ligne de flottaison, dosage moteur/mer par pont              |
| Audio       | `apps/web/src/lib/tour/reportSound.ts`, `apps/web/src/lib/tour/pageHatsuAudio.svelte.ts`                                                                                                                                                                                                 | Sons one-shot Hatsu et boucles d'ambiance                    |
| Casts       | `apps/web/src/lib/tour/cast/*.ts`                                                                                                                                                                                                                                                        | Présences, postes, routines et perception Nen                |
| Simulation  | `apps/web/src/lib/tour/simulation/*.ts`                                                                                                                                                                                                                                                  | Monde persistant, routines PNJ, réputation et boucle Tier 5  |
| Hatsu       | `apps/web/src/lib/tour/hatsu.ts`, `apps/web/src/lib/tour/hatsuArrival.ts`, `apps/web/src/lib/tour/hatsuBook.ts`, `apps/web/src/lib/tour/hatsuPlan.ts`, `apps/web/src/lib/tour/hatsuRecord.ts`, `apps/web/src/lib/tour/hatsuTraversal.ts`, `apps/web/src/lib/tour/hatsuTechniqueGuide.ts` | Effets, seuils, projection, mémoire, déplacements et aide    |
| État page   | `apps/web/src/lib/tour/page*.svelte.ts`                                                                                                                                                                                                                                                  | État et contrôleurs de la route /tour                        |
| Apparitions | `apps/web/src/lib/tour/apparitions.ts`, `apps/web/src/lib/tour/apparition*View.ts`                                                                                                                                                                                                       | Entités 3D instanciées dans la scène                         |
| Composants  | `apps/web/src/lib/components/tour/*`                                                                                                                                                                                                                                                     | Surface Svelte de la visite                                  |

## Invariants

- Toute salle est atteignable — `apps/web/src/lib/tour/blueprint.test.ts › aucune salle orpheline`.
- Aucune lumière ambiante : un couloir sans luminaire reste noir — `apps/web/src/lib/tour/light.test.ts`.
- Les sons interactifs sont synthétisés. L'enregistrement original du concert de Melody est l'unique asset audio — `apps/web/src/lib/audio/ambient/melodyConcert.ts`.
- La visite ne lit pas directement `data/ship/blueprint.json` — elle passe par `apps/web/src/lib/tour/blueprint.ts`.
- La route rend une coque SSR légère puis charge `TourPageExperience.svelte` par `import()` ; le blueprint et la scène restent hors de son chunk initial — `scripts/tour-lazy-boundary.test.ts`.
- Le SSAO du palier `high` lit la profondeur du tampon qu'`EffectComposer` vient réellement de rendre, jamais celle de sa cible initiale — `apps/web/src/lib/tour/ambientOcclusion.test.ts`, `tests/tour.spec.ts`.
- La ligne de flottaison n'est pas un chiffre choisi : c'est l'élévation du pont 4, le premier que le canon ne place pas sous l'eau — `apps/web/src/lib/tour/sea.test.ts`.
- Le palier `low` limite la visibilité à une porte et la CI joue la visite sur desktop et mobile — `apps/web/src/lib/tour/quality.ts`, `tests/tour.spec.ts`.

## Ajouter quelque chose ici

- Pour une nouvelle salle : `docs/geste/une-salle.md`.
- Pour un nouveau son de Hatsu : `docs/geste/un-hatsu.md` + `apps/web/src/lib/audio/hatsu/`.
- Pour un nouvel effet visuel : cette fiche + `docs/carte/05-la-visite.md`.
- Pour faire marcher un personnage : une entrée dans `BEATS` de `apps/web/src/lib/tour/cast/pace.ts`. Le trajet part du poste, s'arrête avant tout mur ou meuble, et le personnage reste immobile si la pièce n'offre pas 1,6 m dégagés.

## Navigation de la visite

`TourWorkspace.svelte` garde la scène montée sur toute la largeur. La barre propose le
pont, les plans, la recherche et le plein écran ; le panneau Options regroupe Confort,
Lieux / Nen, Commandes et Sources. Les outils photo et Gyo restent dans la vue.

Le sélecteur de `TourPlanDialog.svelte` consulte les ponts et les intérieurs sans déplacer
le visiteur. Seule la sélection d’une pièce déclenche le déplacement. « Ma position »
revient au niveau parcouru ; le marqueur de position ne figure que sur ce niveau.
`TourPlanViewport.svelte` porte le zoom et le déplacement du plan, sans sélectionner une
pièce à la fin d’un glissement. Sur mobile, l’index des pièces se déplie sous le plan.

## Modèles humains communs

`humanFigure.ts` construit les personnages de la visite, les aperçus de sélection et
les combattants de Fighting 2D (`apps/web/src/lib/fighting/fighterFigure.ts`). Les détails des visages,
coiffures, mains et vêtements restent dans cette base ; les accessoires et transformations
de combat se greffent ensuite. Les détails suivent les articulations existantes. Les
doigts et les traits de vêtements d’un même matériau sont fusionnés et leurs géométries mises en cache ;
le modèle lointain conserve ses trois masses.

`humanModelDetails.test.ts` vérifie le partage des géométries avec Fighting, les attaches
pendant les poses et les pupilles sous Emperor Time / Parallel Future. La planche de
contrôle WebGL se génère avec `node apps/web/scripts/check-human-models.mjs` : quatre
personnages, visite et combat, en pied, portrait, profil et posture de combat.
`HUMAN_MODELS_BASELINE=1` compare avec les constructeurs du dernier commit ;
`HUMAN_MODELS_OUTPUT` choisit le dossier des captures.

Kurapika utilise une tête, un carré en mèches et un costume ajusté dédiés dans
`kurapikaHead.ts`, `kurapikaHair.ts` et `kurapikaSuit.ts`. Ces modules se branchent
sur le constructeur partagé ; les noms des yeux et des articulations restent
compatibles avec les poses et Emperor Time. La palette du costume suit la référence
manga fournie par le mainteneur, avec sa provenance notée dans le catalogue.
`HUMAN_MODELS_FOCUS=kurapika node apps/web/scripts/check-human-models.mjs` produit
une planche de face, en garde et en portrait, ainsi que les contrôles de profil.

Les 73 apparences déclarées emploient aussi les visages, mèches et coupes de vêtements
`manga*.ts`. Les détails suivent la même ossature dans la visite et pour les combattants.
Les références fournies par le mainteneur et les palettes choisies sont documentées dans
`data/characters/appearance.json` ; l’attribution de la tenue à capuche à Tserriednich suit
sa confirmation explicite. `bonolenovBattleArmor.ts` fournit la forme Prologue partagée.

`mangaTubeppaHead.ts` et `mangaTubeppaSuit.ts` suivent la référence de réception fournie :
coupe blonde en bol, nez long, menton carré, lunettes ouvertes et boucles d’oreilles ;
costume croisé sombre à liserés clairs. L’apparence est commune à la visite et au kaméo
de Clash. La planche `manga-cast` construit aussi les vrais modèles de combat des kaméos.

`mangaCast.test.ts` contrôle les articulations, les transformations et les géométries
communes. `node apps/web/scripts/check-manga-cast.mjs` rend tout le catalogue en WebGL :
`MANGA_CAST_IDS` sélectionne les identités séparées par des virgules, `MANGA_CAST_VIEWS`
choisit `body,face,profile,combat`, et `MANGA_CAST_OUTPUT` fixe le dossier des captures.
Le suffixe `@prologue` permet de comparer l’armure de Bonolenov dans les deux modes.

Les références de Rihan, Hinrigh, Zakuro et Terebellum sont portées par
`mangaUnderworldHair.ts`, `mangaUnderworldClothes.ts` et leurs détails articulés.
`mangaBiscuitProfile.ts` résout uniquement la vraie forme explicite de Biscuit ;
la petite forme conserve sa robe et ses couettes. La silhouette effilée de Hanzo
appartient à la transition de Skill 4, pendant `startupFrames` ; le double stabilisé
retrouve son corps complet translucide. Le changement de phase déclenche une
reconstruction du modèle. Les suffixes de la planche `@transition`, `@skill-four`
et `@true-form` contrôlent ces variantes sans changer le catalogue par défaut.

`mangaMelody.ts` suit la référence de Melody au costume sombre et aux cheveux longs.
Sa pose de flûte est commune à la visite et à Fighting : `melodyFigurePose.ts`
replace l’instrument à la bouche, conserve les mains sur les clés et restaure la
position portée à l’arrêt du morceau. `@concert` permet de contrôler cette pose.

`mangaPadaille.ts` reprend son carré court séparé au milieu, son visage anguleux et
son haut clair à col rond. Les outils de Fighting conservent l’attache au bras droit ; `padaille@axe` les montre
dans la planche de contrôle. Le lien visible autour de l’arme sur la référence appartient
à l’attaque adverse, selon la correction explicite du mainteneur.

Les références de Luini et Yokotani sont déclinées dans `mangaHeillyHair.ts`,
`mangaHeillyFaces.ts` et `mangaHeillyClothes.ts` : coupe plaquée et veste à motifs
pour Luini ; carré rejeté en arrière, sourire aux yeux plissés et livre porté à
la main gauche pour Yokotani. Le livre suit la main sur la même ossature dans les deux modes.

`mangaMizaistomHead.ts` et `mangaMizaistomClothes.ts` portent le chapeau à cornes,
la marque autour de l’œil et les taches pie de Mizaistom. `crossGameCageModel.ts`
fournit le volume quadrillé clair de Cross Game, partagé avec son effet dans Fighting.
La variante `@cross-game` contrôle cette grille sur une cible dans la planche WebGL.

`mangaGel.ts` porte l’apparence de Gel : front dégagé, yeux turquoise à pupilles
fendues, lèvres rosées et encolure noire festonnée. `gelSnakeHead.ts` fournit la même
tête violette au bras enroulé de la visite et au bras de frappe de Fighting. La tête
conserve ses proportions pendant l’allongement ; la main humaine est masquée pendant
la transformation puis restaurée. La variante `gel@snake` montre les deux formes.

`mangaCluckHead.ts`, `mangaCluckClothes.ts` et `mangaCluckLimbs.ts` reprennent les
références de Cluck : coiffure relevée, couronne en éventail, rubans turquoise,
ras-de-cou, bordures de plumes, short et bottes lacées. `cluckFeathers.ts` fusionne
les plumes par matériau et partage leurs géométries ; couronne, manchettes et
épaules suivent leurs articulations, la traîne reste attachée au bassin dans Fighting.

`mangaSaiyuHead.ts` et `mangaSaiyuFace.ts` portent les cheveux ras blonds au motif
en cœur, le bandeau doré, les grandes oreilles et les traits simiesques de Saiyu.
`mangaSaiyuClothes.ts` et `mangaSaiyuLimbs.ts` reprennent son haut court, les
volutes dorées, bracelets et pantalons aux mollets. La queue reste sur le bassin
quand le torse pivote dans Fighting ; les géométries sont communes aux deux modes.

`mangaBodyguardHair.ts`, `mangaBodyguardFaces.ts` et `mangaBodyguardSuits.ts` suivent
les références de Bill et Basho : mèches en flammes et cernes pour Bill ; banane
arrondie, sourcils épais, favoris reliés à la moustache et menton clairsemé pour Basho.
Les deux portent le costume sombre avec chemise, cravate et insigne H ; ces détails
restent communs à la visite et à Fighting. La teinte claire des cheveux de Bill
est un choix de palette documenté pour la référence manga en noir et blanc.

`mangaFeitanHead.ts` et `mangaFeitanClothes.ts` portent le foulard violet à crâne et
ailes magenta, la coupe courte et ébouriffée et le manteau sombre de Feitan. `painPackerModel.ts`,
`painPackerHood.ts` et `painPackerCoat.ts` construisent la même armure bordeaux et
ivoire pour la visite et Fighting. Les géométries sont partagées et les motifs
suivent les surfaces courbes. `painPackerRig.ts` garde les manches sur les bras,
la capuche sur la tête et le manteau au bassin ; il restaure la tenue ordinaire
à la disparition de l’armure. La variante `@pain-packer` montre cet équipement
dans la planche de contrôle WebGL.
