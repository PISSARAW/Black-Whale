import { canAct } from './fightActorState'
import { freeDeviceHand } from './deviceHands'
import { corpsePinsLive } from './illumiCorpseMatter'
import { corpseHeadContact, releasePreparedEntity } from './preparedCorpseBody'
import type { PreparedEntity } from './preparationTypes'
import type { ArsenalOption } from './retrospectiveTypes'
import type { FightSide, FightState } from './types'

/** Physical extraction is possible without the Manipulation Hatsu, including under On. */
export function removeCorpsePins(
  state: FightState,
  side: FightSide,
  corpse: PreparedEntity,
): FightState {
  const actor = state[side]
  const cancelling = actor.corpsePreparation?.target === corpse.id
  const body = cancelling ? { ...actor, corpsePreparation: undefined } : actor
  if (!canAct(body) || body.attack || !freeDeviceHand(state, side)) return state
  if (!corpse.present || !corpsePinsLive(state, corpse) || !corpseHeadContact(state, side, corpse))
    return state
  const pins = corpse.corpseNeedles!
  const dropped: PreparedEntity = {
    id: `removed:${pins.id}`,
    kind: 'needles',
    owner: side,
    x: corpse.x,
    y: corpse.y,
    present: true,
    health: 3,
    material: pins.mediumCopyId ? 'nen' : 'real',
    corpsePinBundle: pins,
  }
  return {
    ...state,
    [side]: body,
    battlefield: {
      ...state.battlefield!,
      entities: [
        ...state
          .battlefield!.entities.filter((entry) => entry.id !== dropped.id)
          .map((entry) =>
            entry.id === corpse.id
              ? {
                  ...releasePreparedEntity(entry),
                  corpseControl: undefined,
                  corpseNeedles: undefined,
                }
              : entry,
          ),
        dropped,
      ],
    },
  }
}

export function corpseRemovalOptions(state: FightState, side: FightSide): ArsenalOption[] {
  return (state.battlefield?.entities ?? [])
    .filter((entry) => entry.kind === 'corpse' && corpsePinsLive(state, entry))
    .map((entry) => ({
      command: { action: 'illumi-corpse-release', target: entry.id },
      labelFr:
        state[side].id === 'illumi'
          ? 'Illumi · Retirer les aiguilles du cadavre'
          : 'Cadavre · Retirer les aiguilles',
      labelEn:
        state[side].id === 'illumi'
          ? 'Illumi · Remove the corpse’s needles'
          : 'Corpse · Remove needles',
      ready: removeCorpsePins(state, side, entry) !== state,
      conditionFr:
        'Retrait physique au contact, avec une main libre. Aucun Hatsu requis ; le même métal est déposé, sans résurrection ni soin.',
      conditionEn:
        'Physical extraction at hand reach with a free hand. No Hatsu required; the same metal is dropped, without revival or healing.',
    }))
}
