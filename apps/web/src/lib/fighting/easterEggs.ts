import { easterEggSecretReady } from './easterEggSecrets'
export { easterEggSecretReady } from './easterEggSecrets'
import { canAct } from './fightActorState'
import { fightAcceptsCommands } from './fightOutcome'
import { futureAcceptsMove } from './parallelFutureAbility'
import { easterEggDefinition, type EasterEggSlot, eggBit } from './easterEggCatalogue'
import { STILL_MOTION } from './fighterMovement'
import type { ArcadeFighter, FightSide, FightState } from './types'

export interface EasterEggPlayback {
  slot: EasterEggSlot
  frame: number
  duration: number
  startedAt: number
}

/** Side-aware admission for UI commands which bypass the ordinary attack dispatcher. */
export function runOutsideEasterEgg(
  state: FightState,
  side: FightSide,
  action: (state: FightState) => FightState,
): FightState {
  return state[side].easterEgg ? state : action(state)
}

export function canPerformEasterEgg(
  state: FightState,
  side: FightSide,
  slot: EasterEggSlot,
): boolean {
  const fighter = state[side]
  return Boolean(
    easterEggDefinition(fighter.id, slot) &&
    fightAcceptsCommands(state) &&
    state.hitstop === 0 &&
    futureAcceptsMove(state, side) &&
    canAct(fighter) &&
    bodyAtRest(fighter) &&
    (slot !== 4 || easterEggSecretReady(state, side)),
  )
}

function bodyAtRest(fighter: ArcadeFighter): boolean {
  return ![
    fighter.attack,
    fighter.y,
    fighter.velocityY,
    fighter.blocking,
    fighter.wakeupInvulnerableFrames,
    fighter.motion?.dash,
    fighter.motion?.prejumpFrames,
    fighter.motion?.landingFrames,
    fighter.melodyPerformance,
    fighter.hanzoProjection,
    fighter.parallelEyesClosed,
    fighter.coveringEars,
    fighter.cyclotronWindup,
    fighter.preparationRecovery,
    fighter.bloodyMary?.infusion,
    fighter.hatsuEffects.possessedFrames,
    fighter.hatsuEffects.manipulatedFrames,
  ].some(Boolean)
}

function sceneInterrupted(state: FightState, body: ArcadeFighter): boolean {
  return [
    !fightAcceptsCommands(state),
    !canAct(body),
    body.y !== 0,
    body.attack,
    body.hatsuEffects.possessedFrames,
    body.hatsuEffects.manipulatedFrames,
  ].some(Boolean)
}

export function performEasterEgg(
  state: FightState,
  side: FightSide,
  slot: EasterEggSlot,
): FightState {
  if (!canPerformEasterEgg(state, side, slot)) return state
  const fighter = state[side]
  const definition = easterEggDefinition(fighter.id, slot)!
  return {
    ...state,
    [side]: {
      ...fighter,
      easterEgg: { slot, frame: 0, duration: definition.frames, startedAt: state.frame },
      pose: 'idle',
      blocking: false,
      crouching: false,
      guardFrames: 0,
      bufferedAttack: null,
      motion: { ...STILL_MOTION },
    },
  }
}

/** Run once per real simulation frame, after damage. No wall clock, RNG or browser storage. */
export function advanceEasterEggs(state: FightState, elapsed = true): FightState {
  let next = state
  for (const side of ['player', 'opponent'] as const) {
    const fighter = next[side]
    const egg = fighter.easterEgg
    if (!egg) continue
    // Remove only the scene to ask the ordinary combat availability rules about the body.
    const body = { ...fighter, easterEgg: undefined }
    if (sceneInterrupted(next, body)) {
      next = { ...next, [side]: { ...body, easterEggSequence: 0 } }
      continue
    }
    if (next.hitstop > 0 || !elapsed) continue
    next = { ...next, [side]: advancePlayback(fighter) }
  }
  return next
}

function advancePlayback(fighter: ArcadeFighter): ArcadeFighter {
  const egg = fighter.easterEgg!
  const frame = egg.frame + 1
  if (frame < egg.duration) return { ...fighter, easterEgg: { ...egg, frame } }
  const sequence = fighter.easterEggSequence ?? 0
  return {
    ...fighter,
    easterEgg: undefined,
    easterEggDiscoveries: (fighter.easterEggDiscoveries ?? 0) | eggBit(egg.slot),
    easterEggSequence: egg.slot === 1 ? 1 : egg.slot === sequence + 1 ? egg.slot : 0,
    pose: 'idle',
  }
}
