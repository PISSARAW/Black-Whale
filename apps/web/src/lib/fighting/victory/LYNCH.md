# Lynch — Le dernier aveu

Dix secondes de Body and Soul contre la cible du match, dans son décor.
Lynch demande « Qui es-tu réellement ? ». L’adversaire couvre sa bouche,
mais un coup au corps à 2,2 secondes fait jaillir son nom depuis le torse.
« Encore. » précède un second coup à 4,1 secondes. Quatre frappes alternées
à 5,3, 5,5, 5,7 et 5,9 secondes accélèrent les réponses et replient le corps.
Lynch conclut « J’ai compris. » ; le son s’arrête avant le septième coup,
à 6,6 secondes. Celui-ci projette physiquement la cible et ne produit aucune
réponse. Une chute native précède le portrait final, puis Fatality apparaît à
huit secondes et est annoncé en anglais à 8,15 secondes. Aucune voix française.

La réponse est une vérité présente, pas une prédiction ou une commande.
Les bulles et les ondes d’impact sont une mise en scène depuis le point de vue
de l’interrogatrice : aucune âme figurée, arrachée ou blessée, aucun malus de
protection et aucune nouvelle règle de dégâts. Seul le nom déjà affiché du
personnage est illustré ; aucun souvenir privé du combat, état de Nen ou usage
de In n’est lu ni publié par la cinématique. Le nom s’adapte à l’adversaire.
La bouche couverte n’empêche pas le corps de répondre. L’absence de réponse
au coup final garde la condition de conscience du Hatsu.

`lynchFatalityFilm.ts` prouve une simulation native continue : vraie question
parlée, six contacts du poing sur une cible consciente et six réponses privées
contenant son identité. Des coups physiques ordinaires gagnent ensuite le duel,
sans manipulation des PV, du temps ou des ressources. Le K.-O. ne peut extraire
aucune réponse. La scène rejoue et exagère ces derniers instants après le verdict,
sans modifier le résultat, la santé ni l’aura du vrai match.

Les mains utilisent les segments et articulations réels. Les contacts suivent
le torse et les tailles extrêmes utilisent les genoux natifs. Le rig de Clash
porte les torsions des épaules et le repli du corps autour de la taille ; les
pieds restent au sol. La chute reprend l’intégrateur et les poses de K.-O. de
Clash. La caméra réduite conserve un plan large fixe. Les poses, matières,
visibilités et hiérarchies empruntées sont restaurées après chaque image ;
les bulles et impacts disposent de leurs propres ressources.

`lynch.test.ts` couvre la preuve sur les deux côtés, les contacts contre quatre
gabarits, le miroir, l’absence de réponse après le K.-O., les lectures en arrière
et la restauration. `lynchPlayback.test.ts` croise adversaires, décors, deux côtés,
IA/local, quatre motifs de victoire et revanches. Les scripts navigateur
`check-lynch-fatality.mjs` et `check-lynch-victories.mjs` contrôlent le mobile,
le confort, le son et les déclenchements avec retour aux résultats.

Démo : `demos/fighting-showcase/lynch-fatality.html` ; paramètres `target`,
`stage`, `side=opponent`, `reduced`. Depuis `apps/web`,
`node scripts/render-lynch-fatality.mjs` exporte 1080p30 ; `--inspect` capture
les plans de contrôle. Depuis la racine,
`node apps/web/scripts/compose-lynch-fatality.mjs` produit le son du jeu et
assemble `output/fighting-lynch-fatality/Lynch-Fatality-10s.mp4`.
