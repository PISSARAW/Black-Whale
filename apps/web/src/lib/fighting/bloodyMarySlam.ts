import { resolvedDamage } from './combatDamage'
import { recordFightDeath } from './fightDeaths'
import { resolveFightOutcome } from './fightOutcome'
import { resolveSweetHomeImpact } from './sweetHomeImpact'
import { scoreJudgedImpact, addJudgedKnockdown } from './towerJudging'
import { releaseMary } from './bloodyMaryCapture'
import { maryState } from './bloodyMary'
import type { FightSide, FightState } from './types'

/** The attested slam is a physical wound, never exsanguination, Zetsu or automatic death. */
export function slamMary(state: FightState, side: FightSide): FightState {
  const targetSide = side === 'player' ? 'opponent' : 'player'
  const target = state[targetSide]
  if (target.maryCapture?.owner !== side) return state
  const damage = resolvedDamage({
    attacker: state[side],
    defence: {
      fighter: target,
      blocked: false,
      parried: false,
      avoided: false,
      invulnerable: false,
    },
    base: 12,
    zone: 'torso',
    kind: 'heavy',
    damageScale: 1,
    openingMultiplier: 1,
  })
  const points = scoreJudgedImpact({
    formatId: state.formatId,
    blocked: false,
    critical: false,
    knockdown: true,
  })
  const released = releaseMary(state, targetSide)
  const blood = maryState(released[side])
  const struck: FightState = {
    ...released,
    [side]: {
      ...released[side],
      bloodyMary: {
        ...blood,
        command: undefined,
        tendril: blood.tendril ? { ...blood.tendril, phase: 'returning' } : undefined,
      },
    },
    [targetSide]: {
      ...released[targetSide],
      y: 0,
      velocityY: 0,
      health: Math.max(0, target.health - damage),
      knockdownFrames: 48,
      pose: 'down',
      attack: null,
      bufferedAttack: null,
      blocking: false,
      motion: undefined,
    },
    score: { ...state.score, [side]: state.score[side] + points },
    knockdowns: addJudgedKnockdown({ state, side, knockdown: true }),
    impact: {
      sequence: (state.impact?.sequence ?? 0) + 1,
      attacker: side,
      kind: 'heavy',
      damage,
      blocked: false,
      parried: false,
      critical: false,
      knockdown: true,
      counterHit: false,
      punish: false,
      antiAir: false,
      wallSplat: false,
      invulnerable: false,
      comboHits: 1,
      damageScale: 1,
      points,
      zone: 'torso',
      concealed: false,
      avoided: false,
      projectileId: null,
      position: { x: target.x, y: 0 },
    },
    hitstop: 5,
  }
  const routed = resolveSweetHomeImpact({ before: state, after: struck, damagedSide: targetSide })
  return finishMarySlam(routed, targetSide, side)
}

function finishMarySlam(routed: FightState, targetSide: FightSide, side: FightSide): FightState {
  const victim = routed.impact?.transfer?.to ?? targetSide
  const killer = routed.impact?.transfer?.owner ?? side
  return resolveFightOutcome(
    recordFightDeath(routed, {
      victimSide: victim,
      killerSide: victim === killer ? null : killer,
      cause: 'strike',
    }),
  )
}
