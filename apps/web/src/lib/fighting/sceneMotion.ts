import type { HumanPose } from '$lib/tour/humanAnimation'
import type { HumanFigure } from '$lib/tour/humanFigure'
import { attackProgress } from './frameData'
import { jumpProgress } from './fighterMovement'
import { physicalRosterPair } from './fightPhysicalRoster'
import { KO_DURATION } from './fightMoves'
import type { ArcadeFighter, FightSide, FighterPose } from './types'

export interface FighterSceneAnimation {
  side: FightSide
  model: HumanFigure
  seconds: number
}

export const FIGHT_MODEL_POSES: Record<FighterPose, HumanPose> = {
  idle: 'idle',
  walk: 'idle',
  jump: 'idle',
  guard: 'idle',
  light: 'idle',
  heavy: 'idle',
  special: 'idle',
  ranged: 'idle',
  hit: 'idle',
  down: 'idle',
  wakeup: 'idle',
  ko: 'idle',
}

/**
 * Presentation timing of the 2D duel: how long each pose change blends, how far
 * through its pose a fighter is, how fast the legs cycle and how the camera
 * eases. None of it touches the rules.
 */

/** A strike or a hit reads on its first frame; locomotion may ease. */
const SNAP_POSES: ReadonlySet<FighterPose> = new Set(['light', 'heavy', 'special', 'ranged', 'hit'])
const SLOW_POSES: ReadonlySet<FighterPose> = new Set(['down', 'ko', 'wakeup'])

export function transitionSecondsFor(fighter: ArcadeFighter): number {
  // Roster plans own their continuity, including the first frame of a rebuilt Nen model.
  if (physicalRosterPair(fighter.id, fighter.id)) return 0
  if (fighter.attack?.kind === 'light' || fighter.attack?.kind === 'ranged') return 0.008
  if (SNAP_POSES.has(fighter.pose)) return 0.016
  if (SLOW_POSES.has(fighter.pose)) return 0.12
  return 0.07
}

export function poseProgress(
  fighter: ArcadeFighter,
  { seconds, started }: { seconds: number; started: number },
): number {
  if (fighter.pose === 'jump') return jumpProgress(fighter)
  if (fighter.pose === 'hit') return clamp01(1 - fighter.hitStun / 26)
  if (fighter.pose === 'down') return clamp01(1 - fighter.knockdownFrames / 42)
  if (fighter.pose === 'wakeup') return clamp01(1 - fighter.wakeupInvulnerableFrames / 18)
  if (fighter.pose === 'ko') return Math.min(1, (seconds - started) / (KO_DURATION * 1.35))
  return attackProgress(fighter)
}

/** Stride seconds per world unit walked: one full step every ~1.2 world units. */
const STRIDE_PER_UNIT = 0.42

/**
 * Advances each fighter's walk cycle by the ground it actually covered, signed
 * by its facing, so a backward walk plays the stride in reverse and a dash
 * spins the legs faster instead of letting the feet slide.
 */
export function createStrideClocks(): (side: FightSide, x: number, facing: -1 | 1) => number {
  const clocks: Record<FightSide, { x: number | null; clock: number }> = {
    player: { x: null, clock: 0 },
    opponent: { x: null, clock: 0 },
  }
  return (side, x, facing) => {
    const held = clocks[side]
    const step = held.x === null ? 0 : x - held.x
    // A sparse render can cover several units even at ordinary walking speed.
    // Only a large reposition (reset/teleport) should discard the travelled stride.
    if (Math.abs(step) <= 12) held.clock += step * facing * STRIDE_PER_UNIT
    held.x = x
    return held.clock
  }
}

/** Share of the gap an exponential ease closes in `dt` — the same feel at 60 or 120 Hz. */
export function easeFactor(rate: number, dt: number): number {
  return 1 - Math.exp(-rate * dt)
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}
