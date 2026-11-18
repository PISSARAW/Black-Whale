## Leorio × Franklin — chambre funéraire des princes

```sh
node apps/web/scripts/render-fighting-showcase.mjs --ranged-duel --inspect
node apps/web/scripts/render-fighting-showcase.mjs --ranged-duel
```

Sortie : `output/fighting-ranged-duel/Leorio-vs-Franklin-Chambre-Funeraire.mp4`.
Ce duel continu de 47,67 secondes en 1080p60 alterne rafales natives de Double
Machine Gun, poings transmis dans le sol, esquives et combos au corps à corps.
Franklin esquive le premier poing après le verrouillage de son point de sortie.
Le dernier poing touche pendant sa rafale prolongée et donne la victoire à Leorio.
Les récupérations utilisent Ten et Zetsu ; seuls les PV initiaux sont étendus à 400. Le rapport vérifie les 81 balles, les trois impacts à distance, les 16 combos,
la continuité et le contre final. Le contour du Ten au repos est masqué pour
éviter son décalage visible ; les modèles, le Ren et les Hatsu restent natifs.

## Version dynamique, visages et gros plans simultanés

Depuis la racine du dépôt :

```sh
FIGHT_SHOWCASE_OUTPUT="$PWD/output/fighting-ranged-dynamic" node apps/web/scripts/render-fighting-showcase.mjs --ranged-duel --ranged-dynamic --inspect
FIGHT_SHOWCASE_OUTPUT="$PWD/output/fighting-ranged-dynamic" node apps/web/scripts/render-fighting-showcase.mjs --ranged-duel --ranged-dynamic
```

Le duel dure 67,4 secondes, avec 600 PV initiaux par combattant, 39 combos
confirmés, cinq changements d’avantage et 76 balles natives. Leorio utilise
sa vraie route basse (coup au corps puis direct en avançant). Les deux
combattants récupèrent leur aura par les entrées natives, sans remise à zéro.
Le dernier poing interrompt réellement la rafale prolongée de Franklin.

`rangedDynamicChoreography.ts` compose les reprises d’initiative ;
`rangedDynamicDirector.ts` suit les changements d’avantage et adapte les
reculs à la place disponible pour éviter une attente contre le mur.
`rangedCloseupTrack.ts` sélectionne les détails au même instant que le duel.
`rangedCloseupRenderer.ts` cadre les vrais visages de face, les mains en
émission et le poing au point de sortie. Aucun replay ni pause n’est ajouté.
Les portraits totalisent plus de 32 secondes, dont 18 pour Leorio et 14 pour
Franklin. Le texte des impacts reste à gauche, en dehors de ces visages.

`showcase-ranged-inspection.mjs` vérifie les deux visages et les deux Hatsu,
avec une taille de visage supérieure à 180 pixels dans le cadre de détail
et un alignement frontal supérieur à 0,99. Les transformations et visibilités
sont restaurées après chaque rendu ; aucun fichier applicatif n’est modifié.
La dernière livraison est `output/fighting-ranged-dynamic/Leorio-vs-Franklin-Duel-Dynamique.mp4`.

Pour cet assemblage, rendre les pistes avec `--picture-only` et `--audio-only`,
puis lancer `node apps/web/scripts/compose-ranged-dynamic.mjs`. Le script vérifie
la chorégraphie et les portraits, normalise le son, assemble les pistes, décode
toutes les images et écrit `video-verification.json` avec empreinte SHA-256.

## Version cinéma plein écran et fatality de Franklin

```sh
node apps/web/scripts/render-ranged-cinema.mjs --inspect
node apps/web/scripts/render-ranged-cinema.mjs
node apps/web/scripts/render-ranged-cinema.mjs --audio-only
node apps/web/scripts/compose-ranged-cinema.mjs
```

Sortie : `output/fighting-ranged-cinema/Leorio-vs-Franklin-Cinema-Fatality.mp4`.
Le duel natif dure 46,03 secondes. Les plans de combat, les visages, les mains,
la frappe au sol et les poings émergents utilisent une seule vue plein écran.
Le simulateur avance sans coupe ni reprise ; seules les caméras changent.
Les 32 annulations vérifiées suivent une touche confirmée et une route autorisée
du moveset, dont direct → crochet et coup au corps → direct en avançant pour
Leorio, et direct → marteau → salve pour Franklin. Six reprises d’avantage
précèdent la victoire native de Franklin par sa rafale prolongée.

La fin emploie directement `src/lib/fighting/victory/franklin.ts` pendant dix
secondes, avec Leorio comme victime et le décor courant. Le cadrage de la chute
recule pour garder le corps entier dans le 16:9. La bande sonore est celle du
jeu, `static/clash-victories/franklin.m4a`, avec ses tirs et son annonce.
Le rendu est en 1080p60 (3 362 images), sans fenêtre secondaire. Le rapport
conserve toutes les commandes, les confirmations, les routes d’annulation,
les reprises d’avantage et les captures de la fatality native.
