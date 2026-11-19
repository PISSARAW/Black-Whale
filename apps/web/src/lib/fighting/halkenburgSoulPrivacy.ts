import { mapPhysicalBodies } from './physicalBodyMap'
import type { FightSide, FightState } from './types'
import { halkenburgMindCanWake } from './halkenburgMindAccess'
import type { HalkenburgSoulExchange, HalkenburgPassenger } from './halkenburgSoulTypes'

/** A falling body is visible; the exact consciousness drawn from the group is private. */
export function privateHalkenburgSouls(state: FightState, viewer: FightSide): FightState {
  const privateState = mapPhysicalBodies(state, (body) => {
    const soul = body.halkenburgSoul
    return {
      ...body,
      halkenburgSoul: soul ? privateSoul(state, soul, viewer) : undefined,
      halkenburgPassenger: privatePassenger(body.halkenburgPassenger, viewer),
    }
  })
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
