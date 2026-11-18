import { readyCohort, updateEntity } from './preparationWorld'
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
    state[side].halkenburgSleeping ||
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
  if (state[target].halkenburgSoul || state[target].halkenburgSleeping) return state
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
  return sleepSoulDonor(occupied, exchange)
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

function sleepSoulDonor(state: FightState, exchange: HalkenburgSoulExchange): FightState {
  const donor = exchange.donor
  if (!donor) return state // A private opponent view contains the manifestation, not the chosen mind.
  if (donor.kind === 'supporter')
    return updateEntity(state, donor.id, { sleepingFrames: 1, halkenburgSleeping: exchange.id })
  const member = state.teamMatch?.seats[donor.owner].active ?? 0
  if (member !== donor.member) return state
  const body = state[donor.owner]
  return {
    ...state,
    [donor.owner]: {
      ...body,
      attack: null,
      blocking: false,
      pose: 'down' as const,
      halkenburgSleeping: exchange.id,
    },
  }
}

/** No duel timer restores a displaced consciousness or wakes its original body. */
export function reconcileHalkenburgSouls(state: FightState): FightState {
  const exchanges: HalkenburgSoulExchange[] = []
  const held = mapPhysicalBodies(state, (body) => {
    if (!body.halkenburgSoul) return body
    exchanges.push(body.halkenburgSoul)
    return holdHalkenburgHost(body)
  })
  return exchanges.reduce(sleepSoulDonor, held)
}
function holdHalkenburgHost(body: ArcadeFighter): ArcadeFighter {
  if (body.hatsuEffects.possessedFrames === 1 && !body.attack && !body.blocking) return body
  return {
    ...body,
    attack: null,
    blocking: false,
    hatsuEffects: { ...body.hatsuEffects, possessedFrames: 1 },
  }
}
