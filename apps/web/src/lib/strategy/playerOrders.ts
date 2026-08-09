import { resolveControlledEntity } from '@black-whale/simulation-engine'
import type { ProposedWorldEvent, WorldState } from '@black-whale/canon-engine'
import { hatsuById } from '$lib/nen/hatsuRegistry'
import { messagesFor } from '$lib/i18n'
import type { Locale } from '$lib/i18n/config'
import type { UnitCondition } from './conflict'
import { strategyHatsuResolution } from './hatsu'
import type { StrategyHatsuCue } from './hatsuPresentation'
import { strategicRoleForHatsu } from './rules'
import type { StrategyFaction, StrategyIntel, StrategyLocation, StrategyMoveOrder } from './types'

function strategyMsg(locale: Locale) {
  return messagesFor(locale).strategy
}

/** Raised when a plan is not one the rules allow; the caller shows the message. */
export class StrategyInputError extends Error {}

/**
 * Everything the order rules need to read. It is all state the store already
 * holds; naming it here is what lets the rules be read — and eventually
 * tested — without a store around them.
 */
export interface OrderWorld {
  state: WorldState
  factions: StrategyFaction[]
  playerFaction: StrategyFaction
  allowedCharacters: Set<string>
  destinations: Map<string, StrategyLocation>
  intel: Record<string, StrategyIntel>
  unitConditions: Record<string, UnitCondition>
  hatsuCooldowns: Record<string, number>
  turn: number
  locale: Locale
  abilityIdsForCharacter: (characterId: string) => string[]
}

/** What a turn's orders amount to, once every rule has had its say. */
export interface OrderPlan {
  ordered: Set<string>
  entityIds: Set<string>
  events: ProposedWorldEvent[]
  scouted: string[]
  guarded: string[]
  denied: string[]
  activatedHatsu: string[]
  activatedAbilityIds: string[]
  cooldownTurns: Record<string, number>
  influence: number
  cues: StrategyHatsuCue[]
}

function emptyPlan(): OrderPlan {
  return {
    ordered: new Set(),
    entityIds: new Set(),
    events: [],
    scouted: [],
    guarded: [],
    denied: [],
    activatedHatsu: [],
    activatedAbilityIds: [],
    cooldownTurns: {},
    influence: 0,
    cues: [],
  }
}

/**
 * Turns the player's orders into the events and effects they authorise, or
 * throws on the first order the rules refuse.
 *
 * Extracted from the store's `endTurn`, which had grown to hold validation,
 * opponent planning and reporting in one body: three subjects that fail for
 * different reasons and are read at different times.
 */
