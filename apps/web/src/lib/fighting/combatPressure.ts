import { gyoSight } from './nenPerception'
import { attackData, attackPhase } from './frameData'
import { canGuard } from './fightActorState'
import { seesCombatBody } from './fightCounterplay'
import { hasRecoveryCancel } from './recoveryPunish'
import { styleReactionFrames } from './styleMobility'
import type { ArcadeFighter, FightSide, FightState } from './types'

interface PressureRead {
  clock: number
  move?: string
  attackFrame: number
  seen: number
  lastHit: number
  impact: number
}
declare module './types' {
  interface ArcadeFighter {
    pressureRead?: PressureRead
  }
}
/** Observations advance only on real actor ticks and never expose inputs or hidden Nen. */
export function withCombatPressure(state: FightState): FightState {
  return {
    ...state,
    player: observePressure(state, 'player'),
    opponent: observePressure(state, 'opponent'),
  }
}
function observePressure(state: FightState, side: FightSide): ArcadeFighter {
  const f = state[side],
    enemy = state[side === 'player' ? 'opponent' : 'player']
  const old = f.pressureRead ?? {
    clock: state.frame,
    attackFrame: -1,
    seen: 0,
    lastHit: -1000000000,
    impact: -1,
  }
  const attack = seesCombatBody(f) && readableAttack(f, enemy) ? enemy.attack : null
  return {
    ...f,
    pressureRead: {
      ...old,
      clock: state.frame,
      ...seenAction(attack, old),
      ...receivedImpact(state, side, old),
    },
  }
}
function seenAction(attack: ArcadeFighter['attack'], old: PressureRead) {
  if (!attack) return { move: undefined, attackFrame: -1, seen: 0 }
  const move = attack.moveId ?? attack.kind
  const continuing = old.move === move && old.attackFrame <= attack.frame
  return { move, attackFrame: attack.frame, seen: continuing ? old.seen + 1 : 1 }
}
function receivedImpact(state: FightState, side: FightSide, old: PressureRead) {
  const hit = state.impact
  if (
    !hit ||
    hit.attacker === side ||
    hit.blocked ||
    hit.damage <= 0 ||
    hit.sequence === old.impact
  )
    return { lastHit: old.lastHit, impact: old.impact }
  return { lastHit: state.frame, impact: hit.sequence }
}
/** A first slow threat needs reaction time; a recently suffered string can be anticipated. */
export function wantsObservedGuard(f: ArcadeFighter, enemy: ArcadeFighter): boolean {
  if (!canGuard(f) || !seesCombatBody(f) || !enemy.attack) return false
  if (!readableAttack(f, enemy)) return false
  if (attackPhase(enemy) === 'recovery' && !hasRecoveryCancel(enemy)) return false
  const data = attackData(enemy.attack.kind, enemy)
  if (Math.abs(f.x - enemy.x) > data.box.right + Math.max(0, data.lunge) + 2) return false
  return anticipatedPressure(f) || observedFrames(f) >= styleReactionFrames(f)
}
export function incomingLow(enemy: ArcadeFighter): boolean {
  return Boolean(enemy.attack && attackData(enemy.attack.kind, enemy).guard === 'low')
}

function anticipatedPressure(f: ArcadeFighter): boolean {
  const read = f.pressureRead
  return Boolean(read && read.clock - read.lastHit <= 90)
}
function observedFrames(f: ArcadeFighter): number {
  return f.pressureRead?.seen ?? 0
}

function readableAttack(f: ArcadeFighter, enemy: ArcadeFighter): boolean {
  const attack = enemy.attack
  return Boolean(attack && (attack.kind !== 'special' || !attack.concealed || gyoSight(f)))
}
