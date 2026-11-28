import type { RosterFighterId } from './rosterChoreography'
import type { FighterId, MoveSlot } from './types'
import type { Numpad } from './motionInput'

export const SIGNATURE_GESTURES = {
  stepJab: { base: 'forwardLight', direction: 3 },
  slipPalm: { base: 'standingLight', direction: 1 },
  toeTap: { base: 'lowLight', direction: 3 },
  drawCut: { base: 'forwardLight', direction: 1 },
  outsideKick: { base: 'lowLight', direction: 1 },
  brace: { base: 'standingLight', direction: 3 },
  pivotElbow: { base: 'backHeavy', direction: 4 },
  risingPalm: { base: 'standingHeavy', direction: 5 },
  checkKnee: { base: 'forwardHeavy', direction: 6 },
  heelHook: { base: 'lowHeavy', direction: 1 },
  insideCut: { base: 'forwardLight', direction: 6 },
  shoulderTurn: { base: 'standingHeavy', direction: 4 },
  crossPalm: { base: 'standingLight', direction: 5 },
  reverseSweep: { base: 'lowHeavy', direction: 6 },
} as const satisfies Record<string, { base: MoveSlot; direction: Numpad }>

export type SignatureGesture = keyof typeof SIGNATURE_GESTURES
type Opening = 'stepJab' | 'slipPalm' | 'toeTap' | 'drawCut' | 'outsideKick' | 'brace'
type Transition = Exclude<SignatureGesture, Opening>
type Beat<T extends SignatureGesture> = readonly [gesture: T, fr: string, en: string]
type Choreography = readonly [Beat<Opening>, Beat<Transition>]

