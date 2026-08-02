import { readAura } from '../combat/perception'
import { STRIKE_RANGE } from '../combat/resolve'
import { combatReducer } from '../combat/reducer'
import { BODY_ZONES, type BodyZone, type CombatState } from '../combat/types'

const THINK_EVERY = 0.45

export const OPPONENT_DOCTRINE = 'Le Contreur'

export function advanceArena(state: CombatState, dt: number): CombatState {
  const ticked = combatReducer(state, { type: 'TICK', dt })
  if (ticked.outcome !== 'playing') return ticked
  if (Math.floor(ticked.clock / THINK_EVERY) === Math.floor(state.clock / THINK_EVERY))
    return ticked
  return decide(ticked)
}

function decide(state: CombatState): CombatState {
  const ai = state.opponent
  if (ai.condition !== 'ready') return state
  if (ai.intent) return state
  if (state.player.condition !== 'ready') {
    return combatReducer(state, { type: 'MOVE', side: 'opponent', vector: [0, 0] })
  }

  const delta = [
    state.player.position[0] - ai.position[0],
    state.player.position[1] - ai.position[1],
  ] as const
  const gap = Math.hypot(delta[0], delta[1])
  if (gap > STRIKE_RANGE - 0.2) {
    const weave = Math.floor(state.clock / 2) % 2 === 0 ? 0.42 : -0.42
    return combatReducer(state, {
      type: 'MOVE',
      side: 'opponent',
      vector: [delta[0] - delta[1] * weave, delta[1] + delta[0] * weave],
    })
  }

  let current = combatReducer(state, { type: 'MOVE', side: 'opponent', vector: [0, 0] })
  if (state.player.feint) {
    current = combatReducer(current, {
      type: 'RYU',
      side: 'opponent',
      guard: state.player.feint,
    })
    return combatReducer(current, { type: 'GUARD', side: 'opponent' })
  }
  if (state.player.ko) {
    return combatReducer(current, { type: 'KEN', side: 'opponent', on: true })
  }

  current = combatReducer(current, {
    type: 'GYO',
    side: 'opponent',
    on: current.opponent.aura > 24,
  })
  current = combatReducer(current, { type: 'MODE', side: 'opponent', mode: 'ren' })
  current = combatReducer(current, { type: 'KEN', side: 'opponent', on: false })
  const reading = readAura(current.opponent, current.player)
  const zone = openZone(reading.guard, Math.floor(current.clock / THINK_EVERY))

  if (current.player.recoveryWindow <= 0 && Math.floor(current.clock / THINK_EVERY) % 4 === 0) {
    return combatReducer(current, { type: 'FEINT', side: 'opponent', zone })
  }

  if (current.opponent.aura >= 35 && current.clock % 3 < THINK_EVERY) {
    return combatReducer(current, { type: 'KO', side: 'opponent', zone })
  }
  const hidden = Math.floor(current.clock / THINK_EVERY) % 6 === 3 && current.opponent.aura > 30
  current = combatReducer(current, { type: 'IN', side: 'opponent', on: hidden })
  return combatReducer(current, { type: 'PREPARE_STRIKE', side: 'opponent', zone })
}

function openZone(guard: BodyZone | null, turn: number): BodyZone {
  const open = guard ? BODY_ZONES.filter((zone) => zone !== guard) : BODY_ZONES
  return open[turn % open.length]
}
