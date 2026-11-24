import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAuraAttack, tickFight } from './engine'
import { performArsenalAction } from './arsenalExecution'
import { FIXED_STEP, hurtboxes } from './frameData'
import { motionOf, PREJUMP_FRAMES, steerFighter } from './fighterMovement'
import { performGumSpringStep } from './gumSpringStep'
import { strikeDefender } from './combatDamage'
import {
  BISCUIT_TRUE_FORM_GUARD_KNOCKBACK,
  WALL_REBOUND_VELOCITY_Y,
} from './characterMovementTech'
import { DASH_BRAKE_MIN_FRAME, SWAY_FRAMES, SWAY_UPPER_SHIFT } from './movementTech'
import { movementTechPose } from './movementTechPoses'
import { aiBackSwayInput, aiWakeupInput } from './movementTechAi'
import { DELAYED_WAKEUP_FRAMES, UKEMI_ROLL_FRAMES, UKEMI_ROLL_SPEED } from './wakeupMovement'
import { EMPTY_INPUT, type ArcadeFighter, type FightInput, type FightState, type FighterId } from './types'

const step = (state: FightState, input: Partial<FightInput> = {}) =>
  tickFight(state, { ...EMPTY_INPUT, ...input }, FIXED_STEP + 1e-9)

function steps(state: FightState, count: number, input: Partial<FightInput> = {}) {
  let next = state
  for (let i = 0; i < count; i += 1) next = step(next, input)
  return next
}

const duel = (p1: FighterId = 'kurapika', p2: FighterId = 'hisoka') =>
  beginFight(createFight(p1, p2, { mode: 'versus-local' }))

function startForwardDash(state: FightState, extra: Partial<FightInput> = {}) {
  let next = steps(state, 2, { right: true, ...extra })
  next = steps(next, 2, extra)
  return step(next, { right: true, ...extra })
}

describe('universal martial & Nen movement techniques', () => {
  it('brakes a forward dash cleanly after the push beat', () => {
    const start = duel()
    const dashed = startForwardDash(start)
    expect(motionOf(dashed.player).dash).not.toBeNull()
    const mid = steps(dashed, DASH_BRAKE_MIN_FRAME)
    const braked = step(mid, { left: true })
    expect(motionOf(braked.player).dash).toBeNull()
    const fullRun = steps(dashed, 16)
    expect(braked.player.x).toBeLessThan(fullRun.player.x)
  })

  it('produces a lower short hop when jump is released during prejump', () => {
    const start = duel()
    let full = steps(start, PREJUMP_FRAMES + 1, { jump: true })
    let short = step(start, { jump: true })
    short = steps(short, PREJUMP_FRAMES)
    let fullPeak = full.player.y
    let shortPeak = short.player.y
    for (let i = 0; i < 30; i += 1) {
      full = step(full)
      short = step(short)
      fullPeak = Math.max(fullPeak, full.player.y)
      shortPeak = Math.max(shortPeak, short.player.y)
    }
    expect(shortPeak).toBeGreaterThan(0)
    expect(shortPeak).toBeLessThan(fullPeak * 0.65)
  })

  it('pulls the upper hurtbox back during a Back Sway while leaving legs exposed', () => {
    const start = duel()
    const baseBoxes = hurtboxes(start.player)
    const swayed = step(start, { left: true, guard: true })
    expect(swayed.player.swayFrames).toBe(SWAY_FRAMES)
    const swayBoxes = hurtboxes(swayed.player)
    // Lower leg hurtbox stays in place; upper torso/head hurtbox shifts backward.
    expect(swayBoxes[0].right).toBeCloseTo(baseBoxes[0].right, 5)
    expect(swayBoxes[1].right).toBeCloseTo(baseBoxes[1].right - SWAY_UPPER_SHIFT, 5)
  })

  it('accelerates forward walk during the post-guard Ryu window (Parry Advancing Step)', () => {
    const start = duel()
    const normalWalk = steps(start, 8, { right: true }).player.x - start.player.x
    const withWindow: FightState = {
      ...start,
      player: { ...start.player, ryuWindow: 10 },
    }
    const boostedWalk = steps(withWindow, 8, { right: true }).player.x - start.player.x
    expect(boostedWalk).toBeGreaterThan(normalWalk * 1.2)
  })

  it('boosts forward dash and jump when Ryu/Gyo is concentrated in the feet', () => {
    const start = duel()
    const normalDash = startForwardDash(start)
    const focusedFighter = {
      ...start.player,
      nen: { ...start.player.nen, ryu: { head: 0.1, torso: 0.1, hands: 0.1, feet: 0.7 } },
    }
    let tapped = steerFighter(focusedFighter, {
      input: { ...EMPTY_INPUT, right: true },
      mobile: true,
      jumpable: false,
    })
    tapped = steerFighter(tapped, { input: EMPTY_INPUT, mobile: true, jumpable: false })
    const boostedDash = steerFighter(tapped, {
      input: { ...EMPTY_INPUT, right: true },
      mobile: true,
      jumpable: false,
    })
    expect(motionOf(boostedDash).dash!.peak).toBeGreaterThan(
      motionOf(normalDash.player).dash!.peak,
    )
    const normalJump = steps(start, PREJUMP_FRAMES + 1, { jump: true }).player.velocityY
    let pre = steerFighter(focusedFighter, {
      input: { ...EMPTY_INPUT, jump: true },
      mobile: true,
      jumpable: true,
    })
    for (let i = 0; i < PREJUMP_FRAMES; i += 1) {
      pre = steerFighter(pre, {
        input: { ...EMPTY_INPUT, jump: true },
        mobile: true,
        jumpable: false,
      })
    }
    expect(pre.velocityY).toBeGreaterThan(normalJump)
  })

  it('skips prejump squat and accelerates backdash under En Reflex', () => {
    const start = duel()
    const alertFighter = { ...start.player, enReflexActive: true }
    const instantJump = steerFighter(alertFighter, {
      input: { ...EMPTY_INPUT, jump: true },
      mobile: true,
      jumpable: true,
    })
    expect(instantJump.velocityY).toBeGreaterThan(0)
    const backTap = (fighter: ArcadeFighter) => {
      let next = steerFighter(fighter, {
        input: { ...EMPTY_INPUT, left: true },
        mobile: true,
        jumpable: false,
      })
      next = steerFighter(next, { input: EMPTY_INPUT, mobile: true, jumpable: false })
      return steerFighter(next, {
        input: { ...EMPTY_INPUT, left: true },
        mobile: true,
        jumpable: false,
      })
    }
    expect(motionOf(backTap(alertFighter)).dash!.peak).toBeGreaterThan(
      motionOf(backTap(start.player)).dash!.peak,
    )
  })
})

