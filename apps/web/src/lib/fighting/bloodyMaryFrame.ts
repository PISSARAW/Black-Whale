import {
  bindMary,
  advanceMaryCapture,
  maryCanCatch,
  maryStruckAt,
  releaseMary,
} from './bloodyMaryCapture'
import {
  maryAuthority,
  maryState,
  maryBodyFree,
  MARY_CAPACITY,
  MARY_REACH,
  type MaryDrop,
  type MaryTendril,
} from './bloodyMary'
import type { FightSide, FightState } from './types'

export function advanceBloodyMary(state: FightState): FightState {
  if (state.phase !== 'fighting' || state.catsName) return state
  let next = state
  for (const side of ['player', 'opponent'] as const) {
    next = advanceMaryCapture(next, side)
    next = advanceMaryOwner(next, side)
    next = {
      ...next,
      [side]: {
        ...next[side],
        maryGraceFrames: Math.max(0, (next[side].maryGraceFrames ?? 0) - 1),
      },
    }
  }
  return next
}

function advanceMaryOwner(state: FightState, side: FightSide): FightState {
  const blood = state[side].bloodyMary
  if (!blood) return state
  const supplied = advanceInfusion(state, side)
  if (!maryAuthority(supplied[side], blood.sourceMoveId)) return dropMary(supplied, side)
  const withTendril = blood.tendril ? advanceTendril(supplied, side) : supplied
  return advanceDrops(withTendril, side)
}

function dropMary(state: FightState, side: FightSide): FightState {
  const other = side === 'player' ? 'opponent' : 'player'
  const released = state[other].maryCapture?.owner === side ? releaseMary(state, other) : state
  const blood = maryState(released[side])
  return {
    ...released,
    [side]: {
      ...released[side],
      bloodyMary: { ...blood, tendril: undefined, drops: [], returning: false, command: undefined },
    },
  }
}

function advanceInfusion(state: FightState, side: FightSide): FightState {
  const fighter = state[side]
  const blood = maryState(fighter)
  const infusion = blood.infusion
  if (!infusion) return state
  const interrupted =
    !maryBodyFree(fighter) ||
    fighter.x !== infusion.originX ||
    fighter.health < infusion.health ||
    fighter.blocking
  if (interrupted) return storeBlood(state, side, { ...blood, infusion: undefined })
  const remainingFrames = infusion.remainingFrames - 1
  return remainingFrames > 0
    ? storeBlood(state, side, { ...blood, infusion: { ...infusion, remainingFrames } })
    : storeBlood(state, side, {
        ...blood,
        infusion: undefined,
        available: Math.min(MARY_CAPACITY, blood.available + 1),
        bags: blood.bags - 1,
      })
}

function advanceTendril(state: FightState, side: FightSide): FightState {
  const fighter = state[side]
  const tendril = fighter.bloodyMary!.tendril!
  if (tendril.phase === 'bound' || tendril.phase === 'resting') return state
  if (tendril.phase === 'returning') return returnTendril(state, side, tendril)
  if (tendril.age < 18) return storeTendril(state, side, { ...tendril, age: tendril.age + 1 })
  const moved = moveTowards(tendril, { x: tendril.aimX, y: tendril.aimY }, 0.65)
  const stopped = tendrilStopped(state, side, moved)
  const next = storeTendril(state, side, {
    ...moved,
    phase: stopped ? 'resting' : 'flying',
    age: tendril.age + 1,
  })
  const target = next[side === 'player' ? 'opponent' : 'player']
  return !stopped && maryCanCatch(target, moved) ? bindMary(next, side) : next
}

function tendrilStopped(state: FightState, side: FightSide, point: MaryTendril): boolean {
  const target = state[side === 'player' ? 'opponent' : 'player']
  if (maryStruckAt(state, side, point) || Math.abs(point.x - state[side].x) > MARY_REACH)
    return true
  const atTarget = Math.hypot(point.x - target.x, point.y - target.y - 5) < 2
  if (atTarget && target.blocking) return true
  return point.age > 100 || Math.hypot(point.x - point.aimX, point.y - point.aimY) < 0.2
}

function returnTendril(state: FightState, side: FightSide, tendril: MaryTendril): FightState {
  const fighter = state[side]
  const moved = moveTowards(tendril, { x: fighter.x, y: fighter.y + 5 }, 0.8)
  if (Math.hypot(moved.x - fighter.x, moved.y - fighter.y - 5) > 1)
    return storeTendril(state, side, moved)
  const blood = maryState(fighter)
  return storeBlood(state, side, {
    ...blood,
    tendril: undefined,
    returning: false,
    available: Math.min(MARY_CAPACITY, blood.available + tendril.units),
  })
}

function advanceDrops(state: FightState, side: FightSide): FightState {
  const blood = maryState(state[side])
  if (!blood.drops.length) return state
  let next = state
  const drops: MaryDrop[] = []
  for (const old of blood.drops) {
    const drop = stepDrop(next, side, old)
    if (drop.remainingFrames <= 0) continue
    if (blood.returning && Math.abs(drop.x - state[side].x) < 1) {
      const current = maryState(next[side])
      next = storeBlood(next, side, {
        ...current,
        available: Math.min(MARY_CAPACITY, current.available + 1),
      })
    } else drops.push(drop)
    next = observeWithDrop(next, side, drop)
  }
  return storeBlood(next, side, {
    ...maryState(next[side]),
    drops,
    returning: drops.length ? blood.returning : false,
  })
}

function stepDrop(state: FightState, side: FightSide, drop: MaryDrop): MaryDrop {
  const blood = maryState(state[side])
  const remainingFrames = drop.remainingFrames - 1
  if (drop.reformFrames > 0)
    return { ...drop, remainingFrames, reformFrames: drop.reformFrames - 1 }
  if (maryStruckAt(state, side, drop)) return { ...drop, remainingFrames, reformFrames: 30 }
  const direction = blood.returning ? (state[side].x < drop.x ? -1 : 1) : drop.direction
  const x = drop.x + direction * 0.15
  return {
    ...drop,
    x: Math.max(7, Math.min(93, x)),
    remainingFrames,
    direction: x <= 7 ? 1 : x >= 93 ? -1 : direction,
  }
}

function observeWithDrop(state: FightState, side: FightSide, drop: MaryDrop): FightState {
  const target = state[side === 'player' ? 'opponent' : 'player']
  if (drop.reformFrames > 0 || Math.hypot(drop.x - target.x, drop.y - target.y - 2) > 6)
    return state
  return storeBlood(state, side, {
    ...maryState(state[side]),
    lastSeen: { x: target.x, y: target.y, frame: state.frame },
  })
}

function moveTowards<T extends { x: number; y: number }>(
  point: T,
  target: { x: number; y: number },
  speed: number,
): T {
  const distance = Math.hypot(target.x - point.x, target.y - point.y)
  const ratio = Math.min(1, speed / Math.max(distance, 0.001))
  return {
    ...point,
    x: point.x + (target.x - point.x) * ratio,
    y: point.y + (target.y - point.y) * ratio,
  }
}

function storeTendril(state: FightState, side: FightSide, tendril: MaryTendril): FightState {
  return storeBlood(state, side, { ...maryState(state[side]), tendril })
}
function storeBlood(
  state: FightState,
  side: FightSide,
  blood: ReturnType<typeof maryState>,
): FightState {
  return { ...state, [side]: { ...state[side], bloodyMary: blood } }
}
