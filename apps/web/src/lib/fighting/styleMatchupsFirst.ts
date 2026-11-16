import { entry, type StyleMatchup } from './styleMatchupTypes'
import type { FighterId } from './types'
export const FIRST_STYLE_MATCHUPS: Partial<Record<FighterId, StyleMatchup>> = {
  kurapika: entry(
    'control',
    [
      'Tenir la moyenne distance et confirmer avant les chaînes.',
      'Hold mid-range and confirm before committing chains.',
    ],
    [
      'Punir une chaîne manquée ; Chain Jail exige une cible autorisée.',
      'Punish a missed chain; Chain Jail requires an eligible target.',
    ],
  ),
  hisoka: entry(
    'mobile',
    [
      'Attirer, attacher la gomme puis choisir la traction.',
      'Bait, attach gum, then choose when to pull.',
    ],
    [
      'Frapper interrompt la traction ; Gyo repère In sans dissiper la gomme.',
      'A hit interrupts pulling; Gyo reveals In without dispelling gum.',
    ],
  ),
  chrollo: entry(
    'preparation',
    [
      'Préparer pages et signet ; vérifier les mains et le matériel.',
      'Prepare pages and bookmark; check hands and equipment.',
    ],
    [
      'Punir les transitions du livre ; une copie ne fournit aucun équipement.',
      'Punish book transitions; copying supplies no equipment.',
    ],
  ),
  benjamin: entry(
    'pressure',
    [
      'Avancer avec les coups physiques et choisir un héritage disponible.',
      'Advance with physical strikes and choose an available inheritance.',
    ],
    [
      'Prendre de la distance sur les lourds ; les héritages gardent leurs conditions.',
      'Create space against heavies; inherited abilities keep their conditions.',
    ],
  ),
  tserriednich: entry(
    'preparation',
    [
      'Créer une ouverture pour fermer les yeux et préparer la vision.',
      'Create space to close the eyes and prepare the vision.',
    ],
    [
      'Toucher pendant la préparation du Zetsu ; aucune anticipation avant une vision acquise.',
      'Hit during Zetsu preparation; no anticipation before an earned vision.',
    ],
  ),
  feitan: entry(
    'preparation',
    [
      'Transformer les blessures réellement reçues en Pain Packer.',
      'Turn actual injuries into Pain Packer.',
    ],
    [
      'Punir la préparation puis quitter le cercle solaire ; la garde ne bloque pas la chaleur.',
      'Punish preparation, then leave the solar circle; guard does not block heat.',
    ],
  ),
  saiyu: entry(
    'control',
    [
      'Placer les singes pour retirer séparément les sens.',
      'Land the monkeys to remove individual senses.',
    ],
    [
      'Garder ou esquiver les contacts ; Gyo ne répare pas une vue scellée.',
      'Guard or evade contact; Gyo does not restore sealed sight.',
    ],
  ),
  theta: entry(
    'ranged',
    [
      'Alterner pistolet physique et coups à courte portée.',
      'Alternate a physical handgun with close-range strikes.',
    ],
    [
      'Garder les balles ou sauter puis approcher ; Zetsu ne supprime pas le pistolet.',
      'Guard bullets or jump and approach; Zetsu does not remove the handgun.',
    ],
  ),
  biscuit: entry(
    'pressure',
    [
      'Choisir le moment de révéler le corps naturel puis gagner le contact.',
      'Choose when to reveal the natural body, then close in.',
    ],
    [
      'Faire manquer les coups lourds et punir leur récupération ; la forme est corporelle.',
      'Bait heavy whiffs and punish recovery; the form belongs to the body.',
    ],
  ),
  phinks: entry(
    'preparation',
    [
      'Préparer les rotations avant de risquer le poing chargé.',
      'Prepare rotations before risking the charged punch.',
    ],
    [
      'Presser pendant une rotation ; un tour déjà terminé ne disparaît pas par magie.',
      'Pressure during a rotation; completed turns do not magically disappear.',
    ],
  ),
  franklin: entry(
    'ranged',
    [
      'Créer de la distance et engager une rafale avec les deux mains.',
      'Create distance and commit to a two-handed barrage.',
    ],
    [
      'Varier garde et saut pour approcher ; un coup interrompt les tirs encore à émettre.',
      'Mix guard and jumping to approach; a hit interrupts shots not yet released.',
    ],
  ),
  machi: entry(
    'control',
    [
      'Poser le fil, maintenir la bonne distance, suturer avec une ouverture.',
      'Attach thread, maintain spacing, and suture during an opening.',
    ],
    [
      'Frapper le porteur ou dépasser la longueur de contention ; le pistage peut rester.',
      'Hit the owner or exceed binding range; tracking may remain.',
    ],
  ),
  illumi: entry(
    'control',
    [
      'Chercher un contact réel de l’aiguille ; préparer le visage à couvert.',
      'Seek actual needle contact; prepare the disguise safely.',
    ],
    [
      'Éviter ou garder l’aiguille ; couper le Nen ne répare pas Needle People.',
      'Evade or guard the needle; losing Nen does not repair Needle People.',
    ],
  ),
  kalluto: entry(
    'mobile',
    [
      'Planter du papier avant de faire converger le flux.',
      'Plant paper before directing the stream.',
    ],
    [
      'Garder la pose des fragments ; le papier planté reste physique après le Nen.',
      'Guard the planting hit; planted paper remains physical after Nen stops.',
    ],
  ),
  bonolenov: entry(
    'preparation',
    [
      'Trouver le temps de danser avant les techniques musicales.',
      'Find time to dance before committing musical techniques.',
    ],
    [
      'Interrompre la danse ou sortir de la trajectoire ; copier ne fournit pas ses trous corporels.',
      'Interrupt the dance or evade the trajectory; copying does not supply body holes.',
    ],
  ),
  shizuku: entry(
    'control',
    [
      'Créer des plaies avec Blinky avant d’aspirer le sang exposé.',
      'Create wounds with Blinky before vacuuming exposed blood.',
    ],
    [
      'Garder les frappes ; couvrir les plaies occupe les mains sans les soigner.',
      'Guard strikes; plugging wounds occupies the hands without healing them.',
    ],
  ),
  hinrigh: entry(
    'control',
    [
      'Transformer des menottes réelles et récupérer les objets perdus.',
      'Transform real handcuffs and recover dropped objects.',
    ],
    [
      'Garder ou éviter le pigeon ; blesser le porteur rompt la capture.',
      'Guard or evade the pigeon; injuring the owner breaks capture.',
    ],
  ),
  mizaistom: entry(
    'control',
    [
      'Faire entendre le carton jaune avant de sanctionner une désobéissance.',
      'Make the yellow warning audible before punishing disobedience.',
    ],
    [
      'Respecter l’avertissement perceptible ; le carton n’est pas une attaque invisible.',
      'Obey the perceptible warning; the card is not an invisible strike.',
    ],
  ),
  leorio: entry(
    'control',
    [
      'Choisir le point de sortie du poing à travers le sol.',
      'Choose where the fist emerges through the floor.',
    ],
    [
      'Bouger pendant la préparation et éviter le poing émergent ; pas de frappe instantanée.',
      'Move during preparation and evade the emerging fist; it is not an instant hit.',
    ],
  ),
  hanzo: entry(
    'mobile',
    [
      'Placer le corps endormi avant de diriger le double.',
      'Position the sleeping body before controlling the double.',
    ],
    [
      'Approcher le corps et le toucher ou l’appeler si la parole peut être entendue.',
      'Approach the body and touch it, or call if speech can be heard.',
    ],
  ),
}
