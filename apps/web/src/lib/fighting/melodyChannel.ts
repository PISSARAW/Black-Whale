import { FIXED_STEP } from './fightClock'
import {
  canHear,
  melodyCanPerform,
  melodyPageActive,
  MELODY_AURA_PER_SECOND,
  MELODY_MUSIC_RANGE,
  soundDistance,
} from './melodyRules'
import type { ArcadeFighter, FightInput, FightSide, FightState } from './types'

const SIDES = ['player', 'opponent'] as const

export function stopMelodyMusic(state: FightState, side: FightSide): FightState {
  const fighter = state[side]
  return reconcileMelodySound({ ...state, [side]: { ...fighter, melodyPerformance: undefined } })
}

/** A real change of posture or a guard/ear-cover input interrupts the breath. */
export function melodyInput(fighter: ArcadeFighter, input: FightInput): ArcadeFighter {
  const coveringEars = Boolean(input.coverEars)
  const moving =
    input.left || input.right || input.jump || input.down || input.guard || coveringEars
  return {
    ...fighter,
    coveringEars,
    melodyPerformance: moving ? undefined : fighter.melodyPerformance,
  }
}

export function advanceMelodyMusic(state: FightState): FightState {
  const advanced = {
    ...state,
    player: advancePerformance(state.player),
    opponent: advancePerformance(state.opponent),
  }
  // Two simultaneous performers can distract one another. Resolve from the
  // same snapshot, without giving either simulation side priority.
  const distracted = { ...advanced }
  for (const side of SIDES) {
    if (advanced[side].melodyPerformance && hearsPerformance(advanced, side))
      distracted[side] = { ...advanced[side], melodyPerformance: undefined }
  }
  return reconcileMelodySound(distracted)
}

function advancePerformance(fighter: ArcadeFighter): ArcadeFighter {
  const music = fighter.melodyPerformance
  if (!music) return fighter
  if (!performanceValid(fighter)) return { ...fighter, melodyPerformance: undefined }
  if (music.startupFrames > 0)
    return { ...fighter, melodyPerformance: { ...music, startupFrames: music.startupFrames - 1 } }
  const cost = MELODY_AURA_PER_SECOND * FIXED_STEP
  if (fighter.aura < cost) return { ...fighter, melodyPerformance: undefined }
  return {
    ...fighter,
    aura: Math.max(0, fighter.aura - cost),
    melodyPerformance: { ...music, playingFrames: music.playingFrames + 1 },
  }
}

function performanceValid(fighter: ArcadeFighter): boolean {
  return (
    melodyCanPerform(fighter) &&
    melodyPageActive(fighter) &&
    fighter.hitStun === 0 &&
    fighter.blockStun === 0 &&
    fighter.knockdownFrames === 0 &&
    fighter.attack === null &&
    Math.abs(fighter.x - fighter.melodyPerformance!.originX) < 0.01
  )
}

function hearsPerformance(state: FightState, side: FightSide): boolean {
  const listener = state[side]
  const performer = state[side === 'player' ? 'opponent' : 'player']
  return Boolean(
    performer.melodyPerformance?.startupFrames === 0 &&
    performanceValid(performer) &&
    canHear(listener) &&
    soundDistance(performer, listener) <= MELODY_MUSIC_RANGE,
  )
}

/** Also run after impacts: a projectile interrupt ends the sound in that same frame. */
export function reconcileMelodySound(state: FightState): FightState {
  const live = state.phase === 'fighting'
  const clean = { ...state }
  for (const side of SIDES) {
    const fighter = state[side]
    if (fighter.melodyPerformance && (!live || !performanceValid(fighter)))
      clean[side] = { ...fighter, melodyPerformance: undefined }
  }
  for (const side of SIDES) {
    const fighter = clean[side]
    const entranced = live && hearsPerformance(clean, side)
    clean[side] = {
      ...fighter,
      hatsuEffects: { ...fighter.hatsuEffects, entrancedFrames: Number(entranced) },
      ...(entranced ? { attack: null, bufferedAttack: null, blocking: false } : {}),
    }
  }
  return clean
}
