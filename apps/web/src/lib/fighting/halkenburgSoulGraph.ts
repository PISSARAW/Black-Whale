import { setSoulOccupant } from './halkenburgSoulTypes'
import type { HalkenburgMindState, HalkenburgSoulLink } from './halkenburgSoulTypes'
import type { SoulBodyRecord } from './halkenburgSoulBodies'
import type { FightState } from './types'

export function collectSoulMinds(
  state: FightState,
  bodies: SoulBodyRecord[],
): HalkenburgMindState[] {
  const minds = new Map((state.halkSoulMinds ?? []).map((item) => [item.mind.key, { ...item }]))
  for (const record of bodies) rememberBodyMind(minds, record)
  return [...minds.values()]
}
function rememberBodyMind(minds: Map<string, HalkenburgMindState>, record: SoulBodyRecord) {
  const { key, body } = record,
    mind = body.halkSoul?.mind
  if (!mind) return
  const previous = minds.get(mind.key)
  if (!previous) {
    minds.set(mind.key, { mind, body: key, priority: 0, sleep: 0, alive: body.health > 0 })
    return
  }
  // Only an untouched native body can have its own established post-mortem revival.
  if (!body.halkSoul?.linked && body.health > 0 && !previous.alive)
    minds.set(mind.key, { ...previous, alive: true })
}
export function exchangeSoulMinds(options: {
  state: FightState
  bodies: SoulBodyRecord[]
  source: SoulBodyRecord
  target: SoulBodyRecord
}): HalkenburgMindState[] {
  const { state, bodies, source, target } = options
  const minds = collectSoulMinds(state, bodies)
  const sourceKey = source.body.halkSoul!.mind!.key,
    targetKey = target.body.halkSoul!.mind!.key
  const priority = nextSoulPriority(minds)
  return minds.map((item) => {
    if (item.mind.key === sourceKey) return { ...item, body: target.key, priority, sleep: 0 }
    if (item.mind.key === targetKey) return { ...item, body: source.key, returnBody: target.key }
    return item
  })
}
export function settleSoulGraph(state: FightState, bodies: SoulBodyRecord[]): FightState {
  const minds = collectSoulMinds(state, bodies)
  let links = state.halkSoulLinks!.map((link) => ({ ...link }))
  for (const item of minds) links = settleMindDeath({ item, minds, bodies, links })
  const awake = awakeSoulKeys(minds, links, bodies)
  for (const record of bodies) placeBodyMind(record, minds, awake)
  return {
    ...state,
    halkSoulMinds: minds,
    halkSoulLinks: links.map((link) => linkPhase(link, bodies)),
  }
}
function nextSoulPriority(minds: HalkenburgMindState[]): number {
  return 1 + Math.max(0, ...minds.map((item) => item.priority))
}
function settleMindDeath(options: {
  item: HalkenburgMindState
  minds: HalkenburgMindState[]
  bodies: SoulBodyRecord[]
  links: HalkenburgSoulLink[]
}): HalkenburgSoulLink[] {
  const { item, minds, bodies, links } = options
  if (!item.alive || bodyLives(bodies, item.body)) return links
  if (!item.returnBody || !bodyLives(bodies, item.returnBody)) {
    item.alive = false
    return links
  }
  const prepared = [...links]
    .reverse()
    .find((link) => link.targetMind.key === item.mind.key && link.sourceBody === item.body)
  item.body = item.returnBody
  item.returnBody = undefined
  item.priority = nextSoulPriority(minds)
  item.sleep = Math.max(item.sleep, prepared?.preparedSedative ?? 0)
  return prepared
    ? links.map((link) => (link.id === prepared.id ? { ...link, preparedSedative: 0 } : link))
    : links
}
function bodyLives(bodies: SoulBodyRecord[], key: string): boolean {
  return (bodies.find((record) => record.key === key)?.body.health ?? 0) > 0
}
/** A connected chain has at most one awake mind: the explicit multi-hop game convention. */
function awakeSoulKeys(
  minds: HalkenburgMindState[],
  links: HalkenburgSoulLink[],
  bodies: SoulBodyRecord[],
): Set<string> {
  const groups = new Map(minds.map((item) => [item.mind.key, item.mind.key]))
  for (const link of links) {
    const from = groups.get(link.sourceMind.key),
      to = groups.get(link.targetMind.key)
    for (const [key, group] of groups) if (group === to && from) groups.set(key, from)
  }
  const winners = new Map<string, HalkenburgMindState>()
  for (const item of minds) {
    if (!mindCanWake(item, bodies)) continue
    const group = groups.get(item.mind.key)!,
      previous = winners.get(group)
    if (!previous || item.priority > previous.priority) winners.set(group, item)
  }
  return new Set([...winners.values()].map((item) => item.mind.key))
}
function mindCanWake(item: HalkenburgMindState, bodies: SoulBodyRecord[]): boolean {
  if (!item.alive || item.eliminated || item.sleep > 0) return false
  const body = bodies.find((record) => record.key === item.body)?.body
  return Boolean(body && body.health > 0 && !body.arsenalSleep && !body.kurapika?.blackoutFrames)
}
function placeBodyMind(record: SoulBodyRecord, minds: HalkenburgMindState[], awake: Set<string>) {
  if (!record.body.halkSoul?.linked) {
    retireUntouchedStock(record, minds)
    return
  }
  const occupants = minds.filter((item) => item.alive && item.body === record.key)
  occupants.sort(
    (a, b) =>
      Number(awake.has(b.mind.key)) - Number(awake.has(a.mind.key)) || b.priority - a.priority,
  )
  const chosen = occupants[0]
  record.body = setSoulOccupant(record.body, chosen?.mind, !chosen || !awake.has(chosen.mind.key))
}
function retireUntouchedStock(record: SoulBodyRecord, minds: HalkenburgMindState[]) {
  const mind = minds.find((item) => item.mind.key === record.body.halkSoul?.mind?.key)
  if (!mind?.eliminated || !record.body.halkSoul || record.body.health <= 0) return
  record.body = { ...record.body, halkSoul: { ...record.body.halkSoul, offstage: true } }
}
function linkPhase(link: HalkenburgSoulLink, bodies: SoulBodyRecord[]): HalkenburgSoulLink {
  if (!bodyLives(bodies, link.targetBody))
    return { ...link, phase: bodyLives(bodies, link.sourceBody) ? 'source-lost' : 'ended' }
  return { ...link, phase: bodyLives(bodies, link.sourceBody) ? 'swapped' : 'cohabiting' }
}
