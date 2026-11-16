import type { FightStageId } from '../stages'
import type { FightState } from '../types'
import { fightFormat } from '../formats'
import { additionalStageSounds } from './stageAdditions'

export interface StageSoundProfile {
  identity: string
  floor: 'steel' | 'stone' | 'wood' | 'carpet'
  room: number
  wet: number
  noiseHz: number
  droneHz: number
  air: number
  motif: readonly number[]
  accent:
    'hull' | 'crowd' | 'crystal' | 'chips' | 'sea' | 'projector' | 'gavel' | 'ritual' | 'pipes'
}

const ORIGINAL_STAGE_SOUNDS = {
  'whale-hold': {
    identity: 'Coque, moteurs profonds et acier qui travaille',
    floor: 'steel',
    room: 2.8,
    wet: 0.3,
    noiseHz: 190,
    droneHz: 38,
    air: 0.026,
    motif: [0, 1, 7, -5, 0, 3, 1, -7],
    accent: 'hull',
  },
  'heavens-arena': {
    identity: 'Gradins, ring de pierre et percussions de duel',
    floor: 'stone',
    room: 1.8,
    wet: 0.2,
    noiseHz: 780,
    droneHz: 55,
    air: 0.02,
    motif: [0, 7, 10, 7, 0, 3, 5, -5],
    accent: 'crowd',
  },
  'banquet-hall': {
    identity: 'Boiseries, cristal lointain et valse suspendue',
    floor: 'wood',
    room: 1.9,
    wet: 0.24,
    noiseHz: 420,
    droneHz: 73.42,
    air: 0.012,
    motif: [0, 3, 7, 2, 0, -1, 5, 2],
    accent: 'crystal',
  },
  'vip-casino': {
    identity: 'Tapis feutré, jetons et mécanique du hasard',
    floor: 'carpet',
    room: 0.65,
    wet: 0.1,
    noiseHz: 1200,
    droneHz: 65.41,
    air: 0.009,
    motif: [0, 1, 7, 6, 3, 1, -2, -5],
    accent: 'chips',
  },
  'observation-deck': {
    identity: 'Vent marin, vagues et garde-corps vibrant',
    floor: 'steel',
    room: 0.25,
    wet: 0.04,
    noiseHz: 650,
    droneHz: 43.65,
    air: 0.032,
    motif: [0, 7, 9, 2, 0, 5, 2, -5],
    accent: 'sea',
  },
  'screening-room': {
    identity: 'Projecteur, bande mécanique et suspense étouffé',
    floor: 'carpet',
    room: 0.45,
    wet: 0.08,
    noiseHz: 950,
    droneHz: 49,
    air: 0.014,
    motif: [0, 1, 0, -6, -5, 1, -1, -7],
    accent: 'projector',
  },
  'supreme-court': {
    identity: 'Marbre, coups de bois et gravité judiciaire',
    floor: 'stone',
    room: 2.4,
    wet: 0.28,
    noiseHz: 280,
    droneHz: 58.27,
    air: 0.01,
    motif: [0, -5, 2, 0, 3, -2, 1, -7],
    accent: 'gavel',
  },
  'princes-burial-chamber': {
    identity: 'Pierre profonde, cloches rituelles et appareil funéraire',
    floor: 'stone',
    room: 3.8,
    wet: 0.38,
    noiseHz: 110,
    droneHz: 32.7,
    air: 0.018,
    motif: [0, 1, -5, -6, 0, 3, -1, -12],
    accent: 'ritual',
  },
  'heilly-hideout': {
    identity: 'Néons, tuyaux et huis clos industriel',
    floor: 'steel',
    room: 0.9,
    wet: 0.16,
    noiseHz: 1600,
    droneHz: 50,
    air: 0.016,
    motif: [0, 6, 1, -1, 0, 3, -5, -6],
    accent: 'pipes',
  },
} satisfies Record<string, StageSoundProfile>

export const STAGE_SOUNDS: Readonly<Record<FightStageId, StageSoundProfile>> = {
  ...ORIGINAL_STAGE_SOUNDS,
  ...additionalStageSounds(ORIGINAL_STAGE_SOUNDS),
}

/** A bounded pressure curve: elapsed time, danger, exchange and nearing the verdict. */
export function combatPressure(state: FightState): number {
  if (state.phase !== 'fighting') return 0
  const format = fightFormat(state.formatId)
  const elapsed = Math.min(1, state.frame / (90 * 60))
  const playerHealth = healthPercent(state.player, format.health)
  const opponentHealth = healthPercent(state.opponent, format.health)
  const danger = 1 - Math.min(playerHealth, opponentHealth) / 100
  const urgency = state.mode === 'training' ? 0 : Math.max(0, 1 - state.time / 30)
  const exchange = Math.min(1, Math.max(state.player.comboHits, state.opponent.comboHits) / 5)
  const lead = Math.min(1, Math.abs(playerHealth - opponentHealth) / 80)
  const score = Math.max(state.score.player, state.score.opponent) / (format.hitTarget ?? Infinity)
  const knockdowns =
    Math.max(state.knockdowns.player, state.knockdowns.opponent) /
    (format.knockdownTarget ?? Infinity)
  const verdict = Math.max(score, knockdowns)
  return Math.min(
    1,
    Math.max(
      0.12,
      0.12 +
        elapsed * 0.18 +
        danger * 0.26 +
        urgency * 0.4 +
        exchange * 0.12 +
        lead * 0.08 +
        verdict * 0.18,
    ),
  )
}

/** Works with both the format's reserve and a fighter's explicitly declared reserve. */
function healthPercent(fighter: { health: number; maxHealth?: number }, fallback: number): number {
  return (100 * fighter.health) / (fighter.maxHealth ?? fallback)
}

/** Mechanical ticks throughout a timed round, increasingly close to the deadline. */
export function clockSubdivision(time: number): number {
  if (time <= 5) return 15
  if (time <= 10) return 30
  if (time <= 30) return 60
  return 120
}
