# Shizuku : aspiration d’objet et de sang, type 1

La vue de combat reste continue. Un accent de 18 images de simulation
(0,3 seconde) accompagne le démarrage effectif de l’aspiration. Les objets
confirmés et les gouttes convergent brièvement vers la bouche de Blinky.

`blinkyPresentation.ts` observe le dernier objet réellement stocké, la disparition
effective d’un objet du décor et les pertes de santé aux intervalles d’extraction
du sang. Une aspiration vide, une cible refusée ou des plaies complètement
bouchées ne créent aucune matière décorative. Une reconstruction ne rejoue pas
un stockage ou une extraction passée.
Les extractions restent visibles lorsque plusieurs images de simulation
s’écoulent entre deux rendus.

Les trajectoires n’ajoutent aucun projectile, dégât, soin, recul ou effet de Nen.
Elles représentent une matière déjà retirée par le moteur. La mémoire du dernier
objet, l’éjection, les catégories admissibles et les règles des plaies restent
celles du combat existant. Le coup physique avec Blinky garde sa présentation.

La bouche est conservée comme articulation du modèle partagé, afin de fournir un
ancrage exact même après une reconstruction de la figure. Le tremblement de Blinky
et sa langue suivent désormais le temps de simulation dans la scène de combat.
Les accents se figent en pause et disparaissent après interruption ou perte du
Nen. Le mouvement réduit retire les trajectoires et les mouvements décoratifs,
en conservant le modèle de Blinky. Le sang extrait et les objets physiques restent
visibles sous In en P1 comme en P2.

Vérifications : `blinkyPresentation.test.ts`, `shizuku.test.ts`,
`arenaTechnique.test.ts`, `visitHatsuModel.test.ts` et les tests de caméra.
`node apps/web/scripts/check-fighting-blinky.mjs` capture les objets, le décor,
le sang, les plaies bouchées et l’aspiration vide, puis vérifie P2, In, la pause,
le mouvement réduit et les largeurs 390/320 px. La vidéo et le rapport sont dans
`output/clash-blinky/`. `BLINKY_CAPTURE_MODES=blood` reprend une seule séquence ;
une valeur vide relance les contrôles complémentaires.
