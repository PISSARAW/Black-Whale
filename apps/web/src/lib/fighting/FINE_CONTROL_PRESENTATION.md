# Machi, Kalluto et Zakuro : matières manipulées, type 1

Les accents durent 18 images de simulation (0,3 seconde), dans la vue de combat.
Les lancements, manifestations et impacts de ces techniques restent sans vue
secondaire. La présentation observe les résultats du moteur et ne crée ni
projectile, ni lien, ni dégât ou ressource supplémentaire.

- Machi : départ du fil depuis la main actuelle, raccord au torse de la cible,
  resserrement de la ligature et courte couture après un soin réellement acquis.
  Les fils de Nen suivent In et le Gyo du spectateur, en P1 comme en P2.
- Kalluto : petits fragments physiques sur les projectiles réellement émis,
  mouvement de l’éventail au départ et accent sur un morceau réellement implanté.
  Le serpent conserve son guidage et ses conditions moteur ; aucun renseignement
  de la poupée d’écoute n’est ajouté à la présentation.
- Zakuro : accent au déploiement et aux changements de phase du fil de sang,
  resserrement lors de la capture et formation des trois gouttes existantes.
  Le rappel suit leur retour physique et conserve la réserve et la santé calculées
  par le moteur.

Le papier et le sang restent des matières physiques visibles sous In. Les effets
disparaissent lorsque le moteur retire leur support. Les mouvements utilisent le
temps de simulation : une pause les fige. Une reconstruction ou un changement de
manche ne rejoue pas les accents déjà passés. Le mouvement réduit retire les
oscillations et les ornements, en conservant les matières utiles au combat.

`fineControlPresentation.ts` conserve seulement des observations scalaires des
liens, émissions, implants, phases et identifiants des gouttes. Les trois scènes
possèdent et libèrent uniquement leurs propres géométries et matériaux.

Vérifications :

- `fineControlPresentation.test.ts` : actions réelles en P1/P2, durée des accents,
  refus, garde, interruption, pause, reconstruction, ressources et absence d’inset.
- `fineControlEffects.test.ts` : ancrages, In/Gyo, matières physiques, pause,
  mouvement réduit, perte d’autorité et propriété des ressources graphiques.
- `node apps/web/scripts/check-fighting-fine-control.mjs` : huit séquences filmées,
  pause, In/Gyo en P2, mouvement réduit et largeurs 390/320 px.

La vidéo et le rapport sont générés dans `output/clash-fine-control/`.
`FINE_CONTROL_CAPTURE_MODES=thread,scout` limite une reprise à ces séquences.
