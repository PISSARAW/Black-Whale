import type { RosterFighterId } from './rosterChoreography'
import type { FighterId, MoveSlot } from './types'

type Heavy = 'standingHeavy' | 'lowHeavy' | 'forwardHeavy' | 'backHeavy'

interface AlternateSignatureMove {
  id: string
  name: readonly [string, string]
  /** The original signature finisher also stays playable from this normal. */
  legacySource: MoveSlot
  base: Heavy
}

function attack(
  id: string,
  name: AlternateSignatureMove['name'],
  [legacySource, base]: readonly [MoveSlot, Heavy],
): AlternateSignatureMove {
  return { id, name, legacySource, base }
}

const MOVES = {
  kurapika: attack(
    'chain-heel',
    ['Talon de la chaîne', 'Chain Heel'],
    ['standingHeavy', 'lowHeavy'],
  ),
  hisoka: attack(
    'jokers-reverse',
    ['Revers du joker', 'Joker’s Reverse'],
    ['forwardLight', 'backHeavy'],
  ),
  chrollo: attack('margin-cut', ['Coupe en marge', 'Margin Cut'], ['backHeavy', 'forwardHeavy']),
  benjamin: attack(
    'barracks-elbow',
    ['Coude de caserne', 'Barracks Elbow'],
    ['standingHeavy', 'standingHeavy'],
  ),
  tserriednich: attack(
    'blind-angle-heel',
    ['Talon de l’angle mort', 'Blind-Angle Heel'],
    ['forwardLight', 'lowHeavy'],
  ),
  feitan: attack(
    'scabbard-reversal',
    ['Retour du fourreau', 'Scabbard Reversal'],
    ['forwardLight', 'backHeavy'],
  ),
  saiyu: attack(
    'pilgrims-knee',
    ['Genou du pèlerin', 'Pilgrim’s Knee'],
    ['standingHeavy', 'forwardHeavy'],
  ),
  theta: attack(
    'holster-check',
    ['Blocage à l’étui', 'Holster Check'],
    ['standingHeavy', 'backHeavy'],
  ),
  biscuit: attack(
    'granite-palm',
    ['Paume de granit', 'Granite Palm'],
    ['forwardLight', 'standingHeavy'],
  ),
  phinks: attack(
    'shoulder-recoil',
    ['Retour d’épaule', 'Shoulder Recoil'],
    ['standingHeavy', 'forwardHeavy'],
  ),
  franklin: attack(
    'iron-forearm',
    ['Avant-bras de fer', 'Iron Forearm'],
    ['standingHeavy', 'standingHeavy'],
  ),
  machi: attack('seam-ripper', ['Découd-vite', 'Seam Ripper'], ['forwardLight', 'backHeavy']),
  illumi: attack(
    'needle-feint',
    ['Feinte à l’aiguille', 'Needle Feint'],
    ['standingHeavy', 'lowHeavy'],
  ),
  kalluto: attack(
    'fan-spine',
    ['Dos de l’éventail', 'Fan Spine'],
    ['forwardLight', 'standingHeavy'],
  ),
  bonolenov: attack(
    'syncopated-heel',
    ['Talon syncopé', 'Syncopated Heel'],
    ['forwardLight', 'lowHeavy'],
  ),
  shizuku: attack(
    'blinky-butt',
    ['Revers du manche', 'Handle Backstrike'],
    ['standingHeavy', 'backHeavy'],
  ),
  hinrigh: attack(
    'sidearm-check',
    ['Coup de carcasse', 'Sidearm Check'],
    ['forwardLight', 'standingHeavy'],
  ),
  mizaistom: attack(
    'custody-trip',
    ['Croche-pied de garde', 'Custody Trip'],
    ['standingHeavy', 'lowHeavy'],
  ),
  leorio: attack(
    'sleeve-uppercut',
    ['Uppercut sous la manche', 'Sleeve Uppercut'],
    ['forwardLight', 'standingHeavy'],
  ),
  hanzo: attack(
    'hidden-ankle-cut',
    ['Coupe à la cheville', 'Hidden Ankle Cut'],
    ['forwardLight', 'lowHeavy'],
  ),
  rihan: attack(
    'measured-reversal',
    ['Revers mesuré', 'Measured Reversal'],
    ['standingHeavy', 'backHeavy'],
  ),
  zakuro: attack(
    'redirection-knee',
    ['Genou de déviation', 'Redirection Knee'],
    ['forwardLight', 'forwardHeavy'],
  ),
  melody: attack(
    'offbeat-palm',
    ['Paume à contretemps', 'Offbeat Palm'],
    ['standingHeavy', 'standingHeavy'],
  ),
  basho: attack(
    'inkstone-backfist',
    ['Revers de la pierre à encre', 'Inkstone Backfist'],
    ['forwardLight', 'backHeavy'],
  ),
  camilla: attack('court-heel', ['Talon de cour', 'Court Heel'], ['standingHeavy', 'lowHeavy']),
  halkenburg: attack(
    'bow-arm-check',
    ['Arrêt du bras d’arc', 'Bow-Arm Check'],
    ['standingHeavy', 'standingHeavy'],
  ),
  gel: attack('coiled-wrist', ['Poignet lové', 'Coiled Wrist'], ['forwardLight', 'backHeavy']),
  lynch: attack(
    'cross-examination-hook',
    ['Crochet d’interrogatoire', 'Cross-Examination Hook'],
    ['standingHeavy', 'standingHeavy'],
  ),
  luini: attack(
    'lintel-slice',
    ['Entaille du linteau', 'Lintel Slice'],
    ['forwardLight', 'forwardHeavy'],
  ),
  bill: attack(
    'rooted-forearm',
    ['Avant-bras enraciné', 'Rooted Forearm'],
    ['standingHeavy', 'standingHeavy'],
  ),
  furykov: attack(
    'lead-switch-hook',
    ['Crochet sur changement d’appui', 'Lead-Switch Hook'],
    ['forwardLight', 'backHeavy'],
  ),
  cluck: attack(
    'wingtip-heel',
    ['Talon en bout d’aile', 'Wingtip Heel'],
    ['forwardLight', 'forwardHeavy'],
  ),
  beyond: attack(
    'ridge-breaker',
    ['Brise-crête', 'Ridge Breaker'],
    ['standingHeavy', 'forwardHeavy'],
  ),
  longhi: attack(
    'counteroffer-elbow',
    ['Coude de la contre-offre', 'Counteroffer Elbow'],
    ['forwardLight', 'standingHeavy'],
  ),
  musse: attack(
    'flank-stock',
    ['Coup de crosse de flanc', 'Flank Stock Strike'],
    ['standingHeavy', 'backHeavy'],
  ),
  padaille: attack(
    'drill-housing-strike',
    ['Coup du carter', 'Drill Housing Strike'],
    ['forwardLight', 'forwardHeavy'],
  ),
  sayird: attack(
    'peripheral-sweep',
    ['Balayage périphérique', 'Peripheral Sweep'],
    ['standingHeavy', 'lowHeavy'],
  ),
  terebellum: attack(
    'doorframe-shoulder',
    ['Épaule du chambranle', 'Doorframe Shoulder'],
    ['forwardLight', 'forwardHeavy'],
  ),
  voconte: attack(
    'hinge-kick',
    ['Coup de pied de la charnière', 'Hinge Kick'],
    ['standingHeavy', 'lowHeavy'],
  ),
  yokotani: attack(
    'threshold-palm',
    ['Paume du seuil', 'Threshold Palm'],
    ['standingHeavy', 'standingHeavy'],
  ),
} satisfies Record<RosterFighterId, AlternateSignatureMove>

export const ALTERNATE_SIGNATURE_MOVES: Readonly<
  Partial<Record<FighterId, AlternateSignatureMove>>
> = MOVES
