import { kurapikaChainMotions } from './kurapikaChainMotion'
import type { FightSide, FightState } from './types'

export const CHAIN_ACCENT_FRAMES = 18
export const KURAPIKA_MAJOR_FRAMES = 84
export const CHAIN_ACCENT_COLOURS = [0xcce9ff, 0x91dfff, 0xd9edff, 0xf6d775, 0xe65c75] as const
export const chainEase = (value: number) => {
  const t = Math.min(1, Math.max(0, value))
  return t * t * (3 - 2 * t)
}
export const KURAPIKA_EVENTS = ['emperor', 'jail', 'drain', 'steal', 'judgment', 'heal'] as const
type Event = (typeof KURAPIKA_EVENTS)[number]
export type KurapikaFrames = Record<Event, number | null> & { accents: Array<number | null> }
const SIDES = ['player', 'opponent'] as const
function attackSnapshot(self: FightState['player']) {
  return {
    health: self.health,
    heal: self.attack?.moveId === 'kurapika:downSpecial',
    move: self.attack?.moveId,
    attackFrame: self.attack?.frame ?? -1,
  }
}
function actorSnapshot(state: FightState, side: FightSide) {
  const self = state[side]
  const target = state[side === 'player' ? 'opponent' : 'player']
  return {
    emperor: Boolean(self.kurapika?.emperorTime),
    jail: target.chainJail?.owner === side,
    drain: target.drainingChain?.owner === side,
    steal: self.kurapika?.held?.moveId ?? '',
    judgment: target.judgmentChain?.owner === side,
    ...attackSnapshot(self),
    chains: kurapikaChainMotions(state, side).map(
      (motion) => `${motion.stage}:${motion.mode}:${motion.returning ? 'return' : 'out'}`,
    ),
  }
}
function snapshot(state: FightState) {
  return {
    key: `${state.player.id}:${state.opponent.id}:${state.roundNumber}:${state.environment.stageId}`,
    frame: state.frame,
    phase: state.phase,
    player: actorSnapshot(state, 'player'),
    opponent: actorSnapshot(state, 'opponent'),
  }
}
type Actor = ReturnType<typeof actorSnapshot>
type Snapshot = ReturnType<typeof snapshot>
const emptyFrames = (): KurapikaFrames => ({
  emperor: null,
  jail: null,
  drain: null,
  steal: null,
  judgment: null,
  heal: null,
  accents: [null, null, null, null, null],
})
function resets(previous: Snapshot, next: Snapshot) {
  return (
    previous.key !== next.key ||
    next.frame < previous.frame ||
    (next.phase === 'ready' && previous.phase !== 'ready')
  )
}
function eventChanged(event: Event, before: Actor, after: Actor) {
  if (event === 'heal') return after.heal && after.health > before.health
  return Boolean(after[event]) && after[event] !== before[event]
}
function eventActive(event: Event, actor: Actor) {
  return event === 'heal' || Boolean(actor[event])
}
function age(start: number | null, frame: number, duration: number) {
  return start !== null && frame - start < duration ? frame - start : null
}
function updateActor(before: Actor, after: Actor, timing: { frame: number; held: KurapikaFrames }) {
  const { frame, held } = timing
  const result = emptyFrames()
  for (const event of KURAPIKA_EVENTS) {
    if (!eventActive(event, after)) held[event] = null
    if (eventChanged(event, before, after)) held[event] = frame
    result[event] = age(
      held[event],
      frame,
      event === 'heal' ? CHAIN_ACCENT_FRAMES : KURAPIKA_MAJOR_FRAMES,
    )
  }
  const freshAttack =
    after.move && (before.move !== after.move || after.attackFrame < before.attackFrame)
  for (const chain of after.chains) {
    const stage = Number(chain[0])
    if (freshAttack || !before.chains.includes(chain)) held.accents[stage] = frame
  }
  result.accents = held.accents.map((start) => age(start, frame, CHAIN_ACCENT_FRAMES))
  return result
}

/** Scalar render-local observations never add a gameplay condition or advance the duel. */
export function createKurapikaPresentationClock(initial?: FightState) {
  let previous = initial ? snapshot(initial) : null
  let held = { player: emptyFrames(), opponent: emptyFrames() }
  return (state: FightState): Record<FightSide, KurapikaFrames> => {
    const next = snapshot(state)
    if (!previous) previous = next
    if (next.phase !== 'fighting') {
      held = { player: emptyFrames(), opponent: emptyFrames() }
      previous = next
      return { player: emptyFrames(), opponent: emptyFrames() }
    }
    if (resets(previous, next)) {
      held = { player: emptyFrames(), opponent: emptyFrames() }
      previous = next
    }
    const result = { player: emptyFrames(), opponent: emptyFrames() }
    for (const side of SIDES)
      result[side] = updateActor(previous[side], next[side], {
        frame: next.frame,
        held: held[side],
      })
    previous = next
    return result
  }
}
