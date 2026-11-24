import type { CombatProfile, PhysicalMove } from './physicalCombatProfiles'
import { physicalMove } from './physicalCombatWaveTwo'
import type { FighterId, MoveSlot } from './types'

export const WAVE_THREE_MOBILITY = {
  // Beyond advances under his own weight. His curse remains a separate, prepared act.
  beyond: {
    walk: 0.87,
    backWalk: 0.82,
    forwardDash: { frames: 22, peak: 91 },
    backDash: { frames: 18, peak: 67 },
    jump: 0.91,
    drift: 0.84,
    landing: 5,
    sway: 0.83,
    roll: 0.84,
    range: [5, 10],
    guardRange: 12,
    reaction: 13,
  },
  // Padaille braces the right side while the free hand gauges range.
  padaille: {
    walk: 0.96,
    backWalk: 0.94,
    forwardDash: { frames: 19, peak: 97 },
    backDash: { frames: 16, peak: 83 },
    jump: 0.95,
    drift: 0.92,
    landing: 4,
    sway: 0.92,
    roll: 0.93,
    range: [8, 13],
    guardRange: 14,
    reaction: 12,
  },
  // Lynch wants fist range and a clean line right down the middle.
  lynch: {
    walk: 1.14,
    backWalk: 0.86,
    forwardDash: { frames: 13, peak: 114 },
    backDash: { frames: 14, peak: 95 },
    jump: 1.05,
    drift: 1.13,
    landing: 2,
    sway: 1.05,
    roll: 1.08,
    range: [5, 9],
    guardRange: 10,
    reaction: 9,
  },
  // Rihan gives ground to observe and steps in only when the rival commits.
  rihan: {
    walk: 0.99,
    backWalk: 1.02,
    forwardDash: { frames: 15, peak: 90 },
    backDash: { frames: 13, peak: 103 },
    jump: 0.89,
    drift: 0.88,
    landing: 2,
    sway: 1.19,
    roll: 1.13,
    range: [9, 14],
    guardRange: 15,
    reaction: 10,
  },
  // Basho's rear hand stays close until a planted step buys time to strike.
  basho: {
    walk: 0.92,
    backWalk: 1.04,
    forwardDash: { frames: 17, peak: 88 },
    backDash: { frames: 20, peak: 85 },
    jump: 1.11,
    drift: 0.97,
    landing: 3,
    sway: 1.11,
    roll: 0.97,
    range: [8, 12],
    guardRange: 16,
    reaction: 14,
  },
} as const satisfies Partial<Record<FighterId, CombatProfile>>

