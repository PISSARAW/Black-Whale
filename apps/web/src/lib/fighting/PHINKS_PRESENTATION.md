# Phinks : tours complets en type 1, poing chargé confirmé en type 2

Le moulinet anatomique du bras droit reste celui de `phinksMotion.ts`. Chaque
augmentation réelle de la réserve de tours complets reçoit un anneau discret au
poignet pendant 18 images de simulation (0,3 seconde). Commencer à mouliner,
abandonner un tour incomplet, arrêter le bras ou libérer le poing ne produit pas
de plan rapproché. Les observations et le départ du coup restent de type 1.

Le plan de type 2 attend une blessure directe effectivement infligée par le
poing porteur de `attack.cyclotronTurns`. Il suit la main droite du porteur et le
torse du destinataire pendant 84 images (1,4 seconde), en cadence compacte comme
étendue. Un anneau de contact accompagne les 24 premières images. Le combat,
les commandes et les déplacements continuent pendant le plan.

Un tour complet suffit ; aucun seuil supplémentaire n'est ajouté. La garde
(y compris ses dégâts résiduels), la parade, l'esquive, l'invulnérabilité, un
coup sans dégâts, manqué ou interrompu, un projectile et une blessure redirigée
par Sweet Home ne sont pas des impacts chargés confirmés. Les coups ordinaires
ne profitent pas du seul fait de conserver une réserve.

`phinksImpact.ts` consigne le contact réellement résolu, avant la fusion d'un
échange simultané ou le traitement d'un projectile. Ce petit journal optionnel,
borné au dernier contact par combattant, conserve les deux coups d'un échange
et traverse les copies et replays. Il ne modifie aucun résultat de combat.
Les séquences évitent les répétitions ; une reconstruction à froid, un retour
en arrière ou une nouvelle manche ne rejoue pas un ancien contact. Les anciens
instantanés sans ce journal utilisent encore leur impact direct et la charge
attachée à l'attaque, jamais la réserve seule.

Les accents et leurs ancres suivent les frames de simulation. La pause conserve
leurs positions ; un modèle reconstruit renouvelle les ancres. La main droite
reste anatomiquement droite après un changement d'orientation. In, Gyo et le
point de vue filtrent les ornements. Le réglage sans éclats et le mouvement
réduit retirent les effets décoratifs, sans effacer le geste ni ses conséquences.
Le titre du plan ne révèle pas le nombre de tours d'un adversaire.

Vérifications : `phinksAnimation.test.ts`, `phinks.test.ts`, les tests de caméra
et de replay. `node apps/web/scripts/check-phinks-cinematics.mjs` filme huit
scénarios exécutés avec les commandes et ticks natifs, puis contrôle P2, la
pause active, In/Gyo, le mouvement réduit et les largeurs 390/320 px.
Sorties : `output/clash-phinks/`, dont `phinks.mp4` et `report.json`.
`PHINKS_CAPTURE_MODES=hit,block` limite la capture à ces cas ; une valeur vide
exécute seulement les contrôles complémentaires.