describe('wakeup movement (delayed wakeup & ukemi roll)', () => {
  it('delays wakeup once when holding down on the last knockdown frame', () => {
    const base = duel()
    const downed: FightState = {
      ...base,
      player: { ...base.player, knockdownFrames: 1 },
    }
    const delayed = step(downed, { down: true })
    expect(delayed.player.knockdownFrames).toBe(DELAYED_WAKEUP_FRAMES)
    expect(delayed.player.wakeupDelayUsed).toBe(true)
    const finished = steps(delayed, DELAYED_WAKEUP_FRAMES, { down: true })
    expect(finished.player.knockdownFrames).toBe(0)
  })

  it('performs a directional ukemi roll when waking with direction + guard', () => {
    const base = duel()
    const downed: FightState = {
      ...base,
      player: { ...base.player, x: 40, knockdownFrames: 1 },
    }
    const rolled = step(downed, { left: true, guard: true })
    expect(rolled.player.ukemiRoll).toEqual({ direction: -1, frames: UKEMI_ROLL_FRAMES })
    const after = steps(rolled, UKEMI_ROLL_FRAMES)
    expect(after.player.x).toBeCloseTo(40 - UKEMI_ROLL_FRAMES * UKEMI_ROLL_SPEED, 3)
    expect(after.player.ukemiRoll).toBeUndefined()
  })
})