export function resolvePlayerOrders(
  playerOrders: readonly StrategyMoveOrder[],
  world: OrderWorld,
): OrderPlan {
  const plan = emptyPlan()
  for (const order of playerOrders) {
    if (
      order.type !== 'MOVE' &&
      order.type !== 'SCOUT' &&
      order.type !== 'GUARD' &&
      order.type !== 'HATSU'
    ) {
      throw new StrategyInputError(strategyMsg(world.locale).errors.unknownAction)
    }
    if (!world.allowedCharacters.has(order.characterId)) {
      throw new StrategyInputError(strategyMsg(world.locale).errors.orderTargetsNonOwnedUnit)
    }
    if (plan.ordered.has(order.characterId)) {
      throw new StrategyInputError(strategyMsg(world.locale).errors.oneOrderPerTurn)
    }
    const destination = world.destinations.get(order.locationId)
    if (!destination || !world.state.entities[destination.id]) {
      throw new StrategyInputError(strategyMsg(world.locale).errors.unknownDestination)
    }
    const entity = resolveControlledEntity(world.state, order.characterId)
    if (!entity) throw new StrategyInputError(strategyMsg(world.locale).errors.unitDoesNotExist)
    if (world.unitConditions[entity.id] === 'ELIMINATED') {
      throw new StrategyInputError(
        strategyMsg(world.locale).errors.eliminatedUnitCannotReceiveOrders,
      )
    }

    plan.ordered.add(order.characterId)
    plan.entityIds.add(entity.id)
    if (order.type === 'HATSU') {
      if (
        !order.abilityId ||
        !world.abilityIdsForCharacter(order.characterId).includes(order.abilityId)
      ) {
        throw new StrategyInputError(strategyMsg(world.locale).errors.unitLacksHatsu)
      }
      if ((world.hatsuCooldowns[order.abilityId] ?? 0) > world.turn) {
        throw new StrategyInputError(strategyMsg(world.locale).errors.hatsuCoolingDown)
      }
      const profile = hatsuById(order.abilityId)
      if (!profile) throw new StrategyInputError(strategyMsg(world.locale).errors.unknownHatsu)
      const confirmedHostilesAtTarget = Object.values(world.intel).filter(
        (sighting) =>
          sighting.locationId === destination.id &&
          sighting.certainty === 'CONFIRMED' &&
          !world.allowedCharacters.has(sighting.entityId),
      ).length
      const spiderIds = new Set(
        world.factions
          .find((faction) => faction.id === 'phantom-troupe')
          ?.members.map((member) => member.character.id) ?? [],
      )
      const adapted = strategyHatsuResolution(
        {
          abilityId: order.abilityId,
          sourceLocationId: world.state.presences[entity.id]?.locationId,
          targetLocationId: destination.id,
          confirmedHostilesAtTarget,
          eliminatedAllies: world.playerFaction.members.filter((member) => {
            const ally = resolveControlledEntity(world.state, member.character.id)
            return ally && world.unitConditions[ally.id] === 'ELIMINATED'
          }).length,
          targetHasSpider: Object.values(world.intel).some(
            (sighting) =>
              sighting.locationId === destination.id &&
              sighting.certainty === 'CONFIRMED' &&
              spiderIds.has(sighting.entityId),
          ),
        },
        world.locale,
      )
      if (adapted && !adapted.accepted)
        throw new StrategyInputError(
          adapted.error ?? strategyMsg(world.locale).errors.hatsuCannotBeActivated,
        )
      const effects = adapted?.effects ?? [strategicRoleForHatsu(profile.kind)]
      if (effects.includes('RECON')) plan.scouted.push(destination.id)
      if (effects.includes('DENIAL')) plan.denied.push(destination.id)
      if (effects.includes('GUARD')) plan.guarded.push(destination.id)
      if (effects.includes('INFLUENCE')) plan.influence += 1
      if (
        effects.includes('MOBILITY') &&
        world.state.presences[entity.id]?.locationId !== destination.id
      ) {
        plan.events.push({
          type: 'ENTITY_MOVED',
          payload: {
            presence: {
              entity: { id: entity.id, kind: entity.kind },
              locationId: destination.id,
              precision: destination.type === 'TIER' ? 'TIER' : 'EXACT_ROOM',
              certainty: 'CONFIRMED',
            },
          },
        })
      }
      plan.activatedAbilityIds.push(order.abilityId)
      plan.cooldownTurns[order.abilityId] = adapted?.cooldownTurns ?? 2
      plan.activatedHatsu.push(`${profile.name} · ${adapted?.report ?? destination.name}`)
      plan.cues.push({
        seq: plan.cues.length + 1,
        abilityId: order.abilityId,
        sourceCharacterId: order.characterId,
        sourceLocationId: world.state.presences[entity.id]?.locationId ?? destination.id,
        targetLocationId: destination.id,
        report: adapted?.report ?? profile.name,
      })
      continue
    }
    if (order.type === 'SCOUT') {
      plan.scouted.push(destination.id)
      continue
    }
    if (order.type === 'GUARD') {
      const guarded = world.state.presences[entity.id]?.locationId
      if (guarded) plan.guarded.push(guarded)
      continue
    }
    if (world.state.presences[entity.id]?.locationId === destination.id) continue
    plan.events.push({
      type: 'ENTITY_MOVED',
      payload: {
        presence: {
          entity: { id: entity.id, kind: entity.kind },
          locationId: destination.id,
          precision:
            destination.type === 'TIER'
              ? 'TIER'
              : destination.type === 'ZONE'
                ? 'ZONE'
                : 'EXACT_ROOM',
          certainty: 'CONFIRMED',
        },
      },
    })
  }
  return plan
}
