import { CYCLOTRON_ROTATION_FRAMES, cyclotronNenActive } from './phinksCyclotron'
import {
  PHINKS_HIT_ACCENT_FRAMES,
  PHINKS_TURN_ACCENT_FRAMES,
  phinksAttackSnapshot,
  phinksChargedHits,
  cyclotronContactKeys,
} from './phinksAnimation'
import type { PhinksChargedHit } from './phinksAnimation'
import type { FightSide, FightState } from './types'

type Time = { started: number; age: number }
export type PhinksAccent = Time &
  (
    | { kind: 'turn'; id: string; owner: FightSide; turns: number }
    | (PhinksChargedHit & { kind: 'impact' })
  )
function snapshot(state: FightState) {
  return {
    key: `${state.player.id}:${state.opponent.id}:${state.roundNumber}:${state.environment.stageId}`,
    frame: state.frame,
    impact: state.impact?.sequence,
    cyclotronContacts: cyclotronContactKeys(state),
    actors: (['player', 'opponent'] as const).map((side) => ({
      ...phinksAttackSnapshot(state[side]),
      reserve: state[side].hatsuEffects.cyclotronTurns,
      available: cyclotronNenActive(state[side]),
    })),
  }
}
type Snapshot = ReturnType<typeof snapshot>
function completedTurns(before: Snapshot, next: Snapshot, index: number): PhinksAccent[] {
  const old = before.actors[index],
    actor = next.actors[index]
  if (!actor.available || actor.reserve <= old.reserve) return []
  const owner = index === 0 ? 'player' : 'opponent',
    events: PhinksAccent[] = []
  for (let turn = Math.max(old.reserve + 1, actor.reserve - 7); turn <= actor.reserve; turn++) {
    const started = next.frame - (actor.reserve - turn) * CYCLOTRON_ROTATION_FRAMES
    events.push({
      kind: 'turn',
      id: `${owner}:cyclotron-turn:${turn}:${started}`,
      owner,
      turns: turn,
      started,
      age: 0,
    })
  }
  return events
}
function live(event: PhinksAccent, next: Snapshot) {
  const limit = event.kind === 'turn' ? PHINKS_TURN_ACCENT_FRAMES : PHINKS_HIT_ACCENT_FRAMES
  if (next.frame - event.started >= limit) return false
  if (event.kind === 'impact') return true
  const actor = next.actors[event.owner === 'player' ? 0 : 1]
  return actor.available && actor.reserve >= event.turns
}
/** Count full completed turns, and read actual contacts without changing either charge or damage. */
export function createPhinksAnimationClock() {
  let previous: Snapshot | null = null
  let held: PhinksAccent[] = []
  return (state: FightState): PhinksAccent[] => {
    const next = snapshot(state)
    if (
      !previous ||
      previous.key !== next.key ||
      next.frame < previous.frame ||
      state.phase !== 'fighting'
    ) {
      previous = next
      held = []
      return []
    }
    held.push(...completedTurns(previous, next, 0), ...completedTurns(previous, next, 1))
    for (const hit of phinksChargedHits(state, previous))
      held.push({ ...hit, kind: 'impact', started: next.frame, age: 0 })
    previous = next
    held = held.filter((e) => live(e, next)).slice(-12)
    return held.map((e) => ({ ...e, age: next.frame - e.started }))
  }
}
