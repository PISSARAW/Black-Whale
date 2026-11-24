import type { MoveTuning } from './movesetTypes'
import type { CombatProfile, PhysicalMove } from './physicalCombatProfiles'
import type { FighterId, MoveSlot } from './types'

export const WAVE_TWO_MOBILITY = {
  // Secret Window: keep the same sightline, move off it quickly if challenged.
  musse: {
    walk: 0.87,
    backWalk: 1.08,
    forwardDash: { frames: 13, peak: 82 },
    backDash: { frames: 14, peak: 112 },
    jump: 0.86,
    drift: 0.92,
    landing: 2,
    sway: 1.17,
    roll: 1.09,
    range: [10, 15],
    guardRange: 16,
    reaction: 10,
  },
  // Biohazard: use a wide step to get a hand on the target.
  hinrigh: {
    walk: 1.08,
    backWalk: 0.84,
    forwardDash: { frames: 19, peak: 100 },
    backDash: { frames: 17, peak: 83 },
    jump: 1.04,
    drift: 1.08,
    landing: 4,
    sway: 1.04,
    roll: 1.12,
    range: [6, 10],
    guardRange: 12,
    reaction: 12,
  },
  // Moonlight Act: set a distance, offer a hand and withdraw on her own terms.
  longhi: {
    walk: 0.93,
    backWalk: 1.12,
    forwardDash: { frames: 17, peak: 94 },
    backDash: { frames: 19, peak: 87 },
    jump: 1.12,
    drift: 0.89,
    landing: 3,
    sway: 1.27,
    roll: 0.91,
    range: [9, 14],
    guardRange: 15,
    reaction: 13,
  },
  // Door: abrupt entries and stops at a chosen line.
  voconte: {
    walk: 0.98,
    backWalk: 0.95,
    forwardDash: { frames: 12, peak: 119 },
    backDash: { frames: 12, peak: 101 },
    jump: 0.95,
    drift: 1.12,
    landing: 4,
    sway: 0.92,
    roll: 1.18,
    range: [8, 13],
    guardRange: 14,
    reaction: 11,
  },
  // Combo Master: short probes and a quick entry when the opponent commits.
  furykov: {
    walk: 1.14,
    backWalk: 0.9,
    forwardDash: { frames: 15, peak: 107 },
    backDash: { frames: 15, peak: 93 },
    jump: 1,
    drift: 0.98,
    landing: 2,
    sway: 1.09,
    roll: 1.02,
    range: [5, 9],
    guardRange: 10,
    reaction: 8,
  },
} as const satisfies Partial<Record<FighterId, CombatProfile>>

export function physicalMove(fr: string, en: string, tuning: Partial<MoveTuning>): PhysicalMove {
  return { names: [fr, en], tuning }
}

