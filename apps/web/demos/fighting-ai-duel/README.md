# Hisoka contre Machi — duel autonome

Deux contrôleurs décident à partir du combat : l’IA native du jeu pilote Machi,
et `hisokaAgent.ts` pilote Hisoka avec les commandes normales de déplacement,
de garde, de Nen, de coups et d’arsenal. Aucun résultat, impact, soin ou combo
n’est scénarisé. Les décisions ne lisent ni entrées adverses ni aura cachée.

`duel.ts` enregistre le duel dans le format de replay natif et vérifie tous ses
checkpoints en le resimulant. La vidéo filme ce replay dans le site. Le terrain
`royal-salon` est le décor des quartiers royaux de Nasubi employé pour le bureau
du roi demandé. La préparation et les menus restent hors de la vidéo : elle
commence au premier instant du combat.

La cadence de décision et les seuils de l’agent sont des réglages d’IA.
Ils n’accordent aucune nouvelle capacité de Nen et ne modifient pas le moteur.
On conserve le statut de variante du film déjà présent dans Clash.
