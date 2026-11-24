import { WAVE_SIX_MOBILITY, WAVE_SIX_MOVES } from './physicalCombatWaveSix'
import { WAVE_FIVE_MOBILITY, WAVE_FIVE_MOVES } from './physicalCombatWaveFive'
import { WAVE_FOUR_MOBILITY, WAVE_FOUR_MOVES } from './physicalCombatWaveFour'
import { WAVE_THREE_MOBILITY, WAVE_THREE_MOVES } from './physicalCombatWaveThree'
import { WAVE_TWO_MOBILITY, WAVE_TWO_MOVES } from './physicalCombatWaveTwo'
import type { FighterMoveset, MoveTuning } from './movesetTypes'
import type { FighterId, MoveSlot } from './types'

export type CombatProfile = {
  walk: number
  backWalk: number
  forwardDash: { frames: number; peak: number }
  backDash: { frames: number; peak: number }
  jump: number
  drift: number
  landing: number
  sway: number
  roll: number
  range: readonly [number, number]
  guardRange: number
  reaction: number
}

const PROFILES = {
  // Cross Game: hold a boundary and intercept anyone who crosses it.
  mizaistom: {
    walk: 0.96,
    backWalk: 0.76,
    forwardDash: { frames: 15, peak: 88 },
    backDash: { frames: 14, peak: 76 },
    jump: 0.92,
    drift: 0.91,
    landing: 3,
    sway: 0.9,
    roll: 0.94,
    range: [8, 13],
    guardRange: 17,
    reaction: 11,
  },
  // Damage: Sweet Home: plant, get into hand range, then drive through contact.
  terebellum: {
    walk: 0.87,
    backWalk: 0.65,
    forwardDash: { frames: 21, peak: 94 },
    backDash: { frames: 17, peak: 63 },
    jump: 0.88,
    drift: 0.82,
    landing: 5,
    sway: 0.8,
    roll: 0.85,
    range: [4, 8],
    guardRange: 11,
    reaction: 14,
  },
  // Delivery: cross the lane quickly, leave it just as quickly and vary height.
  cluck: {
    walk: 1.13,
    backWalk: 0.88,
    forwardDash: { frames: 16, peak: 111 },
    backDash: { frames: 15, peak: 104 },
    jump: 1.1,
    drift: 1.12,
    landing: 2,
    sway: 1.07,
    roll: 1.16,
    range: [8, 13],
    guardRange: 10,
    reaction: 12,
  },
  // Little Eye: small repositionings, then a direct entry once the lane is clear.
  sayird: {
    walk: 1.04,
    backWalk: 0.79,
    forwardDash: { frames: 12, peak: 106 },
    backDash: { frames: 13, peak: 86 },
    jump: 0.95,
    drift: 1.03,
    landing: 3,
    sway: 1.03,
    roll: 1.02,
    range: [6, 10],
    guardRange: 14,
    reaction: 9,
  },
  // Cat's Name: expose an opening on purpose, pull back and strike the commitment.
  camilla: {
    walk: 0.93,
    backWalk: 0.99,
    forwardDash: { frames: 18, peak: 81 },
    backDash: { frames: 16, peak: 106 },
    jump: 1.03,
    drift: 0.88,
    landing: 4,
    sway: 1.22,
    roll: 1.05,
    range: [10, 15],
    guardRange: 13,
    reaction: 11,
  },
} as const satisfies Partial<Record<FighterId, CombatProfile>>

type ProfiledFighter = keyof typeof PROFILES
const MOBILITY: Partial<Record<FighterId, CombatProfile>> = {
  ...PROFILES,
  ...WAVE_TWO_MOBILITY,
  ...WAVE_THREE_MOBILITY,
  ...WAVE_FOUR_MOBILITY,
  ...WAVE_FIVE_MOBILITY,
  ...WAVE_SIX_MOBILITY,
}

export function physicalCombatProfile(id: FighterId): CombatProfile | undefined {
  return MOBILITY[id]
}

