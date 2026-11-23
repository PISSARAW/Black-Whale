import { describe, expect, it } from 'vitest'
import { beginFight, createFight, tickFight } from './engine'
import { FIXED_STEP } from './frameData'
import { motionOf, PREJUMP_FRAMES, steerFighter } from './fighterMovement'
import {
  FEITAN_DASH_BRAKE_FRAME,
  KO_FAST_DROP_SPEED,
  MACHI_THREAD_PULL_COST,
  performMachiThreadPull,
  WALL_JUMP_VY,
  ZETSU_STEALTH_DELAY,
  zetsuStealthDelay,
} from './advancedMovementTech'
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

function startForwardDash(state: FightState) {
  let next = steps(state, 2, { right: true })
  next = steps(next, 2)
  return step(next, { right: true })
}

describe('advanced universal martial & Nen movement', () => {
  it('launches higher and further on a Super Jump (Down then Up)', () => {
    const start = duel()
    const normal = steps(start, PREJUMP_FRAMES + 1, { jump: true })
    const crouched = step(start, { down: true })
    const superJump = steps(crouched, PREJUMP_FRAMES + 1, { jump: true, right: true })
    expect(superJump.player.velocityY).toBeGreaterThan(normal.player.velocityY * 1.15)
  })

  it('carries forward dash momentum into a Dash Jump', () => {
    const start = duel()
    const normalJump = steps(start, PREJUMP_FRAMES + 1, { jump: true, right: true })
    const dashed = startForwardDash(start)
    const dashJump = steps(dashed, PREJUMP_FRAMES + 1, { jump: true, right: true })
    expect(motionOf(dashJump.player).velocityX).toBeGreaterThan(
      motionOf(normalJump.player).velocityX * 1.2,
    )
  })

  it('allows one Wall Jump per airborne arc for agile (mobile) fighters', () => {
    const start = duel('feitan', 'kurapika')
    const airborne = { ...start.player, x: 8, y: 6, velocityY: -5 }
    const kicked = steerFighter(airborne, {
      input: { ...EMPTY_INPUT, right: true, jump: true },
      mobile: true,
      jumpable: false,
    })
    expect(kicked.velocityY).toBeCloseTo(WALL_JUMP_VY, 2)
    expect(motionOf(kicked).wallJumped).toBe(true)
    expect(motionOf(kicked).velocityX).toBeGreaterThan(0)
    // Second wall jump in the same airborne arc is refused.
    const second = steerFighter(
      { ...kicked, x: 8, y: 6, velocityY: -5 },
      { input: { ...EMPTY_INPUT, right: true, jump: true }, mobile: true, jumpable: false },
    )
    expect(second.velocityY).toBe(-5)
  })

  it('transitions a completed forward dash into a faster sustained Run while holding forward', () => {
    const start = duel('kurapika', 'hisoka')
    const walked = steps(start, 8, { right: true }).player.x - start.player.x
    const dashed = startForwardDash(start)
    const finished = steps(dashed, 20, { right: true })
    expect(motionOf(finished.player).running).toBe(true)
    const runDist = steps(finished, 8, { right: true }).player.x - finished.player.x
    expect(runDist).toBeGreaterThan(walked * 1.15)
  })

  it('triggers Ko Fast Drop when holding Down mid-air with Ko focused in the feet', () => {
    const start = duel()
    const airborne = {
      ...start.player,
      y: 12,
      velocityY: -5,
      nen: { ...start.player.nen, ko: 'feet' as const },
    }
    const dropped = steerFighter(airborne, {
      input: { ...EMPTY_INPUT, down: true },
      mobile: true,
      jumpable: false,
    })
    expect(dropped.velocityY).toBeLessThanOrEqual(-KO_FAST_DROP_SPEED)
  })

  it('delays AI observation when the target approaches in Zetsu without observer En', () => {
    const start = duel()
    const zetsuPlayer = {
      ...start.player,
      nen: { ...start.player.nen, mode: 'zetsu' as const },
    }
    expect(zetsuStealthDelay(start.opponent, zetsuPlayer)).toBe(ZETSU_STEALTH_DELAY)
    const withEn = { ...start.opponent, nen: { ...start.opponent.nen, en: 20 } }
    expect(zetsuStealthDelay(withEn, zetsuPlayer)).toBe(0)
  })
})

describe('advanced canon character movement', () => {
  it('grants Chrollo +8% walk/dash mobility when Bandit Secret is closed', () => {
    const start = duel('chrollo', 'kurapika')
    const openState: FightState = {
      ...start,
      player: {
        ...start.player,
        chrolloBook: { pages: [], page: 0, open: true, bookmark: null },
      },
    }
    const closedState: FightState = {
      ...start,
      player: {
        ...start.player,
        chrolloBook: { pages: [], page: 0, open: false, bookmark: null },
      },
    }
    const openWalk = steps(openState, 10, { right: true }).player.x - start.player.x
    const closedWalk = steps(closedState, 10, { right: true }).player.x - start.player.x
    expect(closedWalk).toBeGreaterThan(openWalk * 1.05)
  })

  it('opens Feitan Dash Brake earlier at frame 4', () => {
    const start = duel('feitan', 'kurapika')
    const dashed = startForwardDash(start)
    const early = steps(dashed, FEITAN_DASH_BRAKE_FRAME)
    const braked = step(early, { left: true })
    expect(motionOf(braked.player).dash).toBeNull()
  })

  it('pulls Machi rapidly along an attached Nen thread toward the opponent', () => {
    const base = duel('machi', 'kurapika')
    const threaded: FightState = {
      ...base,
      player: { ...base.player, x: 25, aura: 50 },
      opponent: {
        ...base.opponent,
        x: 55,
        machiThread: { owner: 'player', kind: 'mark', x: 55, y: 5 },
      },
    }
    const pulled = performMachiThreadPull(threaded, 'player')
    expect(pulled.player.aura).toBe(50 - MACHI_THREAD_PULL_COST)
    expect(motionOf(pulled.player).dash?.direction).toBe(1)
  })

  it('boosts Saiyu forward jump via Staff Vault while holding his staff', () => {
    const start = duel('saiyu', 'kurapika')
    const armed = steps(start, PREJUMP_FRAMES + 1, { jump: true, right: true })
    const disarmedState: FightState = {
      ...start,
      player: { ...start.player, weaponsConfiscated: true },
    }
    const disarmed = steps(disarmedState, PREJUMP_FRAMES + 1, { jump: true, right: true })
    expect(armed.player.velocityY).toBeGreaterThan(disarmed.player.velocityY * 1.08)
    expect(motionOf(armed.player).velocityX).toBeGreaterThan(
      motionOf(disarmed.player).velocityX * 1.12,
    )
  })
})