describe('canon character movement techniques', () => {
  it('lets assassins perform a crouched low slide without down braking it', () => {
    const start = duel('feitan', 'kurapika')
    const slid = startForwardDash(start, { down: true })
    expect(motionOf(slid.player).dash?.lowDodge).toBe(true)
    const continued = steps(slid, DASH_BRAKE_MIN_FRAME + 1, { down: true })
    expect(motionOf(continued.player).dash).not.toBeNull()
  })

  it('softens Kalluto fall gravity with Paper Wind Float when aura is available', () => {
    const start = duel('kalluto', 'kurapika')
    const airKalluto: FightState = {
      ...start,
      player: { ...start.player, y: 12, velocityY: -10, aura: 50 },
    }
    const zetsuKalluto: FightState = {
      ...airKalluto,
      player: { ...airKalluto.player, nen: { ...airKalluto.player.nen, mode: 'zetsu' } },
    }
    const floated = steps(airKalluto, 4)
    const dropped = steps(zetsuKalluto, 4)
    expect(floated.player.y).toBeGreaterThan(dropped.player.y)
  })

  it('accelerates Bonolenov dashes into spinning steps during Prologue', () => {
    const start = duel('bonolenov', 'kurapika')
    const normalDash = startForwardDash(start)
    const dancing: FightState = {
      ...start,
      player: {
        ...start.player,
        battleCantabile: { models: {}, preparation: null, prologue: true, form: null },
      },
    }
    const spinDash = startForwardDash(dancing)
    expect(motionOf(spinDash.player).dash!.peak).toBeGreaterThan(
      motionOf(normalDash.player).dash!.peak,
    )
  })

  it('rebounds Hisoka diagonally out of the corner on elastic foot spring', () => {
    const injured = beginFight(
      createFight('hisoka', 'kurapika', {
        mode: 'versus-local',
        environment: {
          preparation: {
            mode: 'scenario',
            resources: [],
            cohorts: [],
            injuries: { player: 'hand-and-lower-leg' },
          },
        },
      }),
    )
    const formed = steps(
      performArsenalAction(
        { state: injured, side: 'player', command: { action: 'gum-prosthesis' } },
        performAuraAttack,
      ),
      30,
    )
    const cornered: FightState = {
      ...formed,
      player: { ...formed.player, x: 9, facing: 1 },
    }
    const rebounded = performGumSpringStep(cornered, 'player')
    expect(rebounded.player.y).toBeGreaterThan(0)
    expect(rebounded.player.velocityY).toBe(WALL_REBOUND_VELOCITY_Y)
    expect(motionOf(rebounded.player).velocityX).toBeGreaterThan(0)
  })

  it('reduces guard pushback by 25% for Biscuit in her true form', () => {
    const base = duel('kurapika', 'biscuit')
    const attacker = {
      ...base.player,
      x: 35,
      attack: {
        kind: 'heavy' as const,
        frame: 12,
        impacted: false,
        confirmedHit: false,
        auraCharged: false,
        concealed: false,
        hatsuSource: null,
        projectileSpawned: false,
        reversal: false,
      },
    }
    const smallBiscuit = { ...base.opponent, x: 45, biscuitTrueForm: false }
    const trueBiscuit = { ...base.opponent, x: 45, biscuitTrueForm: true }
    const smallPush =
      strikeDefender({
        fighter: smallBiscuit,
        attacker,
        damage: 2,
        blocked: true,
        knockdown: false,
        antiAir: false,
        wallSplat: false,
        counterHit: false,
        comboHits: 0,
      }).x - 45
    const truePush =
      strikeDefender({
        fighter: trueBiscuit,
        attacker,
        damage: 2,
        blocked: true,
        knockdown: false,
        antiAir: false,
        wallSplat: false,
        counterHit: false,
        comboHits: 0,
      }).x - 45
    expect(truePush).toBeCloseTo(smallPush * BISCUIT_TRUE_FORM_GUARD_KNOCKBACK, 4)
  })
})

describe('dedicated 3D poses and defensive AI movement', () => {
  it('returns dedicated 3D poses for Ukemi roll, Back Sway, and Low Slide', () => {
    const base = duel('feitan', 'kurapika')
    expect(movementTechPose(base.player, {})).toBeNull()
    const ukemi = movementTechPose(
      { ...base.player, ukemiRoll: { direction: -1, frames: 5 } },
      {},
    )
    expect(ukemi?.key).toBe('ukemi:-1')
    expect(ukemi?.pose.root?.[1]).toBeLessThan(0)
    const sway = movementTechPose({ ...base.player, swayFrames: 5 }, {})
    expect(sway?.key).toBe('sway:back')
    expect(sway?.pose.body?.[0]).toBeLessThan(0)
    const slid = startForwardDash(base, { down: true })
    const slide = movementTechPose(slid.player, {})
    expect(slide?.key).toBe('dash:low-slide')
    expect(slide?.pose.root?.[1]).toBeLessThan(-0.05)
  })

  it('lets the AI choose deterministic Ukemi roll or Delayed Wakeup under pressure', () => {
    const base = duel('kurapika', 'feitan')
    const fighter: ArcadeFighter = { ...base.opponent, x: 50, health: 90, knockdownFrames: 1 }
    const target: ArcadeFighter = { ...base.player, x: 40 }
    const rollInput = aiWakeupInput(fighter, target, 0)
    expect(rollInput.guard).toBe(true)
    expect(rollInput.right).toBe(true)
    const delayInput = aiWakeupInput(fighter, target, 1)
    expect(delayInput.down).toBe(true)
  })

  it('lets mobile/control AI trigger Back Sway against a visible standing poke', () => {
    const base = duel('feitan', 'kurapika')
    const ai: ArcadeFighter = { ...base.opponent, x: 50, facing: -1 }
    const poking: ArcadeFighter = {
      ...base.player,
      x: 40,
      attack: {
        kind: 'light',
        variant: 'standing',
        frame: 3,
        impacted: false,
        confirmedHit: false,
        auraCharged: false,
        concealed: false,
        hatsuSource: null,
        projectileSpawned: false,
        reversal: false,
      },
    }
    const swayInput = aiBackSwayInput(ai, poking)
    expect(swayInput).not.toBeNull()
    expect(swayInput?.guard).toBe(true)
    expect(swayInput?.right).toBe(true)
  })
})
