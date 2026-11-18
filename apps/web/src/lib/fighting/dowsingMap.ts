import { accessibleArenaMap, visibleArenaMap, canUseArenaMap } from './arenaMap'
import { documentById } from './paperDocuments'
import { dowsingBodyReady, dowsingHandReady, ownsDowsing } from './dowsingRules'
import { mappedBody, pointOnArenaMap, knownMapSubjects } from './dowsingMapBody'
import { judgmentActionBreach } from './judgmentAction'
import { triggerHatsuAction } from './hatsu'
import { sameGumSource, type GumSource } from './bungeeSource'
import { DOWSING_COST, DOWSING_MOVE } from './dowsingTypes'
import { DOWSING_MAP_FRAMES, type DowsingMapSearch } from './dowsingMapTypes'
import type { FightSide, FightState } from './types'

export { DOWSING_MAP_FRAMES } from './dowsingMapTypes'

/** Ch. 95: a real map and an identified search subject; ordinary Dowsing does not require Emperor Time. */
export function performMapDowsing(state: FightState, side: FightSide, key?: string): FightState {
  const actor = state[side]
  if (!mapBodyReady(state, side) || actor.dowsingMapSearch || actor.aura < DOWSING_COST)
    return state
  const known = knownMapSubjects(actor).find((entry) => entry.bodyKey === key)
  const map = accessibleArenaMap(state, side)
  if (!known || !map || !mappedBody(state, known.bodyKey)) return state
  const breach = judgmentActionBreach({
    state,
    side,
    kind: 'special',
    moveId: DOWSING_MOVE,
    auraCharged: false,
  })
  if (breach) return breach
  const witnessed = triggerHatsuAction({ state, side, source: 'kurapika', moveId: DOWSING_MOVE })
  return {
    ...witnessed,
    [side]: {
      ...witnessed[side],
      aura: actor.aura - DOWSING_COST,
      dowsingMapPose: { mapId: map.id },
      dowsingMapSearch: {
        phase: 'searching',
        mapId: map.id,
        bodyKey: known.bodyKey,
        appearance: known.appearance,
        startedAt: state.frame,
        remainingFrames: DOWSING_MAP_FRAMES,
        origin: mapOrigin(actor),
      },
    },
  }
}

function mapBodyReady(state: FightState, side: FightSide): boolean {
  return (
    ownsDowsing(state[side]) &&
    dowsingBodyReady(state[side]) &&
    dowsingHandReady(state, side) &&
    !state[side].dowsingSession
  )
}

export function stopMapDowsing(state: FightState, side: FightSide): FightState {
  return state[side].dowsingMapSearch
    ? {
        ...state,
        [side]: { ...state[side], dowsingMapSearch: undefined, dowsingMapPose: undefined },
      }
    : state
}

export function advanceMapDowsing(state: FightState): FightState {
  let next = state
  for (const side of ['player', 'opponent'] as const) next = advanceSearch(next, side)
  return next
}

function advanceSearch(state: FightState, side: FightSide): FightState {
  const search = state[side].dowsingMapSearch
  if (!search) return state
  if (!mapSearchFocus(state, side, search)) return stopMapDowsing(state, side)
  const remainingFrames = search.remainingFrames - 1
  if (remainingFrames <= 0 && search.phase === 'reading') return stopMapDowsing(state, side)
  return remainingFrames > 0
    ? { ...state, [side]: { ...state[side], dowsingMapSearch: { ...search, remainingFrames } } }
    : finishSearch(state, side, search)
}

function mapSearchFocus(state: FightState, side: FightSide, search: DowsingMapSearch): boolean {
  if (!mapBodyReady(state, side) || !sameGumSource(search.origin, mapOrigin(state[side])))
    return false
  const map = documentById(state, search.mapId)
  return Boolean(map && canUseArenaMap(state, side, map))
}

function finishSearch(state: FightState, side: FightSide, search: DowsingMapSearch): FightState {
  const entry = documentById(state, search.mapId)
  const plan = entry && visibleArenaMap(state, entry)
  const body = mappedBody(state, search.bodyKey)
  if (!plan || !body) return stopMapDowsing(state, side)
  const point = pointOnArenaMap(plan, body)
  return {
    ...state,
    [side]: {
      ...state[side],
      dowsingMapSearch: { ...search, phase: 'reading', remainingFrames: 90 },
      dowsingMapPose: { mapId: search.mapId, point },
      dowsingMapReading: {
        mapId: search.mapId,
        bodyKey: search.bodyKey,
        appearance: search.appearance,
        frame: state.frame,
        round: state.roundNumber,
        map: { ...plan },
        point,
      },
    },
  }
}

function mapOrigin(actor: FightState['player']): GumSource {
  return { source: (actor.nenOwner ?? actor.id) === 'chrollo' ? 'book' : 'personal' }
}