export const WAVE_TWO_MOVES = {
  musse: {
    standingLight: physicalMove('Main de sûreté', 'Safety Hand', { recovery: 9, lunge: 0.23 }),
    standingHeavy: physicalMove('Coude de couverture', 'Cover Elbow', {
      recovery: 14,
      lunge: 0.44,
    }),
    lowLight: physicalMove('Contrôle du poignet', 'Wrist Check', { recovery: 11, lunge: 0.2 }),
    lowHeavy: physicalMove('Balayage sous couvert', 'Covered Sweep', { recovery: 17, lunge: 0.52 }),
    forwardLight: physicalMove('Interception en ligne', 'Line Intercept', {
      recovery: 10,
      lunge: 1.35,
    }),
    forwardHeavy: physicalMove('Botte d’arrêt', 'Stop Kick', { recovery: 19, lunge: 1.15 }),
    backHeavy: physicalMove('Sortie de l’axe', 'Off the Line', {
      startup: 12,
      recovery: 22,
      lunge: -1.05,
    }),
    airLight: physicalMove('Parade du genou', 'Knee Check', { startup: 5, recovery: 9 }),
    airHeavy: physicalMove('Talonnade de repli', 'Falling Heel', { startup: 10, recovery: 16 }),
    throw: physicalMove('Le passage sous garde', 'Under Guard', { reach: 5.8 }),
  },
  hinrigh: {
    standingLight: physicalMove('Prise de contact', 'Contact Check', { recovery: 11, lunge: 0.63 }),
    standingHeavy: physicalMove('Crochet de rabattage', 'Turning Hook', {
      recovery: 17,
      lunge: 0.83,
    }),
    lowLight: physicalMove('Main à la hanche', 'Hip Check', { recovery: 10, lunge: 0.48 }),
    lowHeavy: physicalMove('Croche-pied en travers', 'Crossing Trip', { recovery: 19, lunge: 0.9 }),
    forwardLight: physicalMove('Main sur l’épaule', 'Shoulder Check', {
      recovery: 12,
      lunge: 1.48,
    }),
    forwardHeavy: physicalMove('Percée de l’épaule', 'Shoulder Entry', {
      recovery: 20,
      lunge: 1.8,
    }),
    backHeavy: physicalMove('Revers de dégagement', 'Clearing Backfist', {
      startup: 11,
      recovery: 23,
      lunge: 0.62,
    }),
    airLight: physicalMove('Paume en travers', 'Crossing Palm', { startup: 6, recovery: 11 }),
    airHeavy: physicalMove('Rabattage à deux bras', 'Two-Arm Takedown', {
      startup: 9,
      recovery: 19,
    }),
    throw: physicalMove('La poignée de main des Xi-Yu', 'The Xi-Yu Handshake', { reach: 6.4 }),
  },
  longhi: {
    standingLight: physicalMove('Main tendue', 'Proffered Hand', { recovery: 12, lunge: 0.37 }),
    standingHeavy: physicalMove('Clause de distance', 'Distance Clause', {
      recovery: 16,
      lunge: 0.66,
    }),
    lowLight: physicalMove('Borne basse', 'Low Boundary', { recovery: 12, lunge: 0.17 }),
    lowHeavy: physicalMove('Balayage de sortie', 'Exit Sweep', { recovery: 16, lunge: 0.63 }),
    forwardLight: physicalMove('Avance mesurée', 'Measured Advance', { recovery: 11, lunge: 1.25 }),
    forwardHeavy: physicalMove('Reprise des termes', 'Revised Terms', {
      recovery: 21,
      lunge: 1.27,
    }),
    backHeavy: physicalMove('Retrait de l’offre', 'Offer Withdrawn', {
      startup: 13,
      recovery: 21,
      lunge: -1.5,
    }),
    airLight: physicalMove('Paume de séparation', 'Disengaging Palm', { startup: 6, recovery: 10 }),
    airHeavy: physicalMove('Clôture du délai', 'Deadline', { startup: 11, recovery: 17 }),
    throw: physicalMove('La clause de sortie', 'Exit Clause', { reach: 5.9 }),
  },
  voconte: {
    standingLight: physicalMove('Contrôle du seuil', 'Threshold Check', {
      recovery: 8,
      lunge: 0.48,
    }),
    standingHeavy: physicalMove('Traverse de porte', 'Door Bar', { recovery: 15, lunge: 0.76 }),
    lowLight: physicalMove('Butée basse', 'Low Doorstop', { recovery: 9, lunge: 0.26 }),
    lowHeavy: physicalMove('Fermeture au ras du sol', 'Low Closure', { recovery: 18, lunge: 0.78 }),
    forwardLight: physicalMove('Franchissement sec', 'Quick Crossing', {
      recovery: 9,
      lunge: 1.52,
    }),
    forwardHeavy: physicalMove('Porte battante', 'Swinging Door', { recovery: 17, lunge: 1.62 }),
    backHeavy: physicalMove('Hors du chambranle', 'Out of the Doorway', {
      startup: 12,
      recovery: 20,
      lunge: -0.7,
    }),
    airLight: physicalMove('Genou au passage', 'Passing Knee', { startup: 5, recovery: 10 }),
    airHeavy: physicalMove('Verrou descendant', 'Dropping Bolt', { startup: 8, recovery: 20 }),
    throw: physicalMove('Après vous', 'After You', { reach: 6.1 }),
  },
  furykov: {
    standingLight: physicalMove('Sonde de la main avant', 'Lead-Hand Probe', {
      recovery: 8,
      lunge: 0.31,
    }),
    standingHeavy: physicalMove('Uppercut de lecture', 'Read Uppercut', {
      recovery: 15,
      lunge: 0.69,
    }),
    lowLight: physicalMove('Sonde du pied avant', 'Lead-Foot Probe', { recovery: 9, lunge: 0.34 }),
    lowHeavy: physicalMove('Balayage de la garde', 'Guard Sweep', { recovery: 17, lunge: 0.84 }),
    forwardLight: physicalMove('Direct du changement de garde', 'Switch-Stance Straight', {
      recovery: 10,
      lunge: 1.4,
    }),
    forwardHeavy: physicalMove('Contre du bras arrière', 'Rear-Hand Counter', {
      recovery: 17,
      lunge: 1.55,
    }),
    backHeavy: physicalMove('Contre sur le retrait', 'Pull Counter', {
      startup: 13,
      recovery: 22,
      lunge: -0.48,
    }),
    airLight: physicalMove('Direct en suspension', 'Jump Straight', { startup: 5, recovery: 9 }),
    airHeavy: physicalMove('Crochet plongeant', 'Diving Hook', { startup: 9, recovery: 16 }),
    throw: physicalMove('L’angle mort', 'The Blind Spot', { reach: 6.2 }),
    forwardSpecial: physicalMove('Lecture du flanc', 'Open-Side Read', {
      recovery: 24,
      lunge: 1.55,
    }),
    downSpecial: physicalMove('Contre au plexus', 'Body Counter', { recovery: 22, lunge: 0.66 }),
    backSpecial: physicalMove('Contre du pied arrière', 'Rear-Foot Counter', {
      recovery: 26,
      lunge: 0.34,
    }),
    finisher: physicalMove('Fin d’enchaînement', 'End of the Sequence', {
      recovery: 34,
      lunge: 1.65,
    }),
  },
} satisfies Partial<Record<FighterId, Partial<Record<MoveSlot, PhysicalMove>>>>
