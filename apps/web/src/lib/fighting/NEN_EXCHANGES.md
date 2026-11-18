# Échanges et contre-jeux du Nen

## Suites liées à l’état réel

`nenComboReadiness.ts` complète les routes de cancel existantes. Une continuation
utilisant le Nen attend la fin d’un transfert actif, une répartition compatible
avec sa zone, une réserve suffisante et du débit disponible. Les continuations
physiques restent possibles pendant ce choix. Une capacité ne gagne aucune route
ni aucun support par sa seule catégorie.

Les admissions contextuelles de `movesets.ts` restent autoritaires : supports,
copies, munitions, charge de Cyclotron, conditions personnelles et coûts sont
vérifiés comme pour une action indépendante. L’aide de combo distingue une attente
de répartition d’une action prête. Le buffer réessaie dans les fenêtres du moteur,
sans prolonger le hitstun pour garantir la suite. Une attente peut donc coûter
la conversion. Les chiffres et seuils sont des règles arcade, pas des rangs du manga.

Les replays passent à `clash-combat-50-nen-exchanges`.

## Réactions liées au mécanisme

`nenImpactResponse.ts` capture le contact résolu après les effets du Hatsu, avant
la séparation finale. Percussion, projectile, aiguille et contrainte réellement
appliquée sont distingués sans déduire un effet de la seule affinité. La réaction
survit au cancel de l’émetteur et à la disparition du projectile. La force tient
compte du profil de la victime ; les frappes physiques gardent leurs gestes propres.
Une traction ou une immobilisation active articule la résistance du corps à sa
position autoritaire. La présentation ne produit ni déplacement, ni dégât, ni
nouvelle traversée. Garde, parade et esquive n’ajoutent aucune réaction de blessure.

## Engagements visibles et réponses

`nenCommitment.ts` distingue récupération corporelle visible et redistribution
d’aura observable. In exige le Gyo adverse pour cette seconde lecture ; la cécité
refuse les deux. L’IA classe les coups déjà proposés selon leur portée et leur
préparation dans la fenêtre de récupération courante, puis subit les admissions
normales. Aucun contre automatique, nouvelle invulnérabilité ou prolongation de
stun n’est accordé. Les accents de préparation et de récupération complètent les
poses personnelles ; la pose active de contact et la racine restent intactes.

`nenFluxTiming.ts` suit l’âge et la destination du transfert autoritaire, même
quand les parts changent à chaque frame. Le flux ne redémarre plus à chaque part
interpolée ; son horloge se fige avec le hitstop. Enveloppes et flux gardent
`fighterAuraHex`, la confidentialité de In et les préférences de confort.

Les [combats autonomes](../../../demos/fighting-nen-exchanges/README.md) filment
trois extraits continus à vitesse normale et exportent les replays vérifiés.
