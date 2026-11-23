import { describe, expect, it } from 'vitest'
import { beginFight, createFight, tickFight } from './engine'
import { FIXED_STEP } from './frameData'
import { motionOf } from './fighterMovement'
import { strikeProjectileDefender } from './combatDamage'
import { recoilGuardedAttack } from './guardRecoil'
import { resolveThrowTech } from './throwRules'
import { SWAY_COOLDOWN } from './movementTech'
import {
  AURA_PUSHBLOCK_DISTANCE,
  BACKDASH_BRAKE_MIN_FRAME,
  FRANKLIN_BRACED_KNOCKBACK,
  TECH_LANDING_ROLL_FRAMES,
  THROW_TECH_BACK_DIST,
  THROW_TECH_FORWARD_DIST,
} from './defensiveMovementTech'
import { EMPTY_INPUT, type FightInput, type FightState, type FighterId } from './types'

const step = (state: FightState, input: Partial<FightInput> = {}) =>
  tickFight(state, { ...EMPTY_INPUT, ...input }, FIXED_STEP + 1e-9)

function steps(state: FightState, count: number, input: Partial<FightInput> = {}) {
  let next = state
  for (let i = 0; i < count; i += 1) next = step(next, input)
  return next
}

const duel = (p1: FighterId = 'kurapika', p2: FighterId = 'hisoka') =>
  beginFight(createFight(p1, p2, { mode: 'versus-local' }))

function startDash(state: FightState, dir: 'left' | 'right') {
  let next = steps(state, 2, { [dir]: true })
  next = steps(next, 2)
  return step(next, { [dir]: true })
}

describe('defensive & spacing movement tech', () => {
  it('brakes a backdash late when pressing Down (Backdash Brake)', () => {
    const start = duel()
    const back = startDash(start, 'left')
    expect(motionOf(back.player).dash?.direction).toBe(-1)
    const late = steps(back, BACKDASH_BRAKE_MIN_FRAME)
    const braked = step(late, { down: true })
    expect(motionOf(braked.player).dash).toBeNull()
  })

  it('pushes the attacker back further on timely Forward + Guard in Ken/Ren (Aura Pushblock)', () => {
    const base = duel()
    const attacker = { ...base.player, x: 40 }
    const defender = {
      ...base.opponent,
      x: 50,
      facing: -1 as const,
      blocking: true,
      guardFrames: 2,
      aura: 50,
      nen: { ...base.opponent.nen, ken: true },
      motion: { ...motionOf(base.opponent), heldDirection: -1 as const },
    }
    const pushed = recoilGuardedAttack({
      attacker,
      defender,
      struck: { ...defender, x: 52 },
      knockback: 2,
      blocked: true,
      avoided: false,
    })
    expect(pushed.x).toBeCloseTo(40 - AURA_PUSHBLOCK_DISTANCE, 4)
  })

  it('replaces landing stop with a short roll when touching down from Air Recovery', () => {
    const base = duel()
    const falling: FightState = {
      ...base,
      player: { ...base.player, y: 0.4, velocityY: -40, airRecovery: true },
    }
    const landed = step(falling, { left: true })
    expect(landed.player.y).toBe(0)
    expect(landed.player.ukemiRoll).toEqual({ direction: -1, frames: TECH_LANDING_ROLL_FRAMES })
    expect(motionOf(landed.player).landingFrames).toBe(0)
  })

  it('adjusts throw-tech separation when holding Back or Forward', () => {
    const base = duel()
    const backHold: FightState = {
      ...base,
      player: { ...base.player, x: 40, facing: 1, motion: { ...motionOf(base.player), heldDirection: -1 } },
      opponent: { ...base.opponent, x: 50, facing: -1, motion: { ...motionOf(base.opponent), heldDirection: -1 } },
    }
    const resolved = resolveThrowTech(backHold, 'player')
    expect(40 - resolved.player.x).toBeCloseTo(THROW_TECH_BACK_DIST, 4)
    expect(resolved.opponent.x - 50).toBeCloseTo(THROW_TECH_FORWARD_DIST, 4)
  })
})

describe('final canon character movement tech', () => {
  it('snaps Hanzo directly into a reverse dash upon braking a forward dash', () => {
    const start = duel('hanzo', 'kurapika')
    const forward = startDash(start, 'right')
    const mid = steps(forward, 6)
    const reversed = step(mid, { left: true })
    expect(motionOf(reversed.player).dash?.direction).toBe(-1)
  })

  it('reduces guarded projectile knockback by 20% for crouching Franklin (Braced Stance)', () => {
    const base = duel('hisoka', 'franklin')
    const projectile = {
      id: 1,
      owner: 'player' as const,
      fighterId: 'hisoka' as const,
      x: 42,
      y: 5,
      velocityX: 40,
      width: 2,
      height: 2,
      damage: 5,
      hitstun: 10,
      blockstun: 8,
      hitstop: 4,
      knockback: 5,
      targetZone: 'torso' as const,
      shape: 'card' as const,
      colour: '#fff',
      age: 1,
      lifetime: 30,
      matter: 'object' as const,
    }
    const standingPush =
      strikeProjectileDefender({
        fighter: { ...base.opponent, x: 45, crouching: false },
        attacker: { ...base.player, x: 30 },
        damage: 1,
        blocked: true,
        knockdown: false,
        antiAir: false,
        wallSplat: false,
        counterHit: false,
        comboHits: 0,
        projectile,
      }).x - 45
    const bracedPush =
      strikeProjectileDefender({
        fighter: { ...base.opponent, x: 45, crouching: true },
        attacker: { ...base.player, x: 30 },
        damage: 1,
        blocked: true,
        knockdown: false,
        antiAir: false,
        wallSplat: false,
        counterHit: false,
        comboHits: 0,
        projectile,
      }).x - 45
    expect(bracedPush).toBeCloseTo(standingPush * FRANKLIN_BRACED_KNOCKBACK, 4)
  })

  it('halves Back Sway cooldown for Tserriednich during Parallel Future divergence', () => {
    const start = duel('tserriednich', 'kurapika')
    const diverging: FightState = {
      ...start,
      player: { ...start.player, futureDiverging: true },
    }
    const swayed = step(diverging, { left: true, guard: true })
    expect(swayed.player.swayCooldown).toBe(Math.round(SWAY_COOLDOWN / 2))
  })
})