const CHOREOGRAPHY = {
  kurapika: [
    ['toeTap', 'Maillon rasant', 'Low Chain Cast'],
    ['crossPalm', 'Rappel du poignet', 'Wrist Reel'],
  ],
  hisoka: [
    ['slipPalm', 'Fausse donne', 'False Deal'],
    ['heelHook', 'Crochet du tricheur', 'Cardsharp’s Heel Hook'],
  ],
  chrollo: [
    ['drawCut', 'Trait de lecture', 'Reading Stroke'],
    ['pivotElbow', 'Coude du signet', 'Bookmark Elbow'],
  ],
  benjamin: [
    ['brace', 'Prise d’appui du sergent', 'Sergeant’s Brace'],
    ['checkKnee', 'Genou de percée', 'Breach Knee'],
  ],
  tserriednich: [
    ['slipPalm', 'Paume du rendez-vous manqué', 'Missed Appointment'],
    ['pivotElbow', 'Coude de la seconde perdue', 'Lost Second Elbow'],
  ],
  feitan: [
    ['drawCut', 'Pointe du fourreau', 'Scabbard Tip'],
    ['insideCut', 'Taille sous la garde', 'Underguard Cut'],
  ],
  saiyu: [
    ['stepJab', 'Pointe du pèlerin', 'Pilgrim’s Jab'],
    ['reverseSweep', 'Reprise du bâton', 'Staff Return'],
  ],
  theta: [
    ['outsideKick', 'Coup d’arrêt à la botte', 'Boot Stop'],
    ['crossPalm', 'Paume de désengagement', 'Disengaging Palm'],
  ],
  biscuit: [
    ['brace', 'Appui de quartz', 'Quartz Brace'],
    ['risingPalm', 'Paume ascendante du maître', 'Master’s Rising Palm'],
  ],
  phinks: [
    ['stepJab', 'Amorce de l’épaule', 'Shoulder Set'],
    ['shoulderTurn', 'Pivot du bras chargé', 'Loaded-Arm Pivot'],
  ],
  franklin: [
    ['brace', 'Appui du rempart', 'Rampart Brace'],
    ['pivotElbow', 'Coude de batterie', 'Battery Elbow'],
  ],
  machi: [
    ['slipPalm', 'Paume du fil court', 'Short-Thread Palm'],
    ['insideCut', 'Point en travers', 'Cross Stitch'],
  ],
  illumi: [
    ['stepJab', 'Sonde des phalanges', 'Knuckle Probe'],
    ['checkKnee', 'Genou du pantin', 'Marionette Knee'],
  ],
  kalluto: [
    ['drawCut', 'Trait de l’éventail fermé', 'Folded Fan Stroke'],
    ['crossPalm', 'Paume du pli', 'Fold Palm'],
  ],
  bonolenov: [
    ['toeTap', 'Levée de mesure', 'Pickup Beat'],
    ['checkKnee', 'Genou en syncope', 'Syncopated Knee'],
  ],
  shizuku: [
    ['slipPalm', 'Main de la poignée', 'Handle Hand'],
    ['shoulderTurn', 'Pivot du manche', 'Handle Pivot'],
  ],
  hinrigh: [
    ['drawCut', 'Pointe à contre-main', 'Reverse-Grip Point'],
    ['heelHook', 'Crochet de l’embuscade', 'Ambush Heel Hook'],
  ],
  mizaistom: [
    ['brace', 'Butée d’interpellation', 'Apprehension Brace'],
    ['reverseSweep', 'Balayage de mise aux arrêts', 'Detention Sweep'],
  ],
  leorio: [
    ['stepJab', 'Direct de rappel', 'Recall Jab'],
    ['risingPalm', 'Paume sous le menton', 'Chin Lift'],
  ],
  hanzo: [
    ['outsideKick', 'Crochet du pas feutré', 'Silent-Step Kick'],
    ['insideCut', 'Coupe du revers de manche', 'Sleeve Reverse Cut'],
  ],
  rihan: [
    ['slipPalm', 'Premier indice', 'First Clue'],
    ['risingPalm', 'Paume de confirmation', 'Confirmation Palm'],
  ],
  zakuro: [
    ['toeTap', 'Pointe de rabattage', 'Turning Toe Tap'],
    ['heelHook', 'Crochet du contre-appui', 'Counterstep Heel Hook'],
  ],
  melody: [
    ['toeTap', 'Temps faible', 'Weak Beat'],
    ['crossPalm', 'Paume du deuxième temps', 'Second-Beat Palm'],
  ],
  basho: [
    ['brace', 'Appui du premier vers', 'First-Line Brace'],
    ['insideCut', 'Trait de césure', 'Caesura Stroke'],
  ],
  camilla: [
    ['outsideKick', 'Pointe de révérence', 'Curtsy Kick'],
    ['shoulderTurn', 'Demi-tour d’audience', 'Court Turn'],
  ],
  halkenburg: [
    ['stepJab', 'Direct de mise en ligne', 'Alignment Jab'],
    ['pivotElbow', 'Coude de l’archer', 'Archer’s Elbow'],
  ],
  gel: [
    ['drawCut', 'Pointe du poignet vrillé', 'Coiled-Wrist Point'],
    ['risingPalm', 'Paume de la mue', 'Shedding Palm'],
  ],
  lynch: [
    ['stepJab', 'Question au corps', 'Body Question'],
    ['crossPalm', 'Relance de témoin', 'Witness Follow-up'],
  ],
  luini: [
    ['outsideKick', 'Pied dans l’entrebâillement', 'Foot in the Gap'],
    ['pivotElbow', 'Coude du battant', 'Doorleaf Elbow'],
  ],
  bill: [
    ['brace', 'Appui du tuteur', 'Stake Brace'],
    ['heelHook', 'Crochet de la racine', 'Root Hook'],
  ],
  furykov: [
    ['slipPalm', 'Lecture de la main avant', 'Lead-Hand Read'],
    ['checkKnee', 'Genou de garde inversée', 'Switch-Guard Knee'],
  ],
  cluck: [
    ['toeTap', 'Pointe du perchoir', 'Perch Tap'],
    ['pivotElbow', 'Coude sous l’aile', 'Underwing Elbow'],
  ],
  beyond: [
    ['brace', 'Appui dans la pente', 'Uphill Brace'],
    ['shoulderTurn', 'Épaule du passage étroit', 'Narrow-Pass Shoulder'],
  ],
  longhi: [
    ['slipPalm', 'Paume de mise en demeure', 'Formal Notice Palm'],
    ['insideCut', 'Trait de réserve', 'Reservation Stroke'],
  ],
  musse: [
    ['stepJab', 'Sonde de l’angle', 'Angle Probe'],
    ['heelHook', 'Crochet du guetteur', 'Lookout Heel Hook'],
  ],
  padaille: [
    ['drawCut', 'Pointe d’amorçage', 'Starter Point'],
    ['reverseSweep', 'Balayage d’établi', 'Workbench Sweep'],
  ],
  sayird: [
    ['outsideKick', 'Pointe du champ mort', 'Blind-Field Kick'],
    ['risingPalm', 'Paume de mise au point', 'Focus Palm'],
  ],
  terebellum: [
    ['brace', 'Butée de seuil', 'Threshold Brace'],
    ['crossPalm', 'Paume du transfert d’appui', 'Weight-Transfer Palm'],
  ],
  voconte: [
    ['toeTap', 'Pointe du pas de porte', 'Doorstep Tap'],
    ['shoulderTurn', 'Épaule du battant', 'Doorleaf Shoulder'],
  ],
  yokotani: [
    ['slipPalm', 'Paume de sommation', 'Summons Palm'],
    ['reverseSweep', 'Balayage de reconduite', 'Escort Sweep'],
  ],
} satisfies Record<RosterFighterId, Choreography>

export const ALTERNATE_SIGNATURE_CHOREOGRAPHY: Readonly<Partial<Record<FighterId, Choreography>>> =
  CHOREOGRAPHY
