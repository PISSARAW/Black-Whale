import { physicalBodyAt } from './fightBodyIdentity'
import { sleepingBody } from './hanzoProjection'
import type { ArcadeFighter, FightSide, FightState } from './types'
import type { PersonalEncounter } from './personalEncounters'
import type { ArenaMap } from './arenaMap'

/** The opaque identity denotes the encountered physical body, independent of later dress or relay. */
export function mappedBody(state: FightState, key: string) {
  const match = /^(player|opponent):(\d{1,2})$/.exec(key)
  if (!match) return undefined
  const canonical = match[1] as FightSide
  const side = state.pvpSeat === 'opponent' ? other(canonical) : canonical
  const body = physicalBodyAt(state, side, Number(match[2]))
  return body && sleepingBody(body)
}
const other = (side: FightSide): FightSide => (side === 'player' ? 'opponent' : 'player')

export function knownMapSubjects(actor: ArcadeFighter): PersonalEncounter[] {
  const bodies = new Map<string, PersonalEncounter>()
  for (const encounter of actor.personalEncounters ?? []) bodies.set(encounter.bodyKey, encounter)
  return [...bodies.values()]
}

/** The displayed point is on this piece of paper, never a location outside its represented area. */
export function pointOnArenaMap(map: ArenaMap, body: { x: number; y: number }) {
  if (body.x < map.left || body.x > map.right || body.y < map.bottom || body.y > map.top)
    return undefined
  return {
    x: (body.x - map.left) / (map.right - map.left),
    y: (body.y - map.bottom) / (map.top - map.bottom),
  }
}
