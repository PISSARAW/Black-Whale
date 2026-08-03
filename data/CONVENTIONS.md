# Conventions de nommage

## Slugs des personnages

### Personnages nommés

Utiliser le nom complet en kebab-case. S'il n'y a qu'un prénom, utiliser le prénom.
Exemples :

- `kurapika`
- `chrollo-lucilfer`
- `prince-benjamin`

Les princes et les reines portent leur rang en préfixe plutôt que leur nom de
famille : `prince-benjamin`, `queen-oito`. Un `ownerId` d'ability ou un
`factionId` doit citer ce slug-là, jamais `benjamin-hui-guo-rou`.

### Personnages anonymes

Pour éviter les doublons et permettre une identification claire, les personnages anonymes doivent suivre le format :
`[affiliation]-[rôle]-[numero]`

Exemples :

- `mafia-heilly-soldier-01`
- `royal-guard-woble-01`
- `passenger-civilian-01`
- `hunter-temp-01`

Si une affiliation précise n'est pas connue mais qu'un camp est évident :

- `prince-camp-benjamin-soldier-01`

### Identifiants de base de données (ID)

Toujours utiliser des UUID (générés automatiquement par la DB).

## Dates de récit

### L'horloge du voyage

Un événement porte `occurredAt`, et rien d'autre ne le date. Le champ dit ce
que le canon donne, pas ce qu'on aimerait afficher :

```json
"occurredAt": { "basis": "stated", "hours": 21 }
"occurredAt": { "basis": "derived", "day": 4 }
```

`hours` compte les heures depuis la corne de départ — heure zéro, dimanche
midi du jour 1. `basis` vaut `stated` quand le manga imprime l'heure, une
légende d'heures écoulées ou une horloge dans le décor ; `derived` quand elle
se déduit d'une heure imprimée par une relation énoncée (« neuf heures
d'inconscience », « la veille »). Un `day` sans `hours` est un jour connu dont
l'heure ne l'est pas : il vaut pour la journée entière, de minuit à minuit.

Ce qui n'a pas de `occurredAt` n'est pas pour autant sans date : la cascade de
`@black-whale/domain` l'encadre entre l'ancre qui le précède et celle qui le
suit, et le résultat porte `basis: "bracketed"`. C'est la troisième valeur, et
elle ne s'écrit jamais à la main — l'inventer reviendrait à faire passer un
intervalle pour une heure.

`source` dit qui l'affirme, `manga` par défaut. Une bonne part de la seconde
moitié de l'arc est datée par Hunterpedia, et fait foi : ces entrées portent
`"source": "community"` et gardent le `basis` qu'elles rapportent — une heure
transcrite reste `stated`. Le champ ne dévalue pas la date, il la rend
traçable : ce sont les entrées à confronter à la planche en lisant, et à
corriger si la fiche se trompe.

`occurredAtLabel` est **rendu**, pas rédigé : la passe `compile:timeline` de
`@black-whale/canon-compiler` l'écrit
depuis `occurredAt`, et un test échoue si le libellé du fichier ne correspond
plus à ce que le formateur produit. La seule exception est ce que l'horloge du
navire ne peut pas tenir — le flash-back du chapitre 415, daté « deux mois
avant le départ ».

Enfin, l'ordre compte : la cascade lit les événements dans l'ordre
chronologique, celui que donnent le chapitre, la séquence et `occursAfterTitle`.
Une heure déclarée qui tombe hors de l'intervalle que ses voisins autorisent
fait échouer les tests — c'est ainsi qu'on a vu que le chapitre 415 s'ouvre
vingt-cinq minutes avant la scène du chapitre 413 qui le précède à la lecture.

### Forme des libellés

`storyDate` (chapitres) et `occurredAtLabel` (événements) se lisent
`Day N · Jour · heure`, du plus large au plus fin, chaque cran séparé par `·` :

- `Day 1 · Sunday · 12:00`
- `Day 2 · Monday · 09:00`
- `Day 3 · Tuesday · 01:27`

Le jour 1 est le jour de l'appareillage, midi. Le nom du jour de la semaine
n'est pas une convention d'affichage : il est déduit d'un seul panneau, le
réveil de Fugetsu au chapitre 374 qui affiche `TUESDAY 01:27 AM` alors que la
légende du même chapitre compte 37 h 30 depuis le départ. Les deux concordent à
trois minutes près et font du départ un dimanche — ce que supposait déjà la
salle des banquets avec ses banquets dominicaux, et que confirme le second
banquet du jour 8, dimanche lui aussi.

Le jour de la semaine ne s'écrit donc que sur un jour ferme. Une date approchée
(`≈ Day 12`), un intervalle (`≈ Day 2-3`) ou une borne (`Martial law, after Day
12`) reste sans jour : le compte des jours y est déjà une estimation, et lui
coller un mardi lui donnerait une précision que le canon ne donne pas.

## Lieux

Les slugs des lieux suivent la hiérarchie pour plus de clarté, mais sans le nom du vaisseau :
`tier-[1-5]-[secteur]-[nom-ou-numero]`

Exemples :

- `tier-1-royal-residential-sector-room-1014`
- `tier-1-banquet-hall`
- `tier-3-medical-district`

## Positions

### Jamais un simple tier

Un tier est un pont, pas un endroit. Une position posée sur `tier-3` atterrit sur
l'ancre du pont, c'est-à-dire le plancher libre entre les pièces : la carte
montre alors un passager qui traîne dans un couloir où le canon ne l'a jamais mis.

`shipLocation.room` et chaque étape de `mapTrajectory` doivent donc nommer une
pièce. Quand le canon donne le tier sans la pièce, on retient celle que le rôle
implique — un soldat Cha-R au bureau Cha-R, l'espionne d'une reine dans le bloc
des reines, la Brigade dans les cabines standard du Tier 5 — et on marque
l'entrée :

```json
"shipLocation": { "tier": 5, "room": "Cha-R Family Office", "status": "actif" },
"positionProvenance": "inferred"
```

`inferred` fait passer la présence en `PROBABLE` : la carte l'affiche comme une
position supposée, pas comme un fait observé. Sur une étape de trajectoire, c'est
`"certainty": "PROBABLE"` qui joue ce rôle.

Un couloir n'est une position valable que si le canon l'énonce : Shizuku est au
`tier-4-central-passage` parce que le chapitre 380 l'y met, et elle y reste en
`CONFIRMED`. Une position réellement inconnue reste `black-whale-unknown` — c'est
un aveu, pas une déduction ratée.

Un tier nu est refusé des deux côtés : `pnpm canon-lint` échoue sur la fiche
avant que le déploiement n'écrive quoi que ce soit, et `verify:map` échoue sur
la présence projetée si elle arrive tout de même.

### Positions dans la pièce

Certains passagers ont une place précise dans leur pièce : Beyond Netero n'est
pas « dans sa cellule », il est menotté au mur près du lit. Ces places vivent
dans `localSpotAnchors`, au-dessus de `packMarkersForZoom`
(`apps/web/src/lib/components/map/markerProjection.ts`), en pourcentages de la
carte locale et lues sur les meubles que le SVG dessine. `occupants` place ceux
que le canon situe nommément ; `fallback` récupère les autres — la garde des
Zodiaques va de son côté des barreaux, pas sur le lit de Beyond.
