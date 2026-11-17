import { sleepingBody, wakeHanzoBody } from './hanzoProjection'
import { chrolloPageForMove, chrolloHasActivePage } from './chrolloBook'
import { battleAppearance } from './battleCantabileRules'
import { updateEntity } from './preparationWorld'
import { voluntaryNenAvailable } from './nenAccess'
import type { ArsenalCommand } from './retrospectiveTypes'
import type { FightSide, FightState } from './types'

/** Startup is duel timing. Range, hands and a successful physical touch are checked again on contact. */
export function beginHistoricalTouch(
  state: FightState,
  side: FightSide,
  command: ArsenalCommand,
): FightState {
  if (state[side].hanzoProjection || applyTouch(state, side, command) === state) return state
  return {
    ...state,
    [side]: {
      ...state[side],
      arenaRecovery: 19,
      chrolloHistorical: {
        ...state[side].chrolloHistorical,
        touch: {
          command,
          frames: 18,
          health: state[side].health,
          page: chrolloPageForMove(state[side])!,
        },
      },
    },
  }
}
export function advanceHistoricalTouch(state: FightState, side: FightSide): FightState {
  const fighter = state[side]
  const touch = fighter.chrolloHistorical?.touch
  if (!touch) return state
  const cleared = {
    ...state,
    [side]: { ...fighter, chrolloHistorical: { ...fighter.chrolloHistorical, touch: undefined } },
  }
  if (touchInterrupted(state, side)) return cleared
  if (touch.frames > 1)
    return {
      ...state,
      [side]: {
        ...fighter,
        chrolloHistorical: {
          ...fighter.chrolloHistorical,
          touch: { ...touch, frames: touch.frames - 1 },
        },
      },
    }
  return applyTouch(cleared, side, touch.command)
}
function touchInterrupted(state: FightState, side: FightSide): boolean {
  const f = state[side],
    touch = f.chrolloHistorical!.touch!
  return (
    f.health < touch.health ||
    f.hitStun > 0 ||
    f.knockdownFrames > 0 ||
    Boolean(f.attack) ||
    !voluntaryNenAvailable(f) ||
    !chrolloHasActivePage(f, touch.page)
  )
}
function applyTouch(state: FightState, side: FightSide, command: ArsenalCommand): FightState {
  return chrolloPageForMove(state[side]) === 'fun-fun-cloth'
    ? wrapHistoricalCloth(state, side, command.target)
    : convertHistoricalHands(state, side, command.action)
}
function convertHistoricalHands(
  state: FightState,
  side: FightSide,
  action: ArsenalCommand['action'],
): FightState {
  const caster = state[side]
  const other = side === 'player' ? 'opponent' : 'player'
  if (Math.hypot(caster.x - state[other].x, caster.y - state[other].y) > 6 || caster.aura < 12)
    return state
  const right = action === 'history-shape-right' || action === 'history-shape-swap'
  const left = action !== 'history-shape-right'
  if (right && caster.chrolloBook?.open) return state
  const ownAppearance = battleAppearance(caster)
  const targetAppearance = battleAppearance(state[other])
  let next = { ...state, [side]: { ...caster, aura: caster.aura - 12, arenaRecovery: 18 } }
  if (left)
    next = {
      ...next,
      [side]: {
        ...next[side],
        chrolloHistorical: {
          ...next[side].chrolloHistorical,
          appearance: { owner: side, model: targetAppearance },
        },
      },
    }
  if (right)
    next = {
      ...next,
      [other]: {
        ...next[other],
        chrolloHistorical: {
          ...next[other].chrolloHistorical,
          appearance: { owner: side, model: ownAppearance },
        },
      },
    }
  return next
}

function wrapHistoricalCloth(state: FightState, side: FightSide, targetId?: string): FightState {
  const caster = state[side]
  if (!clothHandsReady(state, side)) return state
  const target = clothTarget(side, targetId)
  if (target === side) return state
  let next = state
  if (target === 'player' || target === 'opponent') {
    if (!clothBodyReachable(state, side, target)) return state
    next = {
      ...next,
      [target]: {
        ...wakeHanzoBody(state[target]),
        clothCapture: { owner: side },
        blocking: false,
        attack: null,
        bufferedAttack: null,
      },
    }
  } else {
    next = wrapClothObject(state, side, target)
    if (next === state) return state
  }
  return {
    ...next,
    [side]: {
      ...next[side],
      aura: caster.aura - 25,
      arenaRecovery: 18,
      chrolloHistorical: { ...caster.chrolloHistorical, cloth: { target } },
    },
  }
}

function clothBodyReachable(state: FightState, side: FightSide, target: FightSide): boolean {
  const caster = state[side],
    body = sleepingBody(state[target])
  // Contact with the sleeping body wakes Hanzo; the projected double is not captured.
  return (
    !body.clothCapture &&
    !body.blocking &&
    body.y === 0 &&
    Math.hypot(caster.x - body.x, caster.y - body.y) <= 6
  )
}
function wrapClothObject(state: FightState, side: FightSide, id: string): FightState {
  const object = state.battlefield?.entities.find((entry) => entry.id === id && entry.present)
  if (!object || Math.hypot(state[side].x - object.x, state[side].y - object.y) > 6) return state
  return updateEntity(state, id, { present: false })
}

function clothHandsReady(state: FightState, side: FightSide): boolean {
  const caster = state[side]
  return !caster.chrolloBook?.open && caster.aura >= 25 && !caster.chrolloHistorical?.cloth
}
function clothTarget(side: FightSide, id?: string): string {
  return id ?? (side === 'player' ? 'opponent' : 'player')
}
