import { resolveFightOutcome } from '../fightOutcome'
import type { DuelInputs } from '../duelStep/types'
import type { FightState } from '../types'
import { aiKameoCall } from './ai'
import { resolveAllKameoContacts, resolveNearerKameoContacts } from './contacts'
import { advanceKameos, kameoCall } from './runtime'
import type { KameoCalls } from './runtime'

/**
 * Kameo phase of a frame, after the bodies settle: calls, stays, support effects, then
 * strikes a nearer kameo takes in its leader's place. Without kameos the state is
 * returned untouched, so an ordinary duel is unchanged.
 */
export function stepKameoFrame(state: FightState, inputs: DuelInputs): FightState {
  if (!state.kameos) return state
  return resolveNearerKameoContacts(advanceKameos(state, framesCalls(state, inputs)))
}

function framesCalls(state: FightState, inputs: DuelInputs): KameoCalls {
  if (state.deathMatch) return {}
  const opponent = inputs.opponent
    ? kameoCall(inputs.opponent, state.opponent.facing)
    : state.mode === 'versus-ai'
      ? aiKameoCall(state, 'opponent')
      : undefined
  return { player: kameoCall(inputs.player, state.player.facing), opponent }
}

/**
 * Kameo contacts left after the main pair: a kameo still in reach of a strike that
 * missed its leader. A strike already spent on another body cannot land again.
 */
export function resolveKameoFrameContacts(state: FightState): FightState {
  if (!state.kameos) return state
  const struck = resolveAllKameoContacts(state)
  return struck === state ? state : resolveFightOutcome(struck)
}