export const WAVE_THREE_MOVES = {
  beyond: {
    standingLight: physicalMove('Poing de masse', 'Weighted Fist', { recovery: 11, lunge: 0.68 }),
    standingHeavy: physicalMove('Épaule du géant', 'Giant Shoulder', { recovery: 16, lunge: 1.06 }),
    lowLight: physicalMove('Heurt au genou', 'Knee Check', { recovery: 11, lunge: 0.49 }),
    lowHeavy: physicalMove('Fauchage du col', 'Mountain Sweep', { recovery: 20, lunge: 1.0 }),
    forwardLight: physicalMove('Poing de déblai', 'Clearing Fist', { recovery: 12, lunge: 1.43 }),
    forwardHeavy: physicalMove('Charge à double appui', 'Braced Charge', {
      recovery: 24,
      lunge: 2.05,
    }),
    backHeavy: physicalMove('Contrepoids', 'Counterweight', {
      startup: 14,
      recovery: 24,
      lunge: 0.47,
    }),
    airLight: physicalMove('Poing en descente', 'Dropping Fist', { startup: 6, recovery: 11 }),
    airHeavy: physicalMove('Retombée des deux poings', 'Double-Fist Drop', {
      startup: 10,
      recovery: 20,
    }),
    throw: physicalMove('Le col du géant', 'The Giant’s Pass', { reach: 6.45 }),
    neutralSpecial: physicalMove('Choc des avant-bras', 'Forearm Clash', {
      recovery: 27,
      lunge: 1.05,
    }),
    forwardSpecial: physicalMove('Percée de tout le corps', 'Full-Body Breakthrough', {
      recovery: 27,
      lunge: 1.78,
    }),
    downSpecial: physicalMove('Marteau à bout portant', 'Close Hammer', {
      recovery: 24,
      lunge: 0.85,
    }),
    backSpecial: physicalMove('Reprise en force', 'Forceful Re-entry', {
      recovery: 28,
      lunge: 0.3,
    }),
  },
  padaille: {
    standingLight: physicalMove('Main de mesure', 'Gauging Hand', { recovery: 9, lunge: 0.3 }),
    standingHeavy: physicalMove('Marteau à main nue', 'Bare-Hand Hammer', {
      recovery: 18,
      lunge: 0.53,
    }),
    lowLight: physicalMove('Cale du pied avant', 'Lead-Foot Wedge', { recovery: 10, lunge: 0.15 }),
    lowHeavy: physicalMove('Pied-de-biche', 'Pry-Bar Sweep', { recovery: 19, lunge: 0.75 }),
    forwardLight: physicalMove('Percée du poing', 'Boring Fist', { recovery: 11, lunge: 1.45 }),
    forwardHeavy: physicalMove('Abattée de l’avant-bras', 'Felling Forearm', {
      recovery: 22,
      lunge: 1.44,
    }),
    backHeavy: physicalMove('Retour de la main libre', 'Free-Hand Return', {
      startup: 12,
      recovery: 23,
      lunge: -0.32,
    }),
    airLight: physicalMove('Main d’appui', 'Bracing Hand', { startup: 6, recovery: 10 }),
    airHeavy: physicalMove('Marteau en chute', 'Falling Hammer', { startup: 11, recovery: 19 }),
    throw: physicalMove('Le bras de levier', 'The Lever Arm', { reach: 6.15 }),
  },
  lynch: {
    standingLight: physicalMove('Question du poing arrière', 'Rear-Fist Question', {
      recovery: 8,
      lunge: 0.61,
    }),
    standingHeavy: physicalMove('Point final', 'Full Stop', { recovery: 14, lunge: 0.96 }),
    lowLight: physicalMove('Coup sous la garde', 'Under the Guard', { recovery: 9, lunge: 0.56 }),
    lowHeavy: physicalMove('Fauchage de poursuite', 'Pursuit Sweep', { recovery: 17, lunge: 0.98 }),
    forwardLight: physicalMove('Relance en direct', 'Straight Follow-up', {
      recovery: 9,
      lunge: 1.52,
    }),
    forwardHeavy: physicalMove('Percée au plexus', 'Body Breakthrough', {
      recovery: 18,
      lunge: 1.81,
    }),
    backHeavy: physicalMove('Contre à bout portant', 'Close-Range Counter', {
      startup: 11,
      recovery: 20,
      lunge: -0.14,
    }),
    airLight: physicalMove('Direct en passage', 'Passing Straight', { startup: 5, recovery: 9 }),
    airHeavy: physicalMove('Crochet du raccourci', 'Shortcut Hook', { startup: 9, recovery: 16 }),
    throw: physicalMove('Répondez donc', 'Answer Me', { reach: 5.95 }),
  },
  rihan: {
    standingLight: physicalMove('Écart de la main', 'Deflecting Hand', {
      recovery: 10,
      lunge: 0.14,
    }),
    standingHeavy: physicalMove('Coude à l’affût', 'Waiting Elbow', { recovery: 15, lunge: 0.39 }),
    lowLight: physicalMove('Sonde du pied', 'Foot Probe', { recovery: 9, lunge: 0.12 }),
    lowHeavy: physicalMove('Piège à l’appui', 'Tripping Snare', { recovery: 16, lunge: 0.51 }),
    forwardLight: physicalMove('Pas de confirmation', 'Confirming Step', {
      recovery: 10,
      lunge: 1.4,
    }),
    forwardHeavy: physicalMove('Arrêt du talon', 'Heel Stop', { recovery: 20, lunge: 1.25 }),
    backHeavy: physicalMove('Riposte à la faute', 'Mistake Punish', {
      startup: 12,
      recovery: 21,
      lunge: -1.05,
    }),
    airLight: physicalMove('Barrage du genou', 'Knee Screen', { startup: 5, recovery: 10 }),
    airHeavy: physicalMove('Talon d’interception', 'Intercepting Heel', {
      startup: 9,
      recovery: 17,
    }),
    throw: physicalMove('Le piège patient', 'The Patient Snare', { reach: 5.85 }),
  },
  basho: {
    standingLight: physicalMove('Premier vers', 'Opening Line', { recovery: 12, lunge: 0.25 }),
    standingHeavy: physicalMove('Vers de rupture', 'Breaking Line', { recovery: 17, lunge: 0.59 }),
    lowLight: physicalMove('Borne du pied avant', 'Lead-Foot Boundary', {
      recovery: 12,
      lunge: 0.33,
    }),
    lowHeavy: physicalMove('Balayage de la page', 'Page Sweep', { recovery: 18, lunge: 0.67 }),
    forwardLight: physicalMove('Frappe du trait bref', 'Short-Stroke Fist', {
      recovery: 11,
      lunge: 1.33,
    }),
    forwardHeavy: physicalMove('Talon de fermeture', 'Closing Heel', { recovery: 21, lunge: 1.41 }),
    backHeavy: physicalMove('Poing en retrait', 'Retreating Fist', {
      startup: 13,
      recovery: 22,
      lunge: -0.77,
    }),
    airLight: physicalMove('Poing en suspens', 'Suspended Fist', { startup: 6, recovery: 12 }),
    airHeavy: physicalMove('Talon du dernier vers', 'Final-Line Heel', {
      startup: 10,
      recovery: 18,
    }),
    throw: physicalMove('Le cinquième vers', 'The Fifth Line', { reach: 6.05 }),
  },
} satisfies Partial<Record<FighterId, Partial<Record<MoveSlot, PhysicalMove>>>>
