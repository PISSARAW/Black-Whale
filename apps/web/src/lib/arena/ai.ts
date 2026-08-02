import { readAura } from '../combat/perception'
import { STRIKE_RANGE } from '../combat/resolve'
import { combatReducer } from '../combat/reducer'
import { BODY_ZONES, type BodyZone, type CombatState } from '../combat/types'

const THINK_EVERY = 0.45
export type ArenaDifficulty = 'initiate' | 'fighter' | 'master'
export const DIFFICULTY_CADENCE: Record<ArenaDifficulty, number> = {
  initiate: 0.68,
  fighter: THINK_EVERY,
  master: 0.3,
}

export type OpponentDoctrine = 'counter' | 'binder' | 'artillery'

export const OPPONENT_DOCTRINES: Record<
  OpponentDoctrine,
  { name: string; hatsu: 'enhance' | 'bind' | 'barrage' }
> = {
  counter: { name: 'Le Contreur', hatsu: 'enhance' },
  binder: { name: "L'Entraveuse", hatsu: 'bind' },
  artillery: { name: "L'Artilleur", hatsu: 'barrage' },
}

export function advanceArena(
  state: CombatState,
  dt: number,
  doctrine: OpponentDoctrine = 'counter',
  difficulty: ArenaDifficulty = 'fighter',
): CombatState {
  const ticked = rememberObservedStrike(combatReducer(state, { type: 'TICK', dt }))
  if (ticked.outcome !== 'playing') return ticked
  const cadence = DIFFICULTY_CADENCE[difficulty]
  if (Math.floor(ticked.clock / cadence) === Math.floor(state.clock / cadence)) return ticked
  return decide(ticked, doctrine, cadence)
}

function decide(state: CombatState, doctrine: OpponentDoctrine, cadence: number): CombatState {
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
  if (shouldCastHatsu(state, doctrine, gap)) {
    return combatReducer(state, {
      type: 'HATSU',
      side: 'opponent',
      effect: OPPONENT_DOCTRINES[doctrine].hatsu,
      zone: openZone(state.player.guard, Math.floor(state.clock / THINK_EVERY)),
    })
  }
  if (gap > STRIKE_RANGE - 0.2) {
    const weave = Math.floor(state.clock / 2) % 2 === 0 ? 0.42 : -0.42
    return combatReducer(state, {
      type: 'MOVE',
      side: 'opponent',
      vector: [delta[0] - delta[1] * weave, delta[1] + delta[0] * weave],
    })
  }

  let current = combatReducer(state, { type: 'MOVE', side: 'opponent', vector: [0, 0] })
  const playerReading = readAura(state.opponent, state.player)
  if (playerReading.feintZone) {
    current = combatReducer(current, {
      type: 'RYU',
      side: 'opponent',
      guard: playerReading.feintZone,
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
  const learned = learnedGuard(current)
  if (learned && Math.floor(current.clock / cadence) % 2 === 0) {
    current = combatReducer(current, { type: 'RYU', side: 'opponent', guard: learned })
  }
  const zone = openZone(reading.guard, Math.floor(current.clock / cadence))

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

function rememberObservedStrike(state: CombatState): CombatState {
  const event = state.lastEvent
  if (
    !event ||
    event.attacker !== 'player' ||
    event.at === state.opponentMemory.observedEventAt ||
    (state.player.in && !state.opponent.gyo)
  )
    return state
  return {
    ...state,
    opponentMemory: {
      observedEventAt: event.at,
      zones: {
        ...state.opponentMemory.zones,
        [event.zone]: state.opponentMemory.zones[event.zone] + 1,
      },
    },
  }
}

function learnedGuard(state: CombatState): BodyZone | null {
  const entries = BODY_ZONES.map((zone) => [zone, state.opponentMemory.zones[zone]] as const)
  const best = entries.reduce((current, candidate) =>
    candidate[1] > current[1] ? candidate : current,
  )
  return best[1] > 0 ? best[0] : null
}

function shouldCastHatsu(state: CombatState, doctrine: OpponentDoctrine, gap: number): boolean {
  if (state.opponent.aura < 34 || Math.floor(state.clock / THINK_EVERY) % 7 !== 0) return false
  if (doctrine === 'binder') return gap <= 7 && state.player.bound <= 0
  if (doctrine === 'artillery') return gap > STRIKE_RANGE && gap <= 9
  return state.opponent.empowered <= 0
}

function openZone(guard: BodyZone | null, turn: number): BodyZone {
  const open = guard ? BODY_ZONES.filter((zone) => zone !== guard) : BODY_ZONES
  return open[turn % open.length]
}
