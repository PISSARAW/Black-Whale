import { activeHitbox, boxesOverlap, hurtboxes } from './frameData'
import { sleepingBody, wakeHanzoBody } from './hanzoProjection'
import {
  holdMary,
  maryAuthority,
  maryResists,
  MARY_ESCAPE_FRAMES,
  MARY_HOLD_FRAMES,
  MARY_REACH,
  type MaryTendril,
} from './bloodyMary'
import type { ArcadeFighter, FightSide, FightState } from './types'

export function maryCanCatch(target: ArcadeFighter, tendril: MaryTendril): boolean {
  const body = sleepingBody(target)
  if (!captureBodyReady(body) || target.hanzoProjection || maryResists(body)) return false
  const box = {
    left: tendril.x - 1,
    right: tendril.x + 1,
    bottom: tendril.y - 1,
    top: tendril.y + 1,
  }
  return hurtboxes(body).some((hurt) => boxesOverlap(box, hurt))
}

function captureBodyReady(fighter: ArcadeFighter): boolean {
  return (
    fighter.health > 0 &&
    !fighter.maryCapture &&
    !fighter.blocking &&
    fighter.wakeupInvulnerableFrames === 0 &&
    fighter.knockdownFrames === 0 &&
    (fighter.maryGraceFrames ?? 0) === 0 &&
    !fighter.biohazardRestraint
  )
}

export function bindMary(state: FightState, side: FightSide): FightState {
  const targetSide = side === 'player' ? 'opponent' : 'player'
  const target = wakeHanzoBody(state[targetSide])
  const blood = state[side].bloodyMary!
  return {
    ...state,
    [side]: {
      ...state[side],
      bloodyMary: { ...blood, tendril: { ...blood.tendril!, phase: 'bound' } },
    },
    [targetSide]: holdMary({
      ...target,
      maryCapture: {
        owner: side,
        x: target.x,
        y: target.y,
        frames: MARY_HOLD_FRAMES,
        resistance: 0,
        health: target.health,
      },
    }),
  }
}

export function releaseMary(state: FightState, targetSide: FightSide): FightState {
  const target = state[targetSide]
  const capture = target.maryCapture
  if (!capture) return state
  const owner = state[capture.owner]
  const blood = owner.bloodyMary
  return {
    ...state,
    [targetSide]: { ...target, maryCapture: undefined, maryGraceFrames: 60 },
    [capture.owner]: blood
      ? {
          ...owner,
          bloodyMary: {
            ...blood,
            tendril: blood.tendril
              ? { ...blood.tendril, phase: 'resting', x: target.x, y: target.y + 2 }
              : undefined,
          },
        }
      : owner,
  }
}

export function advanceMaryCapture(state: FightState, targetSide: FightSide): FightState {
  const target = state[targetSide]
  const capture = target.maryCapture
  if (!capture) return state
  const resistance = maryResists(target) ? capture.resistance + 1 : 0
  if (captureBroken(state, targetSide) || resistance >= MARY_ESCAPE_FRAMES)
    return releaseMary(state, targetSide)
  return {
    ...state,
    [targetSide]: holdMary({
      ...target,
      maryCapture: { ...capture, frames: capture.frames - 1, resistance },
    }),
  }
}

function captureBroken(state: FightState, targetSide: FightSide): boolean {
  const target = state[targetSide]
  const capture = target.maryCapture!
  const owner = state[capture.owner]
  if (!maryAuthority(owner, owner.bloodyMary?.sourceMoveId) || !owner.bloodyMary?.tendril)
    return true
  if (owner.hitStun > 0 || owner.knockdownFrames > 0 || target.health < capture.health) return true
  return capture.frames <= 1 || target.health <= 0 || Math.abs(owner.x - target.x) > MARY_REACH
}

export function maryStruckAt(
  state: FightState,
  side: FightSide,
  point: { x: number; y: number },
): boolean {
  const enemy = state[side === 'player' ? 'opponent' : 'player']
  const box = activeHitbox(enemy)
  return Boolean(
    box &&
    boxesOverlap(box, {
      left: point.x - 0.8,
      right: point.x + 0.8,
      bottom: point.y - 0.8,
      top: point.y + 0.8,
    }),
  )
}
