# Rihan — L’angle mort

La démo de dix secondes oppose Rihan à Shizuku dans la soute. Son étude
personnelle est achevée avant la scène de victoire ; une créature spécialisée
se déploie depuis sa paume à 78 et pose ses griffes à 144. Deme-chan reste
incapable d’aspirer une construction de Nen. À 282, les volets dentés attrapent
le tuyau ; la créature dévore Deme-chan jusqu’à 342. La propriétaire lâche son
aspirateur et conserve son propre accès au Nen. Rihan paie alors les 48 heures
de Nen scellé. Il s’est déplacé derrière la créature et tire une seule balle
physique à 384 ; la chute native commence à 396. Fatality est annoncé en anglais
après huit secondes, sans voix française.

Le prédateur à volets et ses griffes sont une création pour le film, adaptée
à Blinky. Ce modèle n’est pas présenté comme une nouvelle anatomie canonique,
ni comme la forme montrée contre Salé-salé. Le match contre Hisoka utilise une
variante de gueule pour Bungee Gum. Le corps humain n’est jamais sa nourriture,
la prédation ne cause aucun dégât et ne place jamais l’adversaire en Zetsu.
Le tir du pistolet de service reste possible après le propre scellement de Rihan.

Seules les variantes Blinky et Bungee Gum disposent ici d’une proie identifiée.
Pour les autres adversaires, l’analyse reste incomplète : la scène conserve
sa fin physique de dix secondes, avec la piste `rihan-physical.m4a`, sans
faire apparaître une proie ou un Predator offensif inventés. Cette variante
se déclenche aussi après chaque victoire éligible. Le gagnant, la cible et
le décor sont toujours ceux du match ; aucun PV, aura ou état de Hatsu n’est
modifié par la présentation après verdict.

La preuve native de `rihanFatalityFilm.ts` lance les vraies apparitions de
Deme-chan, cumule l’observation et laisse Shizuku récupérer en Zetsu entre
ses invocations. Il n’y a ni remplissage de ressource ni connaissance injectée.
Un vrai lâcher de Predator détruit la manifestation et applique le propre
sceau de Rihan, sans blessure ni sceau adverse. Des tirs physiques gagnent
ensuite le duel. La preuve contre Hisoka observe le vrai Bungee Gum. Les
matchs sans proie sont gagnés physiquement, avec une émission réelle du
pistolet puis des coups ordinaires si sa hauteur de tir ne touche pas la cible.

`rihan.test.ts` vérifie les preuves, les prises, la direction du canon,
les gabarits, la chute et la restauration. `rihanPlayback.test.ts` parcourt
le roster et les lieux, les deux côtés, IA/local et les motifs de victoire.
La caméra réduite conserve un plan large fixe et les flashes sont désactivables.
Les accessoires et créatures possèdent leurs propres ressources ; les poses,
matériaux et objets natifs sont restaurés après chaque rendu.

Démo : `demos/fighting-showcase/rihan-fatality.html`, avec `target`, `stage`,
`side=opponent` et `reduced`. `render-rihan-fatality.mjs` exporte 1080p30,
`--inspect` uniquement les plans de contrôle. `compose-rihan-fatality.mjs`
produit les deux pistes du jeu et `output/fighting-rihan-fatality/Rihan-Fatality-10s.mp4`.
`check-rihan-fatality.mjs` et `check-rihan-victories.mjs` contrôlent variantes,
miroir, mobile, confort, sons, victoires automatiques et revanches dans Clash.
