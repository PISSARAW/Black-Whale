import { resolveMoonlightAction } from './moonlightAction'
import { resolveCrossGameCommand } from './crossGameAction'
import { stampObjectPoint, objectMarkPoint, objectMarkAtPalm } from './sunMoonMarkPoint'
import { witnessedHatsuState } from './nenWitness'
import { SUN_MOON_FULL_CONTACT } from './sunMoonChargeRules'
import { chainAbilitySealed } from './kurapika'
import { arsenalMindAvailable } from './arsenalMind'
import { canAct } from './fightActorState'
import { voluntaryNenAvailable } from './nenAccess'
import { chrolloHasActivePage } from './chrolloBook'
import { objectMarkHandReady, type ObjectMark } from './sunMoonObjectHands'
import { liveEntity, updateEntity } from './preparationWorld'
import type { ArsenalCommand } from './retrospectiveTypes'
import type { ArenaState } from './arenaTypes'
import type { PreparedEntity } from './preparationTypes'
import type { FightSide, FightState } from './types'

export { SUN_MOON_FULL_CONTACT } from './sunMoonChargeRules'
export type ChargePending = NonNullable<ArenaState['pending']['player']>
declare module './types' {
  interface ArcadeFighter {
    sunMoonCharging?: ObjectMark
  }
}
export function performSunMoonCharge(
  state: FightState,
  side: FightSide,
  command: ArsenalCommand,
): FightState {
  if (state[side].id !== 'chrollo' || !state.arena) return state
  if (command.action === 'sun-moon-release') return stopSunMoonCharge(state, side)
  const admitted = chargeCommandTarget(state, side, command)
  if (!admitted) return state
  const { entry, mark } = admitted
  const actor = state[side]
  const stamped = updateEntity(state, entry.id, {
    arena: stampObjectPoint({ entry, actor, mark, side }),
  })
  const point = objectMarkPoint(
    stamped.battlefield!.entities.find((e) => e.id === entry.id)!,
    mark,
  )!
  const witness = side === 'player' ? 'opponent' : 'player'
  const marked = {
    ...stamped,
    [witness]: {
      ...stamped[witness],
      hatsuEffects: {
        ...stamped[witness].hatsuEffects,
        ...witnessedHatsuState(state, { side, source: 'chrollo' }),
      },
    },
  }
  const after: FightState = {
    ...marked,
    arena: {
      ...state.arena,
      pending: {
        ...state.arena.pending,
        [side]: {
          objectId: entry.id,
          kind: 'marks',
          mark,
          charge: true,
          frames: SUN_MOON_FULL_CONTACT,
          contact: { x: point.x - actor.x, y: point.y - actor.y },
        },
      },
    },
    [side]: {
      ...actor,
      aura: actor.aura - 12,
      arenaRecovery: SUN_MOON_FULL_CONTACT,
      sunMoonCharging: mark,
      blocking: false,
      bufferedAttack: null,
    },
  }
  return resolveMoonlightAction(state, resolveCrossGameCommand(state, after, side), side)
}
function chargeCommandTarget(state: FightState, side: FightSide, command: ArsenalCommand) {
  if (!['sun-moon-charge-sun', 'sun-moon-charge-moon'].includes(command.action)) return undefined
  const mark = command.action === 'sun-moon-charge-sun' ? 'sun' : 'moon'
  if (!chargeStartReady(state, side, mark)) return undefined
  const entry = state.battlefield?.entities.find((e) => e.id === command.target)
  if (!entry || !chargeTargetReady(state, side, entry) || !chargeMarkAllowed(entry, side, mark))
    return undefined
  return objectMarkAtPalm(entry, state[side], mark) ? ({ entry, mark } as const) : undefined
}
function chargeStartReady(state: FightState, side: FightSide, mark: ObjectMark): boolean {
  const actor = state[side]
  return chargeChannelReady(state, side, mark) && canAct(actor) && !actor.attack && actor.aura >= 12
}
function chargeChannelReady(state: FightState, side: FightSide, mark: ObjectMark): boolean {
  return (
    voluntaryNenAvailable(state[side]) &&
    !chainAbilitySealed(state[side], 'chrollo:neutralSpecial') &&
    arsenalMindAvailable(state[side]) &&
    chrolloHasActivePage(state[side], 'sun-and-moon') &&
    objectMarkHandReady(state, side, mark)
  )
}
function chargeTargetReady(state: FightState, side: FightSide, entry: PreparedEntity): boolean {
  const actor = state[side]
  return Boolean(
    entry.arena &&
    liveEntity(entry) &&
    (entry.x - actor.x) * actor.facing >= 0 &&
    Math.hypot(entry.x - actor.x, entry.y - actor.y) <= 8,
  )
}
function chargeMarkAllowed(entry: PreparedEntity, side: FightSide, mark: ObjectMark): boolean {
  const other = mark === 'sun' ? 'moon' : 'sun'
  const charge = mark === 'sun' ? entry.arena!.sunCharge : entry.arena!.moonCharge
  return (
    (charge ?? 0) < SUN_MOON_FULL_CONTACT &&
    !entry.arena![other] &&
    (!entry.arena![mark] || entry.arena![mark] === side)
  )
}
export function stopSunMoonCharge(state: FightState, side: FightSide): FightState {
  if (!state.arena?.pending[side]?.charge) return state
  return {
    ...state,
    arena: { ...state.arena, pending: { ...state.arena.pending, [side]: undefined } },
    [side]: { ...state[side], sunMoonCharging: undefined, arenaRecovery: 0 },
  }
}
export function advanceSunMoonCharge(
  state: FightState,
  side: FightSide,
  pending: ChargePending,
): FightState {
  const entry = state.battlefield?.entities.find((e) => e.id === pending.objectId)
  if (!entry || !maintainsChargeContact({ state, side, pending, entry }))
    return stopSunMoonCharge(state, side)
  const mark = pending.mark!
  const key = mark === 'sun' ? 'sunCharge' : 'moonCharge'
  const frames = pending.frames - 1
  const charged = updateEntity(state, entry.id, {
    arena: {
      ...entry.arena!,
      [key]: Math.max(entry.arena![key] ?? 0, SUN_MOON_FULL_CONTACT - frames),
    },
  })
  if (frames <= 0) return stopSunMoonCharge(charged, side)
  return {
    ...charged,
    arena: {
      ...charged.arena!,
      pending: { ...charged.arena!.pending, [side]: { ...pending, frames } },
    },
  }
}
function maintainsChargeContact(context: {
  state: FightState
  side: FightSide
  pending: ChargePending
  entry: PreparedEntity
}): boolean {
  const { state, side, pending, entry } = context
  const actor = state[side]
  if (!pending.mark || !pending.contact || !chargeChannelReady(state, side, pending.mark))
    return false
  if (!chargeTargetReady(state, side, entry) || chargeBodyInterrupted(state, side)) return false
  const point = objectMarkPoint(entry, pending.mark)
  return Boolean(
    point &&
    entry.arena![pending.mark] === side &&
    Math.hypot(point.x - actor.x - pending.contact.x, point.y - actor.y - pending.contact.y) <=
      0.25,
  )
}

function chargeBodyInterrupted(state: FightState, side: FightSide): boolean {
  const actor = state[side]
  return Boolean(
    actor.attack ||
    actor.health <= 0 ||
    actor.hitStun > 0 ||
    actor.blockStun > 0 ||
    actor.knockdownFrames > 0,
  )
}

/** The material contact ends in the same step that consumes its physical support. */
export function releaseSunMoonContact(state: FightState, objectId: string): FightState {
  for (const side of ['player', 'opponent'] as const)
    if (state.arena?.pending[side]?.objectId === objectId) state = stopSunMoonCharge(state, side)
  return state
}
