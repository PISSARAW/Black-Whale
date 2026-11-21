import { attackPhase } from './frameData'
import { machiSourceActive } from './machiThread'
import { lose, other, MACHI_TRAP_SPAN, type MachiTrap } from './machiSpool'
import type { ArcadeFighter, FightSide, FightState } from './types'

const CUT_REACH = 3

/** Traps snag a grounded opponent, or are cut by an active strike passing over them. */
export function advanceMachiTraps(state: FightState): FightState {
  let next = state
  for (const side of ['player', 'opponent'] as const) {
    if (!next[side].machiTraps?.length) continue
    next = machiSourceActive(next[side])
      ? advanceSideTraps(next, side)
      : { ...next, [side]: { ...next[side], machiTraps: undefined } }
  }
  return next
}

function advanceSideTraps(state: FightState, side: FightSide): FightState {
  let next = state
  const kept: MachiTrap[] = []
  for (const trap of state[side].machiTraps ?? []) {
    const enemy = next[other(side)]
    if (trapCut(enemy, trap)) next = { ...next, [side]: lose(next[side], trap.length) }
    else if (trapSnags(enemy, trap, side)) next = snag(next, side, trap)
    else kept.push(trap)
  }
  return { ...next, [side]: { ...next[side], machiTraps: kept.length ? kept : undefined } }
}

function trapCut(enemy: ArcadeFighter, trap: MachiTrap): boolean {
  if (!enemy.attack || attackPhase(enemy) !== 'active') return false
  return Math.abs(enemy.x + enemy.facing * 2 - trap.x) <= CUT_REACH
}

function trapSnags(enemy: ArcadeFighter, trap: MachiTrap, side: FightSide): boolean {
  return (
    enemy.health > 0 &&
    enemy.y <= 0 &&
    Math.abs(enemy.x - trap.x) <= MACHI_TRAP_SPAN &&
    enemy.machiThread?.owner !== side
  )
}

/** The trap's own strand moves onto the body; it only binds while Machi can hold it. */
function snag(state: FightState, side: FightSide, trap: MachiTrap): FightState {
  const enemy = state[other(side)]
  return {
    ...state,
    [other(side)]: {
      ...enemy,
      machiThread: { owner: side, kind: 'bind', length: trap.length, x: enemy.x, y: enemy.y },
    },
  }
}
