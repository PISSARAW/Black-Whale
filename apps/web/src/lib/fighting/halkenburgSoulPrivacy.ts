import { mapPhysicalBodies } from './physicalBodyMap'
import type { FightSide, FightState } from './types'
import { halkenburgMindCanWake } from './halkenburgMindAccess'
import type { HalkenburgSoulExchange, HalkenburgPassenger } from './halkenburgSoulTypes'

/** A falling body is visible; the exact consciousness drawn from the group is private. */
export function privateHalkenburgSouls(
  state: FightState,
  viewer: FightSide | null,
): FightState {
  const bodies = [
    state.player,
    state.opponent,
    ...(state.rosterGuests ?? []).map((entry) => entry.fighter),
    ...(state.teamMatch?.seats.player.members ?? []),
    ...(state.teamMatch?.seats.opponent.members ?? []),
  ]
  const visibleIdentities = new Set(
    viewer
      ? [
          state.halkSoulOrigins?.[viewer] ?? state[viewer].halkenburgOrigin ?? state[viewer].id,
          ...(state.teamMatch?.seats[viewer].roster ?? []),
          ...(state.halkSoulMinds ?? [])
            .filter((entry) => entry.mind.side === viewer)
            .flatMap((entry) => (entry.mind.identity ? [entry.mind.identity] : [])),
          ...(state.halkSoulLinks ?? []).flatMap((link) =>
            [link.sourceMind, link.targetMind]
              .filter((mind) => mind.side === viewer && mind.identity)
              .map((mind) => mind.identity!),
          ),
          ...bodies
            .filter((body) => body.halkRosterMind?.startsWith(`mind:${viewer}`))
            .map((body) => body.id),
        ]
      : [],
  )
  const privateGraphMind = <T extends { identity?: import('./types').FighterId }>(mind: T): T =>
    mind.identity && visibleIdentities.has(mind.identity)
      ? mind
      : { ...mind, identity: undefined }
  const privateState = mapPhysicalBodies(state, (body) => {
    const soul = body.halkenburgSoul
    const graph = body.halkSoul
    return {
      ...body,
      halkenburgSoul: soul && viewer ? privateSoul(state, soul, viewer) : undefined,
      halkenburgPassenger: viewer ? privatePassenger(body.halkenburgPassenger, viewer) : undefined,
      halkSoul: graph
        ? {
            ...graph,
            mind:
              graph.mind?.identity && visibleIdentities.has(graph.mind.identity)
                ? graph.mind
                : undefined,
          }
        : undefined,
      halkSedativeSpent: undefined,
    }
  })
  privateState.halkSoulLinks = privateState.halkSoulLinks?.map((link) => ({
    ...link,
    preparedSedative: viewer === link.owner ? link.preparedSedative : 0,
    sourceMind: privateGraphMind(link.sourceMind),
    targetMind: privateGraphMind(link.targetMind),
  }))
  privateState.halkSoulMinds = privateState.halkSoulMinds?.map((entry) => ({
    ...entry,
    mind: privateGraphMind(entry.mind),
  }))
  const field = privateState.battlefield
  // The caller supplies a private clone; retain the forecast's shared field reference.
  if (field)
    field.entities = field.entities.map((entry) => ({
      ...entry,
      halkenburgPassenger: privatePassenger(entry.halkenburgPassenger, viewer),
    }))
  return privateState
}

function privateSoul(
  state: FightState,
  soul: HalkenburgSoulExchange,
  viewer: FightSide,
): HalkenburgSoulExchange {
  const own = soul.owner === viewer
  const victim = soul.target.owner === viewer
  const seesBody = own || (victim && soul.victimAwake === true)
  return {
    ...soul,
    donor: seesBody ? soul.donor : undefined,
    motion: own ? soul.motion : undefined,
    victimMotion: victim ? soul.victimMotion : undefined,
    victimWakeReady: victim ? victimWakeReady(state, soul) : undefined,
  }
}
function victimWakeReady(state: FightState, soul: HalkenburgSoulExchange): boolean {
  return (
    soul.initiatorAwake === false &&
    halkenburgMindCanWake(state, {
      host: soul.target.owner,
      role: 'victim',
      soul,
    })
  )
}
function privatePassenger(passenger: HalkenburgPassenger | undefined, viewer: FightSide) {
  return passenger && passenger.owner !== viewer ? { ...passenger, motion: undefined } : passenger
}
