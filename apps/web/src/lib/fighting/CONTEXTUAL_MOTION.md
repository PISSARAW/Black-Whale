# Continuité des contacts et des appuis

Ces cinq étapes prolongent les gestes de [COMBO_MOTION.md](./COMBO_MOTION.md)
pour les quarante combattants. Elles concernent la présentation : les commandes,
frames actives, ressources, zones logiques de Nen et replays restent autoritaires.
Les styles, équipements, couleurs natives et exceptions de traversée sont conservés.

## 1. Contacts bas vers haut

`fightContactPosture.ts` construit une variante basse du contact entrant quand
le geste part d’un bassin abaissé. Les hanches et genoux conservent une part de
la posture sortante pendant la préparation et les images actives, puis remontent
pendant la récupération réelle. La variante appartient à la scène et survit aux
reconstructions Nen ; un nouveau geste la recalcule depuis la dernière pose.
Les bras gardent leur chorégraphie et les techniques aériennes restent dédiées.
`fightContactPosture.test.ts` vérifie les quarante entrées, le contact, le hitstop
et le retour final, sans ralentir le simulateur.

## 2. Poussée, transfert et freinage

`fightSupportCycle.ts` choisit délibérément la jambe arrière de préparation,
puis la jambe avant de réception. Une jambe qui frappe est libérée tandis que
l’autre reste en appui. `fightStrikeSupport.ts` conserve la poussée du profil
personnel au contact et fait conduire les épaules par la rotation du bassin.
`fightSeparationSupport.ts` mémorise les deux semelles, conserve leur hauteur
et accompagne les déplacements plus grands par un pas articulé. Il respecte
les sauts, déplacements, passages et hitstop. `fightSupportCycle.test.ts` couvre
les quarante styles et les deux orientations ; les tests de semelles mesurent
leur position réelle et l’absence d’étirement des segments.

## 3. Impulsions et chutes directionnelles

`fightDirectionalImpulse.ts` lit le membre et le geste réellement engagés :
le côté recevant, le crochet, la compression et la montée ont des réponses
asymétriques. L’amplitude reprend aussi la chorégraphie de l’attaquant.
La réaction locale conduit le thorax, puis le bassin et le pas ; le déséquilibre
précédent reste borné et les retours périodiques du buste sont réduits.
`fightFallResponse.ts` échelonne le regroupement des jambes, l’ouverture des
bras et la réception au sol. Les KO ne se relèvent pas. Les quarante profils
sont vérifiés dans `fightDirectionalImpulse.test.ts`, en complément des combos
natifs, reconstructions Nen et relevés déjà contrôlés.
