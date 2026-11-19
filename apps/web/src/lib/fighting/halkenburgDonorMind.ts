import { updateEntity } from './preparationWorld'
import { changeDolphinBody } from './dolphinBodies'
import { poseFighter } from './fightActorPose'
import type { HalkenburgSoulExchange } from './halkenburgSoulTypes'
import type { FightState, ArcadeFighter } from './types'

/** The displaced victim occupies the initiating member's original body. */
export function reconcileHalkenburgDonor(
  state: FightState,
  soul: HalkenburgSoulExchange,
): FightState {
  const donor = soul.donor
  if (!donor) return state
  if (donor.kind === 'supporter') return reconcileSupporter(state, soul)
  return changeDolphinBody(state, donor, (body) => donorMindBody(body, soul))
}
function victimAwake(soul: HalkenburgSoulExchange): boolean {
  return soul.initiatorAwake === false && soul.victimAwake === true
}
function passenger(soul: HalkenburgSoulExchange) {
  return { id: soul.id, owner: soul.target.owner, motion: soul.victimMotion }
}
function donorMindBody(body: ArcadeFighter, soul: HalkenburgSoulExchange): ArcadeFighter {
  const awake = victimAwake(soul)
  return poseFighter({
    ...body,
    attack: null,
    blocking: false,
    pose: awake ? (body.halkenburgSleeping === soul.id ? 'idle' : body.pose) : 'down',
    halkenburgSleeping: awake ? undefined : soul.id,
    halkenburgPassenger: awake ? passenger(soul) : undefined,
  })
}
function reconcileSupporter(state: FightState, soul: HalkenburgSoulExchange): FightState {
  const donor = soul.donor
  if (donor?.kind !== 'supporter') return state
  const awake = victimAwake(soul)
  const body = state.battlefield?.entities.find((entry) => entry.id === donor.id)
  return updateEntity(state, donor.id, {
    sleepingFrames: awake ? 0 : Math.max(1, body?.sleepingFrames ?? 0),
    halkenburgSleeping: awake ? undefined : soul.id,
    halkenburgPassenger: awake ? passenger(soul) : undefined,
  })
}
