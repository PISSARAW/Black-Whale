import { chrolloPageForMove } from './chrolloBook'
import type { FightSide, FightState } from './types'

export interface SunMoonSnapshot {
  key: string
  frame: number
  phase: FightState['phase']
  impact: number | undefined
  player: { marks: number; health: number }
  opponent: { marks: number; health: number }
}
export function sunMoonSnapshot(state: FightState): SunMoonSnapshot {
  const body = (side: FightSide) => ({
    marks:
      Number(state[side].hatsuEffects.sunMark > 0) + Number(state[side].hatsuEffects.moonMark > 0),
    health: state[side].health,
  })
  return {
    key: `${state.player.id}:${state.opponent.id}:${state.roundNumber}:${state.environment.stageId}`,
    frame: state.frame,
    phase: state.phase,
    impact: state.impact?.sequence,
    player: body('player'),
    opponent: body('opponent'),
  }
}
export function actualSunMoonAttack(state: FightState, side: FightSide): boolean {
  const fighter = state[side]
  return (
    fighter.attack?.hatsuSource === 'chrollo' &&
    chrolloPageForMove(fighter, fighter.attack.moveId) === 'sun-and-moon'
  )
}
export function confirmedSunMoonDetonation(
  before: SunMoonSnapshot,
  state: FightState,
  side: FightSide,
): boolean {
  const next = sunMoonSnapshot(state)
  if (before.key !== next.key || state.frame < before.frame || state.phase === 'ready') return false
  const target = side === 'player' ? 'opponent' : 'player'
  const consumed =
    before[target].marks > 0 &&
    next[target].marks === 0 &&
    next[target].health < before[target].health
  return consumed && freshSunMoonImpact(before, state, side)
}
function freshSunMoonImpact(before: SunMoonSnapshot, state: FightState, side: FightSide) {
  const impact = state.impact
  if (!impact || impact.sequence === before.impact || impact.attacker !== side) return false
  return (
    !impact.blocked && !impact.avoided && !impact.invulnerable && actualSunMoonAttack(state, side)
  )
}
export function decisiveSunMoon(state: FightState, side: FightSide): boolean {
  const target = side === 'player' ? 'opponent' : 'player'
  return (
    state.phase === 'finished' &&
    state.winner === side &&
    state.finishReason === 'knockout' &&
    state[target].health <= 0 &&
    !state.catsName &&
    !state.forecastSimulation &&
    state.mode !== 'training'
  )
}

/** Evidence is observed from real consecutive states, never guessed from a generic Chrollo win. */
export function createSunMoonVictoryWitness() {
  let previous: SunMoonSnapshot | null = null
  let confirmed: { key: string; frame: number; winner: FightSide } | null = null
  return (state: FightState): boolean => {
    const next = sunMoonSnapshot(state)
    if (previous && witnessReset(previous, next)) confirmed = null
    if (previous && state.winner !== null && state.winner !== 'draw') {
      const side = state.winner
      if (confirmedSunMoonDetonation(previous, state, side) && decisiveSunMoon(state, side))
        confirmed = { key: next.key, frame: next.frame, winner: side }
    }
    previous = next
    return witnessMatches(confirmed, next, state)
  }
}
interface Witness {
  key: string
  frame: number
  winner: FightSide
}
function witnessReset(previous: SunMoonSnapshot, next: SunMoonSnapshot) {
  return previous.key !== next.key || next.frame < previous.frame || next.phase === 'ready'
}
function witnessMatches(confirmed: Witness | null, next: SunMoonSnapshot, state: FightState) {
  return Boolean(
    confirmed &&
    confirmed.key === next.key &&
    confirmed.frame === next.frame &&
    confirmed.winner === state.winner &&
    decisiveSunMoon(state, confirmed.winner),
  )
}
