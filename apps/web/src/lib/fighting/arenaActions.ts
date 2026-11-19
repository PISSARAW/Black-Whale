import { selectedObjectMark, objectMarkHandReady } from './sunMoonObjectHands'
import { vacuumObjectAllowed } from './arenaVacuum'
import { arenaTechnique } from './arenaTechnique'
import { canAct } from './fightActorState'
import { voluntaryNenAvailable } from './nenAccess'
import { chainAbilitySealed } from './kurapika'
import { futureAcceptsMove } from './parallelFutureAbility'
import { performFuturePerceptionAction } from './futurePerception'
import { chrolloHasActivePage } from './chrolloBook'
import { blinkyAvailable, inBlinkyNozzle } from './blinky'
import { resolveMoonlightAction } from './moonlightAction'
import { resolveCrossGameCommand } from './crossGameAction'
import { liveEntity } from './preparationWorld'
import type { AuraAttackOptions } from './auraAttackAction'
import type { PreparedEntity } from './preparationTypes'
import type { ArcadeFighter, FightSide, FightState } from './types'

type Utility = NonNullable<NonNullable<ReturnType<typeof arenaTechnique>>['utility']>

export function arenaObjects(state: FightState): PreparedEntity[] {
  return (state.battlefield?.entities ?? []).filter((entry) => entry.arena && liveEntity(entry))
}

export function nearestArenaObject(state: FightState, side: FightSide, reach = 24) {
  const fighter = state[side]
  return arenaObjects(state)
    .filter(
      (entry) =>
        (entry.x - fighter.x) * fighter.facing >= 0 &&
        Math.hypot(entry.x - fighter.x, entry.y - fighter.y) <= reach,
    )
    .sort((a, b) => Math.abs(a.x - fighter.x) - Math.abs(b.x - fighter.x))[0]
}

export function arenaNenAvailable(state: FightState, side: FightSide): boolean {
  const fighter = state[side]
  return (
    voluntaryNenAvailable(fighter) && !chainAbilitySealed(fighter, `${fighter.id}:neutralSpecial`)
  )
}

function arenaBodyAvailable(fighter: ArcadeFighter): boolean {
  if (!canAct(fighter) || fighter.attack || fighter.coveringEars) return false
  if (fighter.parallelEyesClosed && fighter.id !== 'tserriednich') return false
  return !fighter.melodyPerformance || fighter.id === 'melody'
}

/** Use the normal character handlers: the contextual command cannot waive prerequisites. */
export function performArenaAction(
  state: FightState,
  side: FightSide,
  perform: (options: AuraAttackOptions) => FightState,
): FightState {
  const perception = performFuturePerceptionAction(state, side, (current) =>
    performArenaAction(current, side, perform),
  )
  if (perception) return perception
  if (!state.arena || state.phase !== 'fighting' || state.catsName) return state
  if (!futureAcceptsMove(state, side) || !arenaBodyAvailable(state[side])) return state
  const technique = arenaTechnique(state[side].id)
  if (!technique) return state
  if (!technique.utility) return perform(arenaAttackOptions(state, side))
  const after = beginArenaUtility(state, side, technique.utility)
  return after === state
    ? state
    : resolveMoonlightAction(state, resolveCrossGameCommand(state, after, side), side)
}

function arenaAttackOptions(state: FightState, side: FightSide): AuraAttackOptions {
  const fighter = state[side]
  const technique = arenaTechnique(fighter.id)!
  const move = nativeArenaMove(fighter)
  let kind = technique.kind
  if (fighter.id === 'padaille' && fighter.padailleTool) kind = 'heavy'
  return {
    state,
    side,
    kind,
    moveId: kind === 'special' ? `${fighter.id}:${move}` : undefined,
    variant: fighter.id === 'theta' ? 'low' : undefined,
    auraCharged: false,
  }
}

function utilityPermitted(state: FightState, side: FightSide, kind: Utility): boolean {
  if (!arenaNenAvailable(state, side)) return false
  if (kind === 'vacuum') return blinkyAvailable(state[side])
  return kind !== 'marks' || chrolloHasActivePage(state[side], 'sun-and-moon')
}

function toggleTether(state: FightState, side: FightSide, kind: Utility): FightState | null {
  const arena = state.arena!
  const tether = arena.tether[side]
  if (!tether) return null
  if (kind === 'gum' && tether.pulling)
    return { ...state, arena: { ...arena, tether: { ...arena.tether, [side]: undefined } } }
  if (kind === 'gum')
    return {
      ...state,
      arena: { ...arena, tether: { ...arena.tether, [side]: { ...tether, pulling: true } } },
    }
  return kind === 'thread'
    ? { ...state, arena: { ...arena, tether: { ...arena.tether, [side]: undefined } } }
    : null
}

function utilityTarget(state: FightState, side: FightSide, kind: Utility) {
  const stored = state.arena!.stored[side]
  if (kind === 'vacuum' && stored)
    return state.battlefield?.entities.find((entry) => entry.id === stored)
  const target = nearestArenaObject(state, side, kind === 'gum' ? 24 : 8)
  return kind === 'vacuum' && target && !vacuumTargetAllowed(state, side, target)
    ? undefined
    : target
}
function vacuumTargetAllowed(state: FightState, side: FightSide, target: PreparedEntity): boolean {
  return (
    vacuumObjectAllowed(target) &&
    inBlinkyNozzle(state[side], { x: target.x, y: target.y + target.arena!.height / 2 })
  )
}

function objectMarkAllowed(context: {
  state: FightState
  side: FightSide
  target: PreparedEntity
  mark: import('./sunMoonObjectHands').ObjectMark
}): boolean {
  const { state, side, target, mark } = context
  return objectMarkHandReady(state, side, mark) && !target.arena?.sun && !target.arena?.moon
}

function beginArenaUtility(state: FightState, side: FightSide, kind: Utility): FightState {
  if (!utilityPermitted(state, side, kind)) return state
  const toggled = toggleTether(state, side, kind)
  if (toggled) return toggled
  const fighter = state[side]
  const target = utilityTarget(state, side, kind)
  if (!target || fighter.aura < 12) return state
  const mark = kind === 'marks' ? selectedObjectMark(state, side) : undefined
  if (mark && !objectMarkAllowed({ state, side, target, mark })) return state
  return {
    ...state,
    arena: {
      ...state.arena!,
      pending: {
        ...state.arena!.pending,
        [side]: { objectId: target.id, kind, frames: 18, mark },
      },
    },
    [side]: {
      ...fighter,
      aura: fighter.aura - 12,
      arenaRecovery: 18,
      blocking: false,
      bufferedAttack: null,
    },
  }
}

function nativeArenaMove(fighter: ArcadeFighter): string {
  if (fighter.id === 'feitan' && fighter.hatsuEffects.painPacker?.armour) return 'finisher'
  if (fighter.id === 'phinks' && fighter.hatsuEffects.cyclotronTurns > 0) return 'finisher'
  return arenaTechnique(fighter.id)?.move ?? 'neutralSpecial'
}
