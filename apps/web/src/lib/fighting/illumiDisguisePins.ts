import { physicalBodyKey } from './fightBodyIdentity'
import { historicalPartExists } from './historicalCopyLifetime'
import { mapPhysicalBodies } from './physicalBodyMap'
import { freeDeviceHand } from './deviceHands'
import { clearIllumiFace } from './illumiDisguise'
import type { ArcadeFighter, FightSide, FightState } from './types'
import type { PreparedEntity } from './preparationTypes'

/** One physical assembly, without inventing a canonical number of Gittarackur needles. */
export interface DisguisePins {
  id: string
  mediumCopyId?: string
  velocityY?: number
}
declare module './types' {
  interface ArcadeFighter {
    illumiDisguisePins?: DisguisePins
  }
}
declare module './preparationTypes' {
  interface PreparedEntity {
    disguisePinBundle?: DisguisePins
  }
}

export function attachDisguisePins(
  state: FightState,
  side: FightSide,
  actor: ArcadeFighter,
): ArcadeFighter {
  if (state[side].illumi?.disguised || !actor.illumi?.disguised) return actor
  if (actor.illumi.disguiseMode === 'unpinned-hisoka' || actor.illumiDisguisePins) return actor
  const serial = (actor.illumiNeedleGeneration ?? 0) + 1
  return {
    ...actor,
    illumiNeedleGeneration: serial,
    illumiDisguisePins: {
      id: `disguise-pins:${physicalBodyKey(state, side)}:${serial}`,
      mediumCopyId: actor.illumi.mediumCopyId,
    },
  }
}

export function removeDisguisePins(state: FightState, side: FightSide): FightState {
  const actor = state[side],
    pins = actor.illumiDisguisePins
  if (!pins || !state.battlefield || !freeDeviceHand(state, side)) return state
  if (!historicalPartExists(state, pins.mediumCopyId)) return state
  const cleared = clearIllumiFace(actor)
  const entry: PreparedEntity = {
    id: `removed:${pins.id}`,
    kind: 'needles',
    owner: side,
    x: actor.x + actor.facing * 2,
    y: actor.y,
    present: true,
    health: 3,
    material: pins.mediumCopyId ? 'nen' : 'real',
    disguisePinBundle: pins,
  }
  return {
    ...state,
    [side]: { ...cleared, illumiDisguisePins: undefined },
    battlefield: { ...state.battlefield, entities: [...state.battlefield.entities, entry] },
  }
}

export function cleanDisguisePins(state: FightState): FightState {
  return mapPhysicalBodies(state, (actor) =>
    actor.illumiDisguisePins && !historicalPartExists(state, actor.illumiDisguisePins.mediumCopyId)
      ? { ...clearIllumiFace(actor), illumiDisguisePins: undefined }
      : actor,
  )
}

export function copiedDisguisePins(source: PreparedEntity, id: string): Partial<PreparedEntity> {
  return source.disguisePinBundle
    ? { health: source.health, disguisePinBundle: { id: `${id}:disguise-pins`, mediumCopyId: id } }
    : {}
}
