import { entry, type StyleMatchup } from './styleMatchupTypes'
import type { FighterId } from './types'
export const FIRST_STYLE_MATCHUPS: Partial<Record<FighterId, StyleMatchup>> = {
  kurapika: entry(
    'control',
    [
      'Mesurer de la main droite puis ramener le crochet au corps. Confirmer avant les chaînes.',
      'Measure with the right hand and bring the hook back to the body. Confirm before committing chains.',
    ],
    [
      'Punir une chaîne manquée ; Chain Jail exige une cible autorisée.',
      'Punish a missed chain; Chain Jail requires an eligible target.',
    ],
  ),
  hisoka: entry(
    'mobile',
    [
      'Feinter du poignet et repartir sur le talon. Attirer, attacher la gomme puis choisir la traction.',
      'Feint with the wrist and spring back with the heel. Bait, attach gum, then choose when to pull.',
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
      'Fermer l’axe de la paume puis avancer l’épaule. Choisir un héritage disponible.',
      'Block the line with the palm, then drive with the shoulder. Choose an available inheritance.',
    ],
    [
      'Prendre de la distance sur les lourds ; les héritages gardent leurs conditions.',
      'Create space against heavies; inherited abilities keep their conditions.',
    ],
  ),
  tserriednich: entry(
    'preparation',
    [
      'Marquer une pause avant le revers. Créer une ouverture pour fermer les yeux et préparer la vision.',
      'Pause before the backfist. Create space to close the eyes and prepare the vision.',
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
      'Tenir la distance avec la pointe du bâton. Placer les singes pour retirer séparément les sens.',
      'Control distance with the staff tip. Land the monkeys to remove individual senses.',
    ],
    [
      'Garder ou esquiver les contacts ; Gyo ne répare pas une vue scellée.',
      'Guard or evade contact; Gyo does not restore sealed sight.',
    ],
  ),
  theta: entry(
    'ranged',
    [
      'Intercepter de la paume libre puis frapper de la crosse à courte portée.',
      'Intercept with the free palm and follow with the pistol butt at close range.',
    ],
    [
      'Garder les balles ou sauter puis approcher ; Zetsu ne supprime pas le pistolet.',
      'Guard bullets or jump and approach; Zetsu does not remove the handgun.',
    ],
  ),
  biscuit: entry(
    'pressure',
    [
      'Dévier de la paume en forme compacte. En forme naturelle, poser des appuis plus larges avant le crochet.',
      'Deflect with an open palm in compact form. Set a wider base before the hook in natural form.',
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
      'Couvrir de la paume et frapper des deux bras à courte portée. Créer de la distance avant une rafale.',
      'Cover with the palm and strike with both arms at close range. Create space before a barrage.',
    ],
    [
      'Varier garde et saut pour approcher ; un coup interrompt les tirs encore à émettre.',
      'Mix guard and jumping to approach; a hit interrupts shots not yet released.',
    ],
  ),
  machi: entry(
    'control',
    [
      'Changer d’appui, écarter de la paume et ramener du crochet. Poser le fil et suturer pendant une ouverture.',
      'Shift your weight, strike with the palm, then pull with the hook. Attach thread and suture during an opening.',
    ],
    [
      'Frapper le porteur ou dépasser la longueur de contention ; le pistage peut rester.',
      'Hit the owner or exceed binding range; tracking may remain.',
    ],
  ),
  illumi: entry(
    'control',
    [
      'Entrer en ligne et viser d’un geste bref. Toucher de l’aiguille et préparer le visage à couvert.',
      'Step straight in and strike with a small motion. Land a needle and prepare the disguise safely.',
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
      'Alterner genou et talon sur des changements d’appui. Trouver le temps de danser avant les techniques musicales.',
      'Alternate knee and heel strikes over changing footwork. Find time to dance before committing musical techniques.',
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
      'Entrer en diagonale, chercher le contact de la main et rabattre l’adversaire. Biohazard transforme les menottes réelles.',
      'Step in at an angle, find contact with the lead hand and turn the opponent. Biohazard transforms real handcuffs.',
    ],
    [
      'Garder ou éviter le pigeon ; blesser le porteur rompt la capture.',
      'Guard or evade the pigeon; injuring the owner breaks capture.',
    ],
  ),
  mizaistom: entry(
    'control',
    [
      'Tenir la mi-distance avec l’avant-bras et le talon. Le carton jaune avertit avant de sanctionner une désobéissance.',
      'Hold midrange with forearm and heel checks. The yellow card warns before it punishes disobedience.',
    ],
    [
      'Respecter l’avertissement perceptible ; le carton n’est pas une attaque invisible.',
      'Obey the perceptible warning; the card is not an invisible strike.',
    ],
  ),
  leorio: entry(
    'control',
    [
      'Prendre appui avant l’uppercut. Choisir le point de sortie du poing à travers le sol.',
      'Set your feet before the uppercut. Choose where the fist emerges through the floor.',
    ],
    [
      'Bouger pendant la préparation et éviter le poing émergent ; pas de frappe instantanée.',
      'Move during preparation and evade the emerging fist; it is not an instant hit.',
    ],
  ),
  hanzo: entry(
    'mobile',
    [
      'Fermer la distance par des pas brefs, alterner la main ouverte et le talon pivoté au corps-à-corps. Préparer le double exige de laisser son corps endormi exposé.',
      'Close with brief steps, alternate open-hand strikes and pivoting heels at close range. Preparing the double leaves the sleeping body exposed.',
    ],
    [
      'Approcher le corps et le toucher ou l’appeler si la parole peut être entendue.',
      'Approach the body and touch it, or call if speech can be heard.',
    ],
  ),
}
