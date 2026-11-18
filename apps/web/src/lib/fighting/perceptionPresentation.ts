import { secretWindowVisibleTo } from './secretWindow'
import { comboMasterMonitoring } from './comboMasterAvailability'
import { privateLynchReplies } from './lynchInterrogation'
import { ownsVisitHatsu } from './visitSceneKit'
import type { FightSide, FightState } from './types'

// Optional acquired feed metadata is presentation input, not a gameplay dependency.
export type PresentedSecretWindow = NonNullable<FightState['player']['secretWindow']> & {
  mode?: 'contact' | 'listening'
  words?: { frame: number }
}

export const PERCEPTION_ACCENT_FRAMES = 18
export interface PerceptionAccent {
  id: string
  source: 'musse' | 'sayird' | 'furykov' | 'lynch'
  kind: 'watch' | 'relay' | 'console' | 'alert' | 'read' | 'reply'
  owner: FightSide
  subject?: string
  started: number
  age: number
}
function musse(state: FightState, viewer: FightSide) {
  const feed: PresentedSecretWindow | undefined = state[viewer].secretWindow
  if (!feed || !secretWindowVisibleTo(state, viewer, viewer)) return { key: '', observation: '' }
  return {
    key: `${feed.attachedAt}:${feed.target}:${feed.mode}`,
    observation: `${feed.observation.action}:${feed.heard?.frame ?? feed.words?.frame ?? -1}`,
  }
}
function scouts(state: FightState, viewer: FightSide) {
  if (!ownsVisitHatsu(state[viewer], 'sayird')) return [] as string[]
  return (state.battlefield?.entities ?? [])
    .filter(
      (e) =>
        e.present &&
        e.health > 0 &&
        e.material === 'real' &&
        (e.kind === 'animal' || e.kind === 'bird') &&
        e.controller?.side === viewer &&
        e.controller.source === 'sayird',
    )
    .map((e) => e.id)
}
function consoleState(state: FightState, viewer: FightSide) {
  const fighter = state[viewer]
  const active = comboMasterMonitoring(fighter)
  const alert = active ? fighter.comboMaster?.alert : null
  return {
    active,
    alert: Boolean(alert),
    incoming: Boolean(alert?.incoming),
    readable: Boolean(alert?.signature),
    affected: alert?.affected.length ?? 0,
  }
}
function snapshot(state: FightState, viewer: FightSide) {
  const reply = privateLynchReplies(state, viewer).at(-1)
  return {
    key: `${viewer}:${state.player.id}:${state.opponent.id}:${state.roundNumber}:${state.environment.stageId}`,
    frame: state.frame,
    musse: musse(state, viewer),
    scouts: scouts(state, viewer),
    console: consoleState(state, viewer),
    reply: reply ? `${reply.frame}:${reply.questioner}:${reply.question}` : '',
  }
}
type Snapshot = ReturnType<typeof snapshot>
type Signal = Pick<PerceptionAccent, 'source' | 'kind' | 'subject'>
function changes(before: Snapshot, next: Snapshot): Signal[] {
  const signals: Signal[] = []
  if (next.musse.key) {
    if (before.musse.key !== next.musse.key) signals.push({ source: 'musse', kind: 'watch' })
    else if (before.musse.observation !== next.musse.observation)
      signals.push({ source: 'musse', kind: 'relay' })
  }
  for (const id of next.scouts)
    if (!before.scouts.includes(id)) signals.push({ source: 'sayird', kind: 'watch', subject: id })
  signals.push(...consoleChanges(before.console, next.console))
  if (next.reply && before.reply !== next.reply) signals.push({ source: 'lynch', kind: 'reply' })
  return signals
}
function consoleChanges(before: Snapshot['console'], next: Snapshot['console']): Signal[] {
  if (!next.active) return []
  const events: Signal[] = before.active ? [] : [{ source: 'furykov', kind: 'console' }]
  if (next.readable && !before.readable) events.push({ source: 'furykov', kind: 'read' })
  if (next.alert && (next.incoming !== before.incoming || next.affected !== before.affected))
    events.push({ source: 'furykov', kind: 'alert' })
  return events
}
function active(event: PerceptionAccent, next: Snapshot) {
  if (next.frame - event.started >= PERCEPTION_ACCENT_FRAMES) return false
  if (event.source === 'musse') return Boolean(next.musse.key)
  if (event.source === 'sayird') return next.scouts.includes(event.subject!)
  if (event.source === 'furykov')
    return next.console.active && (event.kind === 'console' || next.console.alert)
  return true
}
/** Read only the selected participant's acquired facts; never retain answers or signatures. */
export function createPerceptionClock() {
  let previous: Snapshot | null = null
  let held: PerceptionAccent[] = []
  return (state: FightState, viewer: FightSide): PerceptionAccent[] => {
    const next = snapshot(state, viewer)
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
    for (const signal of changes(previous, next))
      held.push({
        ...signal,
        owner: viewer,
        started: next.frame,
        age: 0,
        id: `${viewer}:${signal.source}:${signal.kind}:${signal.subject ?? ''}:${next.frame}`,
      })
    held = held.filter((event) => active(event, next)).slice(-12)
    previous = next
    return held.map((event) => ({ ...event, age: next.frame - event.started }))
  }
}
