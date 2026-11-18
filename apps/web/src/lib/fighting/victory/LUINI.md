# Luini — La mauvaise porte

Dix secondes avec une pièce d’ancrage à porte unique, un lieu déjà visité
et le véritable adversaire du combat. La pièce de service est montrée en coupe
pour voir Luini à l’intérieur ; les matériaux reprennent le décor courant.
La porte reste fermée pendant l’ancrage. Luini traverse à 1,8 seconde et
réapparaît derrière la cible à deux secondes. Il recule, la provoque, puis
revient dans sa pièce à 3,9 secondes. Le même corps s’efface seulement pendant
les deux traversées ; aucune copie ou silhouette fantôme n’est créée.

La cible se retourne, rejoint la porte et saisit sa vraie poignée. Son corps
suit l’arc du battant à partir de 5,7 secondes. L’ouverture condamne l’ancrage,
mais Luini est déjà à l’intérieur. Il surgit dans l’angle du chambranle et porte
un coup physique de couteau à 6,6 secondes. La chute native commence à 6,8
secondes ; Luini franchit ensuite normalement la porte ouverte et présente sa
lame marquée. Fatality apparaît à huit secondes, annoncé en anglais à 8,15
secondes. Les répliques françaises sont écrites ; aucune voix française.

Les passages transportent Luini seul. La cible reste dans la même arène et se
déplace à pied. Les portails n’infligent aucun dégât et ne découpent personne.
La pièce et son histoire de visite sont la préparation de cette mise en scène ;
le rendu après verdict n’ajoute pas de ressources à la vraie simulation. Il
reconstitue un scénario préparé et ne change ni les conditions du Hatsu,
ni les PV, l’aura, les données de préparation ou le résultat du match.

`luiniFatalityFilm.ts` utilise un vrai scénario natif avec pièce fermée à porte
unique et destination déjà visitée par son propriétaire. Le premier ancrage
ne déplace pas le corps. Le départ et le retour ne blessent pas et ne
transportent pas la cible. Celle-ci rejoint réellement la pièce et ouvre la
porte avec l’interaction de Clash : l’ancrage est alors perdu. Des coups
physiques ordinaires obtiennent le K.-O. sans nouvelle téléportation, injection
de PV ou remplissage de ressources. Le couteau et l’embuscade détaillée sont
une chorégraphie après verdict, pas une nouvelle attaque automatique du Hatsu.

Les poses et accessoires appartiennent au système de victoire et n’importent
pas les évolutions en cours du moteur de passages. Si le modèle natif porte
déjà un couteau, il est masqué puis restauré pendant le rendu pour ne pas
dupliquer l’arme. Le couteau du film possède ses propres ressources. La poignée
et la pointe suivent les mains réelles ; les contacts s’adaptent aux tailles
extrêmes. La chute utilise la gravité, les poses et le sol natifs de Clash.
Toutes les transformations et visibilités natives sont restaurées à chaque
image. La caméra réduite garde un plan large fixe et les éclats sont désactivables.

`luini.test.ts` vérifie le scénario sur les deux côtés, quatre gabarits, la pointe,
les mains, la perte de l’ancrage, la chute, le miroir et la restauration.
`luiniPlayback.test.ts` croise le roster, les décors, deux côtés, IA/local,
quatre motifs de victoire et les revanches. `check-luini-fatality.mjs` couvre
le mobile, les gabarits et le confort ; `check-luini-victories.mjs` contrôle
quatre victoires et revanches, le son et le retour aux résultats.

Démo : `demos/fighting-showcase/luini-fatality.html`, avec `target`, `stage`,
`side=opponent` et `reduced`. Depuis `apps/web`,
`node scripts/render-luini-fatality.mjs` exporte 1080p30 ; `--inspect` produit
les plans de contrôle. Depuis la racine,
`node apps/web/scripts/compose-luini-fatality.mjs` produit le son du jeu et
assemble `output/fighting-luini-fatality/Luini-Fatality-10s.mp4`.
