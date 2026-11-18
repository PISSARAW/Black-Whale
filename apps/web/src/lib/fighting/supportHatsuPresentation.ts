import { COOKIE_PIANO_FRAMES } from './cookie'
import { preparationSource } from './preparationRequirements'
import type { ArcadeFighter, FightSide, FightState } from './types'

export const SUPPORT_HATSU_FRAMES = 18
export interface SupportHatsuAccent {
  id: string
  source: 'bill' | 'cluck' | 'biscuit'
  kind: 'growth' | 'dispatch' | 'delivery' | 'treatment' | 'relief' | 'rest'
  owner: FightSide
  subject: string
  started: number
  age: number
}
function snapshot(state: FightState) {
  return {
    key: `${state.player.id}:${state.opponent.id}:${state.roundNumber}:${state.environment.stageId}`,
    frame: state.frame,
    entities: (state.battlefield?.entities ?? [])
      .filter((e) => e.present && e.health > 0 && e.material === 'real')
      .map((e) => ({
        id: e.id,
        kind: e.kind,
        owner: e.owner,
        growth: e.growth ?? 0,
        delivered: Boolean(e.delivered),
        controller: e.controller?.source === 'cluck' ? e.controller.side : undefined,
      })),
    actors: (['player', 'opponent'] as const).map((side) => {
      const f = state[side]
      return {
        side,
        aura: f.aura,
        sleeping: f.arsenalSleep?.cause === 'cookie' ? f.arsenalSleep.owner : undefined,
        cookie: f.cookie
          ? { target: f.cookie.target, mode: f.cookie.mode, frames: f.cookie.frames }
          : undefined,
      }
    }),
  }
}
type Snapshot = ReturnType<typeof snapshot>
type Signal = Omit<SupportHatsuAccent, 'id' | 'started' | 'age'>
type Entity = Snapshot['entities'][number]
type Session = NonNullable<Snapshot['actors'][number]['cookie']>
const actor = (snapshot: Snapshot, side: FightSide) => snapshot.actors.find((a) => a.side === side)!
function billExecution(fighter: ArcadeFighter) {
  const held = fighter.kurapika?.held
  return preparationSource(fighter) === 'bill' || (held?.source === 'bill' && held.used)
}
function growthSignal(old: Entity, next: Entity, state: FightState): Signal[] {
  if (next.kind !== 'seed' || next.growth <= old.growth) return []
  const owner = (['player', 'opponent'] as const).find(
    (side) => billExecution(state[side]) && (next.owner === side || next.owner === 'neutral'),
  )
  return owner ? [{ source: 'bill', kind: 'growth', owner, subject: next.id }] : []
}
function birdSignals(old: Entity, next: Entity): Signal[] {
  if (next.kind !== 'bird') return []
  const signals: Signal[] = []
  if (next.controller && next.controller !== old.controller)
    signals.push({ source: 'cluck', kind: 'dispatch', owner: next.controller, subject: next.id })
  if (next.delivered && !old.delivered && old.controller)
    signals.push({ source: 'cluck', kind: 'delivery', owner: old.controller, subject: next.id })
  return signals
}
function changes(before: Snapshot, next: Snapshot, state: FightState): Signal[] {
  const signals: Signal[] = []
  for (const e of next.entities) {
    const old = before.entities.find((p) => p.id === e.id)
    if (old) signals.push(...growthSignal(old, e, state), ...birdSignals(old, e))
  }
  for (const { side } of next.actors) signals.push(...cookieChanges(before, next, side))
  return signals
}
function sessionStarted(old: Session | undefined, session: Session) {
  return (
    !old ||
    old.target !== session.target ||
    old.mode !== session.mode ||
    session.frames < old.frames
  )
}
function treatmentKind(before: Snapshot, next: Snapshot, side: FightSide) {
  const old = actor(before, side).cookie
  const session = actor(next, side).cookie!
  if (sessionStarted(old, session)) return 'treatment'
  if (
    session.mode === 'massage' &&
    session.frames > old!.frames &&
    session.frames % 60 === 0 &&
    actor(next, session.target).aura > actor(before, session.target).aura
  )
    return 'relief'
  return null
}
function restCompleted(before: Snapshot, next: Snapshot, side: FightSide) {
  const old = actor(before, side).cookie
  if (!old || old.mode !== 'piano' || old.frames < COOKIE_PIANO_FRAMES - 1) return false
  const target = actor(next, old.target),
    previous = actor(before, old.target)
  return (
    previous.sleeping === side &&
    target.sleeping === undefined &&
    previous.aura < target.aura &&
    target.aura === 100
  )
}
function cookieChanges(before: Snapshot, next: Snapshot, side: FightSide): Signal[] {
  const session = actor(next, side).cookie
  if (session) {
    const kind = treatmentKind(before, next, side)
    return kind ? [{ source: 'biscuit', kind, owner: side, subject: session.target }] : []
  }
  return restCompleted(before, next, side)
    ? [
        {
          source: 'biscuit',
          kind: 'rest',
          owner: side,
          subject: actor(before, side).cookie!.target,
        },
      ]
    : []
}
function available(event: SupportHatsuAccent, next: Snapshot) {
  if (next.frame - event.started >= SUPPORT_HATSU_FRAMES) return false
  if (event.source === 'biscuit') {
    const session = next.actors.find((a) => a.side === event.owner)?.cookie
    return event.kind === 'rest' || session?.target === event.subject
  }
  const e = next.entities.find((e) => e.id === event.subject)
  return Boolean(
    e &&
    (event.kind === 'growth'
      ? e.growth > 0
      : event.kind === 'delivery'
        ? e.delivered
        : e.controller === event.owner),
  )
}
/** Observe confirmed support facts. Drawing never advances growth, flight or recovery. */
export function createSupportHatsuClock() {
  let previous: Snapshot | null = null
  let held: SupportHatsuAccent[] = []
  return (state: FightState): SupportHatsuAccent[] => {
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
    for (const signal of changes(previous, next, state))
      held.push({
        ...signal,
        id: `${signal.owner}:${signal.kind}:${signal.subject}:${next.frame}`,
        started: next.frame,
        age: 0,
      })
    previous = next
    held = held.filter((e) => available(e, next)).slice(-12)
    return held.map((e) => ({ ...e, age: next.frame - e.started }))
  }
}
