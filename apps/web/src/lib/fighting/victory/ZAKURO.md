# Zakuro — La dernière goutte

Dix secondes avec Bloody Mary, la cible et le décor du combat. Zakuro présente
sa paume et sa perfusion portée ; trois gouttes munies d’yeux rampent vers les
chevilles adverses, puis reviennent. Le même sang forme quatre liens qui
s’enroulent autour des poignets et des chevilles. Zakuro lève la main : la cible
bascule tête en bas, monte puis frappe le sol à 5,4 secondes. Un second levage
précède la chute native et l’impact à 6,6 secondes. Le sang est rappelé ; une
petite goutte ouvre son œil près du visage de Zakuro et le cligne. Fatality
apparaît à huit secondes, annoncé en anglais à 8,15 secondes, sans voix française.

Les liens, les deux levages et les fissures sont une chorégraphie après verdict.
Le sang manipulé appartient à Zakuro : aucun contrôle du sang adverse,
exsanguination, scellement du Nen ou soin ajouté. La perfusion représente son
équipement porté, pas un objet créé par Bloody Mary. Les gouttes éclaireuses
ne blessent pas. La quantité visuelle est finie ; les liens s’affinent avec la
distance et sont rappelés avant la goutte finale.

La preuve `zakuroFatalityFilm.ts` utilise une simulation continue : équipement
réel, propre plaie, trois éclaireurs, rappel de la réserve, capture par un
véritable lien en déplacement et projection native. Des coups physiques
préparent ensuite le dernier slam qui gagne le match, sans injection de PV,
soin ni remplissage des ressources. Les deux côtés sont testés.

Les poses utilisent les mains réelles et les chevilles du gabarit présent.
La seconde chute reprend l’intégrateur et les contacts au sol de Clash,
échantillonnés pour conserver l’impact à 6,6 secondes. La caméra réduite reste
fixe et large. Les accessoires possèdent leurs propres ressources ; toutes les
poses, visibilités et matières natives sont restaurées après chaque image.

`zakuro.test.ts` contrôle la preuve, les prises, la chute, les grands et petits
gabarits, le miroir, les lectures en arrière et la restauration du combat.
`zakuroPlayback.test.ts` parcourt adversaires, décors, deux côtés, IA/local,
quatre motifs de victoire et revanches. Les scripts navigateur
`check-zakuro-fatality.mjs` et `check-zakuro-victories.mjs` couvrent mobile,
confort, adaptation, son et quatre victoires avec retour aux résultats.

Démo : `demos/fighting-showcase/zakuro-fatality.html`, avec `target`, `stage`,
`side=opponent` et `reduced`. `render-zakuro-fatality.mjs` exporte 1080p30 ;
`--inspect` capture uniquement les plans de contrôle. Depuis la racine,
`node apps/web/scripts/compose-zakuro-fatality.mjs` produit la piste du jeu et
assemble `output/fighting-zakuro-fatality/Zakuro-Fatality-10s.mp4`.
