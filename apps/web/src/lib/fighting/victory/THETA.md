# Theta — Une balle d’avance

La cinématique de dix secondes utilise le pistolet physique de Theta. Son
Hatsu personnel reste inconnu. Retirer le chargeur ne retire pas la balle déjà
dans la chambre : la cible prend ce geste pour une ouverture et se précipite.
Theta se décale, donne un coup de crosse, reprend une visée à deux mains et
tire une seule fois. Le gros plan suit la douille au ralenti, puis la cible
chute. Le verdict et l’annonce anglaise Fatality arrivent après huit secondes.
Il n’y a pas de voix française.

Le chargeur est libéré à 84, la crosse touche à 252, le tir part à 372 et la
chute native commence à 408 (images à 60 Hz). La culasse recule puis revient :
sans chargeur, elle ne reste pas retenue ouverte. Une seule douille est éjectée.
Le décor et la cible viennent du match. La pose s’ajuste aux gabarits ; les
bras conservent leur longueur. Les effets et accessoires sont privés, et le
rendu restaure les transformations et la visibilité des modèles natifs.
La caméra réduite garde un plan large, et les flashes peuvent être désactivés.

La feinte est une chorégraphie après verdict. Elle ne crée ni pouvoir de Nen,
ni dégâts, ni règle de munitions dans la simulation. `thetaFatalityFilm.ts`
obtient d’abord un vrai K.-O. par les projectiles physiques natifs de Theta.
`theta.test.ts` couvre la preuve, la portée des mains, la direction du canon,
les gabarits, la chute et la restauration. `thetaPlayback.test.ts` croise les
40 adversaires, tous les lieux, deux côtés, IA/local et les motifs de victoire.

Démo : `demos/fighting-showcase/theta-fatality.html`, avec `target`, `stage`,
`side=opponent` et `reduced`. Les scripts `render-theta-fatality.mjs` et
`compose-theta-fatality.mjs` produisent une vidéo de dix secondes en 1080p30
et le son `static/clash-victories/theta.m4a`. `--inspect` n’exporte que les
plans de contrôle ; `--audio-only` produit seulement le son.
`check-theta-fatality.mjs` contrôle la démo, le miroir, le mobile et le confort ;
`check-theta-victories.mjs` vérifie les victoires et revanches dans Clash,
le chargement du son, la fin naturelle et l’absence de mutation du résultat.
Sortie : `output/fighting-theta-fatality/Theta-Fatality-10s.mp4`.
