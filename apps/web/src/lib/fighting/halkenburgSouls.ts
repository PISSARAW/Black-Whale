import { readyCohort } from './preparationWorld'
import { reconcileHalkenburgDonor } from './halkenburgDonorMind'
import { halkenburgOwnBody } from './halkenburgSoulTypes'
import { normalizeHalkenburgWake } from './halkenburgWakeState'
import { poseFighter } from './fightActorPose'
import { paperBodyRef } from './paperDocuments'
import { mapPhysicalBodies } from './physicalBodyMap'
import { physicalBodyKey } from './fightBodyIdentity'
import { wakeHanzoBody } from './hanzoProjection'
import type { HalkenburgSoulBody, HalkenburgSoulExchange } from './halkenburgSoulTypes'
import type { FightSide, FightState, ArcadeFighter } from './types'

/** The initiator is part of the random group, as shown when Halkenburg himself is selected. */
export function halkenburgSoulPool(state: FightState, side: FightSide): HalkenburgSoulBody[] {
  const supporters: HalkenburgSoulBody[] = readyCohort(state, side).map((entry) => ({
    kind: 'supporter',
    id: entry.id,
  }))
  if (
    state[side].id !== 'halkenburg' ||
    !halkenburgOwnBody(state[side]) ||
    state.rosterGuestContext?.owner === side
  )
    return supporters
  return [{ kind: 'fighter', ...paperBodyRef(state, side) }, ...supporters]
}

export function beginHalkenburgSoulExchange(
  state: FightState,
  side: FightSide,
  target: FightSide,
): FightState {
  const donor = state[side].halkenburgChosenSoul
  if (!halkenburgOwnBody(state[target])) return state
  if (!donor || !soulDonorPresent(state, side, donor)) return state
  const exchange: HalkenburgSoulExchange = {
    id: `halkenburg:${halkenburgSourceId(state, side)}:${state.frame}`,
    owner: side,
    donor,
    target: paperBodyRef(state, target),
    stage: 'exchanged',
  }
  const host = wakeHanzoBody(state[target])
  const occupied = {
    ...state,
    [target]: {
      ...host,
      attack: null,
      blocking: false,
      halkenburgSoul: exchange,
      hatsuEffects: { ...host.hatsuEffects, possessedFrames: 1 },
    },
  }
  return reconcileHalkenburgDonor(occupied, exchange)
}

function halkenburgSourceId(state: FightState, side: FightSide): string {
  return state.rosterGuestContext?.owner === side
    ? state.rosterGuestContext.id
    : physicalBodyKey(state, side)
}

function soulDonorPresent(state: FightState, side: FightSide, donor: HalkenburgSoulBody): boolean {
  return halkenburgSoulPool(state, side).some((entry) =>
    entry.kind === 'supporter'
      ? donor.kind === 'supporter' && donor.id === entry.id
      : donor.kind === 'fighter' && donor.owner === entry.owner && donor.member === entry.member,
  )
}

/** No duel timer restores a displaced consciousness or wakes its original body. */
export function reconcileHalkenburgSouls(state: FightState): FightState {
  const exchanges: HalkenburgSoulExchange[] = []
  const held = mapPhysicalBodies(state, (body) => {
    if (!body.halkenburgSoul) return body
    const soul = normalizeHalkenburgWake(state, body)
    exchanges.push(soul)
    return holdHalkenburgHost(
      soul === body.halkenburgSoul ? body : { ...body, halkenburgSoul: soul },
    )
  })
  return exchanges.reduce(reconcileHalkenburgDonor, held)
}
function holdHalkenburgHost(body: ArcadeFighter): ArcadeFighter {
  const soul = body.halkenburgSoul!
  const asleep = soul.initiatorAwake === false
  const sleeping = asleep ? soul.id : undefined
  if (
    body.hatsuEffects.possessedFrames === 1 &&
    !body.attack &&
    !body.blocking &&
    body.halkenburgSleeping === sleeping
  )
    return body
  return poseFighter({
    ...body,
    attack: null,
    blocking: false,
    halkenburgSleeping: sleeping,
    pose: asleep ? 'down' : body.halkenburgSleeping === soul.id ? 'idle' : body.pose,
    hatsuEffects: { ...body.hatsuEffects, possessedFrames: 1 },
  })
}
