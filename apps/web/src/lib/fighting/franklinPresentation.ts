import { FRANKLIN_SHOT_INTERVAL, franklinNenAvailable, usesFranklinBarrage } from './franklinAttack'
import type { ArcadeFighter, FightSide, FightState } from './types'

export const FRANKLIN_ACCENT_FRAMES = 18
export const FRANKLIN_SHOT_ACCENT_FRAMES = 4
export interface FranklinFrames {
  start: number | null
  shots: Array<{ index: number; age: number }>
  count: number
}
interface Held {
  start: number | null
  shots: Array<{ index: number; frame: number }>
}
const empty = (): FranklinFrames => ({ start: null, shots: [], count: 0 })
const freshHeld = (): Held => ({ start: null, shots: [] })
function actor(fighter: ArcadeFighter) {
  return {
    barrage: usesFranklinBarrage(fighter),
    available: franklinNenAvailable(fighter),
    move: fighter.attack?.moveId ?? fighter.attack?.kind ?? '',
    frame: fighter.attack?.frame ?? -1,
    count: fighter.attack?.projectilesSpawned ?? 0,
  }
}
function snapshot(state: FightState) {
  return {
    key: `${state.player.id}:${state.opponent.id}:${state.roundNumber}:${state.environment.stageId}`,
    frame: state.frame,
    phase: state.phase,
    player: actor(state.player),
    opponent: actor(state.opponent),
  }
}
type Actor = ReturnType<typeof actor>
type Snapshot = ReturnType<typeof snapshot>
function reset(before: Snapshot, next: Snapshot) {
  return before.key !== next.key || next.frame < before.frame || next.phase !== 'fighting'
}
function newBarrage(old: Actor, next: Actor) {
  return old.move !== next.move || next.frame < old.frame || next.count < old.count
}
function observe(old: Actor, next: Actor, c: { held: Held; frame: number }): FranklinFrames {
  const { held, frame } = c
  if (!next.barrage || !next.available) {
    held.start = null
    held.shots = []
    return empty()
  }
  const fresh = newBarrage(old, next)
  if (fresh) {
    held.start = null
    held.shots = []
  }
  const before = fresh ? 0 : old.count
  for (let index = before; index < next.count; index++) {
    const emitted = frame - (next.count - 1 - index) * FRANKLIN_SHOT_INTERVAL
    held.shots.push({ index, frame: emitted })
    if (index === 0) held.start = emitted
  }
  held.shots = held.shots.filter((shot) => frame - shot.frame < FRANKLIN_SHOT_ACCENT_FRAMES)
  return {
    start: age(held.start, frame),
    shots: held.shots.map((shot) => ({ index: shot.index, age: frame - shot.frame })),
    count: next.count,
  }
}
function age(start: number | null, frame: number) {
  return start !== null && frame - start < FRANKLIN_ACCENT_FRAMES ? frame - start : null
}
/** Only an increased emission counter creates an accent. No button press, projectile survival or timer does. */
export function createFranklinPresentationClock() {
  let previous: Snapshot | null = null
  let held = { player: freshHeld(), opponent: freshHeld() }
  return (state: FightState): Record<FightSide, FranklinFrames> => {
    const next = snapshot(state)
    if (!previous || reset(previous, next)) {
      previous = next
      held = { player: freshHeld(), opponent: freshHeld() }
      return { player: empty(), opponent: empty() }
    }
    const shown = {
      player: observe(previous.player, next.player, { held: held.player, frame: next.frame }),
      opponent: observe(previous.opponent, next.opponent, {
        held: held.opponent,
        frame: next.frame,
      }),
    }
    previous = next
    return shown
  }
}

/** Same alternating physical-hand mapping as Franklin's ten native muzzle nodes. */
export function franklinShotHand(facing: 1 | -1, index: number): 'left' | 'right' {
  return (index % 2 === 0) === (facing === 1) ? 'left' : 'right'
}
