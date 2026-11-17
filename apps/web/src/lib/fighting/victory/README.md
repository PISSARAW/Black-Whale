# Cinématiques de victoire de Clash

Les six scènes (Hisoka, Chrollo, Kurapika, Feitan, Phinks, Franklin) se jouent
pendant dix secondes après le verdict. Le gagnant, le vaincu et le lieu viennent
du combat courant, pour les deux côtés du duel. Les scènes ne modifient jamais
les PV, l'aura, les conditions des Hatsu ou le résultat synchronisé.

`playback.ts` gère le déclenchement, la pause, la fin et le passage de la scène.
`renderer.ts` travaille sur les modèles de la scène actuelle et restaure toutes
les transformations après chaque rendu. Chaque personnage possède sa propre
chorégraphie ; le cadrage et les accessoires utilisent les dimensions réelles
des deux modèles. Les effets sont libérés avec le canvas.

Le HUD et le panneau de résultats attendent la fin ou le passage de la scène.
Les replays, égalités et prévisions ne déclenchent pas une nouvelle victoire.
Les réglages de confort et de son s'appliquent également à ces séquences.

Les films d'Hisoka et Chrollo gardent leur verdict « VICTOIRE » ; les quatre
autres affichent « FATALITY ». Uvogin ne fait pas partie de ce catalogue.
L'animation se joue localement, y compris en PvP : aucun événement réseau ni
dommage supplémentaire n'est envoyé. Chain Jail reste ici une pose après verdict,
sans contourner ses conditions dans la simulation du combat.

Le temps attend le premier rendu, s'arrête pendant une pause ou quand l'onglet
est masqué et reprend ensuite. Le son suit la même horloge. Échap, Entrée,
Espace, A à la manette ou le bouton « Passer » ouvrent les résultats immédiatement.
Si le canvas ou une ressource échoue, les résultats restent accessibles.

`playback.test.ts` couvre le catalogue croisé avec tout le roster et les arènes,
le chronométrage, les pauses, le passage et les rematches. `renderer.test.ts`
vérifie les modèles natifs des deux côtés, l'absence de mutation du combat,
la restauration des poses et matériaux et le repli après une erreur.
`node apps/web/scripts/check-fighting-victory.mjs` contrôle les six séquences,
plusieurs lieux, les tailles extrêmes, un miroir et le mobile dans un vrai canvas.
Les bandes sonores proviennent des six démos validées et se trouvent dans
`apps/web/static/clash-victories/`.
