import { performMove, tickFight } from './engine'
import { attackPhase } from './frameData'
import { privatePvpState } from './pvp/view'
import { EMPTY_INPUT, type FightSide, type FightState, type FightImpact } from './types'

/** A bounded what-if on the perceived view. The opponent takes no new action.
 * A positive result is a practice suggestion, never a guaranteed optimal response. */
export function probeRecoveryResponse(source: FightState, side: FightSide): number | null {
  const perceived = privatePvpState(source, side)
  let state: FightState = {
    ...perceived,
    frameAccumulator: 0,
    mode: 'versus-local',
    training: undefined,
    pvpSeat: undefined,
  }
  state = performMove({ state, side: 'player', action: 'light' })
  if (!state.player.attack) return null
  const sequence = state.impact?.sequence
  for (let frame = 1; frame <= 18; frame++) {
    if (attackPhase(state.opponent) !== 'recovery') return null
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT, ai: false })
    const hit = state.impact
    if (hit && hit.sequence !== sequence) return successfulPunish(hit) ? frame : null
  }
  return null
}

function successfulPunish(hit: FightImpact) {
  return (
    hit.attacker === 'player' && hit.punish && !hit.blocked && !hit.avoided && !hit.invulnerable
  )
}
