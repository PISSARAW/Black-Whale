import { halkenburgBodySleep, halkenburgMindBody } from './halkenburgMindAccess'
import type { HalkenburgSoulExchange } from './halkenburgSoulTypes'
import type { ArcadeFighter, FightState } from './types'

export function normalizeHalkenburgWake(
  state: FightState,
  body: ArcadeFighter,
): HalkenburgSoulExchange {
  const soul = body.halkenburgSoul!
  const initiatorAwake = soul.initiatorAwake !== false && !halkenburgBodySleep(body)
  const donor = halkenburgMindBody(state, { host: soul.target.owner, role: 'victim', soul })
  const victimSleeps = soul.donor ? halkenburgBodySleep(donor) : false
  const victimAwake = !initiatorAwake && soul.victimAwake === true && !victimSleeps
  if (
    initiatorAwake === (soul.initiatorAwake !== false) &&
    victimAwake === (soul.victimAwake === true)
  )
    return soul
  return { ...soul, initiatorAwake, victimAwake, motion: 'stay', victimMotion: 'stay' }
}
