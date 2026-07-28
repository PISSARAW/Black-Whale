# Conventions de nommage

## Slugs des personnages

### Personnages nommés

Utiliser le nom complet en kebab-case. S'il n'y a qu'un prénom, utiliser le prénom.
Exemples :

- `kurapika`
- `chrollo-lucilfer`
- `benjamin-hui-guo-rou`

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

`verify_map_coverage.mjs` échoue sur tout tier nu, dans le catalogue comme dans
les présences projetées.

### Positions dans la pièce

Certains passagers ont une place précise dans leur pièce : Beyond Netero n'est
pas « dans sa cellule », il est menotté au mur près du lit. Ces places vivent
dans `localSpotAnchors`, au-dessus de `packMarkersForZoom`
(`apps/web/src/lib/components/map/markerProjection.ts`), en pourcentages de la
carte locale et lues sur les meubles que le SVG dessine. `occupants` place ceux
que le canon situe nommément ; `fallback` récupère les autres — la garde des
Zodiaques va de son côté des barreaux, pas sur le lit de Beyond.