export interface PhysicalMove {
  names: readonly [fr: string, en: string]
  tuning: Partial<MoveTuning>
}

function strike(fr: string, en: string, tuning: Partial<MoveTuning>): PhysicalMove {
  return { names: [fr, en], tuning }
}

const STRIKES: Record<ProfiledFighter, Partial<Record<MoveSlot, PhysicalMove>>> = {
  mizaistom: {
    standingLight: strike('Barrage de l’avant-bras', 'Forearm Check', {
      startup: 5,
      recovery: 7,
      damage: 6,
      reach: 9.4,
      targetZone: 'hands',
    }),
    standingHeavy: strike('Interception montante', 'Rising Intercept', {
      startup: 10,
      recovery: 16,
      damage: 14,
      reach: 13,
      targetZone: 'head',
    }),
    lowLight: strike('Arrêt du pied', 'Foot Check', { startup: 5, recovery: 9, reach: 9.1 }),
    lowHeavy: strike('Talon d’arrêt', 'Stopping Heel', {
      startup: 8,
      recovery: 24,
      damage: 10,
      reach: 10.7,
      lunge: 0.6,
    }),
    airLight: strike('Paume de barrage', 'Air Check', { startup: 5, recovery: 8, reach: 8.4 }),
    airHeavy: strike('Coude d’interception', 'Intercepting Elbow', {
      startup: 10,
      recovery: 18,
      reach: 9.2,
      auraZone: 'hands',
    }),
    forwardLight: strike('Marquer la ligne', 'Mark the Line', {
      startup: 6,
      recovery: 11,
      reach: 12,
      lunge: 1.3,
    }),
    forwardHeavy: strike('Refoulement', 'Pushback', {
      startup: 14,
      recovery: 24,
      damage: 16,
      reach: 16,
      lunge: 1.7,
      knockback: 7.5,
      auraZone: 'hands',
    }),
    backHeavy: strike('Coude de barrage', 'Barring Elbow', {
      startup: 8,
      recovery: 20,
      reach: 13,
      lunge: -1.6,
    }),
    throw: strike('Fin de la déposition', 'End of Deposition', { startup: 7, reach: 5.8 }),
  },
  terebellum: {
    standingLight: strike('Paume de réception', 'Receiving Palm', {
      startup: 6,
      recovery: 8,
      reach: 7.6,
      targetZone: 'hands',
    }),
    standingHeavy: strike('Marteau de renvoi', 'Return Hammer', {
      startup: 12,
      recovery: 20,
      damage: 16,
      reach: 11.6,
    }),
    lowLight: strike('Paume au genou', 'Knee Check', {
      startup: 6,
      recovery: 8,
      reach: 7.8,
      auraZone: 'hands',
    }),
    lowHeavy: strike('Crochet de cheville', 'Ankle Pick', {
      startup: 11,
      recovery: 19,
      damage: 13,
      reach: 9.6,
      auraZone: 'hands',
    }),
    airLight: strike('Crochet ramassé', 'Compact Hook', { startup: 6, recovery: 11, reach: 8.2 }),
    airHeavy: strike('Direct de tout le poids', 'Weighted Cross', {
      startup: 10,
      recovery: 18,
      damage: 17,
      reach: 9.7,
      auraZone: 'hands',
    }),
    forwardLight: strike('Pas de contact', 'Contact Step', {
      startup: 7,
      recovery: 11,
      reach: 11,
      lunge: 2.0,
    }),
    forwardHeavy: strike('Remontée du poing', 'Rising Return', {
      startup: 16,
      recovery: 25,
      damage: 21,
      reach: 12.4,
      lunge: 3.4,
      auraZone: 'hands',
    }),
    backHeavy: strike('Paume d’écartement', 'Separation Palm', {
      startup: 9,
      recovery: 16,
      damage: 14,
      reach: 10.6,
      lunge: -0.7,
    }),
    throw: strike('Le relais des paumes', 'Palm Relay', { startup: 8, reach: 6.3, damage: 18 }),
  },
  cluck: {
    standingLight: strike('Revers du bout des doigts', 'Fingertip Flick', {
      startup: 3,
      recovery: 6,
      damage: 5,
      reach: 8.7,
    }),
    standingHeavy: strike('Talon tournant', 'Turning Heel', {
      startup: 9,
      recovery: 18,
      damage: 11,
      reach: 12.1,
      auraZone: 'feet',
    }),
    lowLight: strike('Pique rasante', 'Skimming Jab', {
      startup: 4,
      recovery: 7,
      reach: 8.4,
      auraZone: 'hands',
    }),
    lowHeavy: strike('Arc de la semelle', 'Skimming Arc', {
      startup: 10,
      recovery: 15,
      damage: 9,
      reach: 11.7,
      lunge: 1.8,
    }),
    airLight: strike('Direct en passage', 'Passing Jab', { startup: 4, recovery: 6, reach: 10.5 }),
    airHeavy: strike('Talon en plein vol', 'Airborne Heel', {
      startup: 6,
      recovery: 12,
      damage: 12,
      reach: 12.8,
    }),
    forwardLight: strike('Pas de relais', 'Relay Step', {
      startup: 5,
      recovery: 8,
      reach: 10.8,
      lunge: 2.7,
    }),
    forwardHeavy: strike('Coupe en traversée', 'Crossing Cut', {
      startup: 12,
      recovery: 19,
      damage: 15,
      reach: 13.5,
      lunge: 4.0,
      auraZone: 'hands',
    }),
    backHeavy: strike('Talon de repli', 'Retreating Heel', {
      startup: 8,
      recovery: 13,
      damage: 10,
      reach: 12.0,
      lunge: -2.2,
      auraZone: 'feet',
    }),
    throw: strike('Sous l’aile', 'Underwing', { startup: 6, reach: 5.4, damage: 13 }),
    forwardSpecial: strike('Aile en traversée', 'Crossing Wing', {
      startup: 13,
      recovery: 22,
      lunge: 4.2,
      auraZone: 'hands',
    }),
    downSpecial: strike('Fauchage tournant', 'Turning Sweep', {
      startup: 11,
      recovery: 20,
      lunge: 1.6,
      auraZone: 'feet',
    }),
    backSpecial: strike('Talon de sortie', 'Exit Heel', {
      startup: 9,
      recovery: 21,
      lunge: -1.8,
      auraZone: 'feet',
    }),
    finisher: strike('Dernier relais', 'Last Relay', {
      startup: 15,
      recovery: 31,
      lunge: 3.3,
      auraZone: 'feet',
    }),
  },
  sayird: {
    standingLight: strike('Sonde de la main avant', 'Probing Jab', {
      startup: 4,
      recovery: 7,
      damage: 5,
      reach: 8.8,
    }),
    standingHeavy: strike('Direct du garde', 'Guard Cross', {
      startup: 9,
      recovery: 15,
      damage: 12,
      reach: 11.5,
    }),
    lowLight: strike('Pique au genou', 'Knee Thrust', {
      startup: 4,
      recovery: 9,
      reach: 8.9,
      auraZone: 'hands',
    }),
    lowHeavy: strike('Semelle d’arrêt', 'Low Stop Kick', {
      startup: 7,
      recovery: 20,
      reach: 10.9,
      lunge: 1.3,
    }),
    airLight: strike('Tranchant de la main', 'Knife-hand', { startup: 5, recovery: 9, reach: 9.2 }),
    airHeavy: strike('Poing vers le sol', 'Downward Punch', {
      startup: 8,
      recovery: 16,
      damage: 12,
      reach: 10.0,
      auraZone: 'hands',
    }),
    forwardLight: strike('Entrée en crochet', 'Entry Hook', {
      startup: 5,
      recovery: 10,
      reach: 10.7,
      lunge: 2.4,
    }),
    forwardHeavy: strike('Marteau de couverture', 'Covering Hammer', {
      startup: 13,
      recovery: 22,
      damage: 16,
      reach: 12.9,
      lunge: 2.3,
      auraZone: 'hands',
    }),
    backHeavy: strike('Direct de couverture', 'Covering Cross', {
      startup: 6,
      recovery: 17,
      reach: 11.4,
      lunge: -1.1,
    }),
    throw: strike('Hors du champ', 'Out of Sight', { startup: 7, reach: 5.6, damage: 15 }),
    forwardSpecial: strike('Percée de couverture', 'Covering Rush', {
      startup: 12,
      recovery: 23,
      lunge: 2.8,
      auraZone: 'hands',
    }),
    downSpecial: strike('Poing au genou', 'Knee Punch', {
      startup: 10,
      recovery: 21,
      lunge: 0.7,
      auraZone: 'hands',
    }),
    backSpecial: strike('Pique de couverture', 'Covering Thrust', {
      startup: 8,
      recovery: 22,
      lunge: -1.25,
      auraZone: 'hands',
    }),
    finisher: strike('Contre montant', 'Rising Counter', {
      startup: 15,
      recovery: 31,
      auraZone: 'hands',
    }),
  },
  camilla: {
    standingLight: strike('Gifle de dédain', 'Dismissive Slap', {
      startup: 5,
      recovery: 7,
      reach: 8.0,
    }),
    standingHeavy: strike('Paume impériale', 'Imperial Palm', {
      startup: 12,
      recovery: 21,
      damage: 14,
      reach: 10.7,
    }),
    lowLight: strike('Revers rasant', 'Low Backhand', {
      startup: 5,
      recovery: 10,
      reach: 8.2,
      auraZone: 'hands',
    }),
    lowHeavy: strike('Paume au genou', 'Knee Palm', {
      startup: 12,
      recovery: 19,
      damage: 10,
      reach: 9.9,
      auraZone: 'hands',
    }),
    airLight: strike('Pointe de la main', 'Fingertip Thrust', {
      startup: 6,
      recovery: 10,
      reach: 8.3,
    }),
    airHeavy: strike('Pointe du pied', 'Pointed Heel', { startup: 9, recovery: 17, reach: 11.8 }),
    forwardLight: strike('Gifle en passant', 'Passing Slap', {
      startup: 6,
      recovery: 11,
      reach: 11.6,
      lunge: 1.7,
    }),
    forwardHeavy: strike('Paume provocatrice', 'Provoking Palm', {
      startup: 16,
      recovery: 25,
      damage: 17,
      reach: 12.5,
      lunge: 2.4,
      auraZone: 'hands',
    }),
    backHeavy: strike('Revers de riposte', 'Riposte Slap', {
      startup: 6,
      recovery: 15,
      damage: 15,
      reach: 13.2,
      lunge: -2.5,
    }),
    throw: strike('L’audience est levée', 'Audience Dismissed', {
      startup: 8,
      reach: 5.9,
      damage: 16,
    }),
  },
}

const PHYSICAL_MOVES: Partial<Record<FighterId, Partial<Record<MoveSlot, PhysicalMove>>>> = {
  ...STRIKES,
  ...WAVE_TWO_MOVES,
  ...WAVE_THREE_MOVES,
  ...WAVE_FOUR_MOVES,
  ...WAVE_FIVE_MOVES,
  ...WAVE_SIX_MOVES,
}

export function tunePhysicalCombat(moveset: FighterMoveset): FighterMoveset {
  const strikes = PHYSICAL_MOVES[moveset.fighterId]
  if (!strikes) return moveset
  return {
    ...moveset,
    moves: moveset.moves.map((move) => {
      const strike = strikes[move.slot]
      if (!strike) return move
      const [nameFr, nameEn] = strike.names
      return { ...move, nameFr, nameEn, tuning: { ...move.tuning, ...strike.tuning } }
    }),
  }
}
