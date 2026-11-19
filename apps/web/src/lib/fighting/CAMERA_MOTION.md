# Continuité de la caméra de combat

La caméra conserve un plan latéral lisible pendant les échanges. Les coefficients
sont des choix de Clash inspirés de l’observation de Street Fighter 6 ; ils ne
reproduisent pas un algorithme interne de Capcom.

## Une phrase pour l’enchaînement

`combatCameraPhrase.ts` mémorise l’engagement du combattant proche de sa cible.
Le rapprochement se construit progressivement ; un cancel conserve l’enveloppe
et une frappe plus forte peut en augmenter le maximum sans repartir de zéro.
La continuité couvre la récupération, le hitstun et une courte liaison. Après
l’échange, elle se relâche progressivement. Un contre confirmé peut changer
le propriétaire sans effacer le mouvement déjà dessiné.

Les frames simulées conduisent cette enveloppe : pause et hitstop la figent,
recul du replay et nouvelle manche la réinitialisent. Après un verdict, le temps
de présentation permet le retour même si la simulation ne progresse plus.
Le changement de géométrie Nen ne recrée pas cette mémoire.

## Un accent dominant

`combatCameraAccent.ts` distingue les légers, lourds et techniques, avec une
amplitude plus faible avant confirmation. Les fins basse, aérienne, rapprochée
et transportée conservent des accents propres. Un détail de technique personnel
peut devenir prioritaire ; sa poussée remplace celle du combo si elle est plus
forte. Les changements ordinaires de Ryu/Ko ne relancent pas le zoom principal.

`combatCamera.ts` amortit le suivi, le rapprochement et l’inclinaison, ignore les
petites variations horizontales et limite la vitesse des mouvements expressifs.
Les marges de sécurité restent prioritaires : les corps, pieds et têtes, le HUD,
les formats étroits, les décors et les formes spéciales conservent leurs limites.
La vitesse verticale et la préparation du lanceur anticipent l’ouverture du plan.

## Impacts et projections

`combatImpactShake.ts` produit une impulsion courte et amortie sur l’horloge
simulée. Les légers sont plus discrets ; une touche faible ne relance pas une
secousse forte encore en cours. La pause conserve son échantillon, le recul du
replay l’efface et le verdict arrête la vibration. Les réglages de confort et
les couleurs des effets restent ceux du personnage.

`liveCameraFraming.ts` conserve le cadrage propre au duo et aux techniques.
`FightScene.svelte` calcule ce plan même pendant une projection, puis applique
la caméra dédiée. `throwCinematicCamera.ts` rejoint progressivement le plan
courant dans la dernière partie de la prise. Elle revient ainsi vers la position
actuelle des corps plutôt que vers le cadrage mémorisé avant leur déplacement.
Les introductions, films à caméra écrite, mouvements réduits et plans de victoire
conservent leur priorité.

## Vérification

`combatCameraPhrase.test.ts` exécute des combos natifs des quarante personnages,
dans les deux places, et contrôle les cancels, la progression bornée, le retour,
la pause, le hitstop, les changements de Nen, les lanceurs, les secousses et la
sortie de projection sans mutation du duel. Les tests de cadrage projettent les
corps sur plusieurs formats ; les tests de techniques et projections restent
applicables. `scripts/check-fighting-camera.mjs` vérifie la scène de production.
