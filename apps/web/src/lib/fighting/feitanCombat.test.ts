import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { beginFight, createFight, performMove, tickFight, performAuraAttack } from './engine'
import { moveForSlot } from './movesets'
import { FEITAN_BLADE_POSES } from './keyPosesFeitanBlade'
import { keyPoseTimeline } from './keyPoseMoves'
import { sampleTimeline } from './keyPoseTimeline'
import { feitanAiSlots, moveFeitanOpponent } from './feitanAi'
import { createFeitanBladeScene } from './feitanBladeScene'
import { styleMobility } from './styleMobility'
import { bodyPlan } from './fightBodyMotion'
import { arsenalAttackSlots } from './arsenalAi'
import { fighterKeyedMove } from './fighterKeyedMove'
import { motionOf, steerFighter, walkSpeed } from './fighterMovement'
import { recordFightInjuries } from './feitanPain'
import { EMPTY_INPUT, type ArcadeFighter, type FightState, type MoveSlot } from './types'

function duel(): FightState {
  const state = beginFight(
    createFight('hisoka', 'feitan', { mode: 'versus-local', formatId: 'knockout' }),
  )
  return {
    ...state,
    player: { ...state.player, x: 50 },
    opponent: { ...state.opponent, x: 60, facing: -1 },
  }
}

function observed(state = duel()) {
  return {
    ...state.opponent,
    pressureRead: { clock: 96, attackFrame: -1, seen: 0, lastHit: -1000, impact: -1 },
  }
}

describe('Feitan — the two Zazan video references', () => {
  it('authors moving cuts and holds only the straight thrust contacts', () => {
    expect(Object.keys(FEITAN_BLADE_POSES)).toHaveLength(12)
    for (const slot of Object.keys(FEITAN_BLADE_POSES) as MoveSlot[]) {
      const move = moveForSlot('feitan', slot)!
      const timeline = keyPoseTimeline('feitan', slot)!
      const contact = sampleTimeline(timeline, { frame: move.tuning.startup, frames: move.tuning })
      const held = sampleTimeline(timeline, {
        frame: move.tuning.startup + move.tuning.active - 1,
        frames: move.tuning,
      })
      const cuts = [
        'standingHeavy',
        'lowHeavy',
        'airHeavy',
        'forwardHeavy',
        'backHeavy',
        'downSpecial',
        'backSpecial',
      ]
      if (cuts.includes(slot)) expect(held, slot).not.toEqual(contact)
      else expect(held, slot).toEqual(contact)
      expect(move.auraCost, slot).toBe(0)
      expect(move.reversalInvulnerableFrames, slot).toBe(0)
    }
  })

  it.each(['forwardSpecial', 'downSpecial', 'backSpecial'] as const)(
    '%s remains a physical strike with no aura or voluntary Nen available',
    (slot) => {
      const state = duel()
      state.opponent.aura = 0
      state.opponent.nen.mode = 'zetsu'
      const move = moveForSlot('feitan', slot)!
      const next = performAuraAttack({
        state,
        side: 'opponent',
        kind: move.kind,
        moveId: move.id,
        auraCharged: false,
      })
      expect(next.opponent.attack?.moveId).toBe(move.id)
      expect(next.opponent.attack?.hatsuSource).toBeNull()
      expect(next.opponent.aura).toBe(0)
      expect(next.opponent.hatsuEffects.painPacker).toEqual(state.opponent.hatsuEffects.painPacker)
    },
  )

  it('cannot hit a distant enemy with an invisible long-range sword or teleport behind it', () => {
    const state = duel()
    state.opponent.x = 80
    let next = performMove({
      state,
      side: 'opponent',
      action: 'special',
      input: { ...EMPTY_INPUT, left: true },
    })
    for (let frame = 0; frame < 40; frame++)
      next = tickFight(next, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
    expect(next.player.health).toBe(state.player.health)
    expect(next.opponent.x).toBeGreaterThan(state.player.x)
    expect(next.opponent.hatsuEffects.painPacker?.injuries).toBe(0)
  })

  it('prefers blade pressure when uninjured and reserves armour for real injuries and space', () => {
    const state = duel()
    expect(feitanAiSlots({ state, gap: 15, roll: 0.4 })[0]).toBe('forwardLight')
    const wounded = recordFightInjuries(state, {
      ...state,
      opponent: {
        ...state.opponent,
        health: state.opponent.health - state.opponent.maxHealth * 0.25,
      },
    })
    expect(feitanAiSlots({ state: wounded, gap: 15, roll: 0.4 })[0]).toBe('neutralSpecial')
    expect(feitanAiSlots({ state: wounded, gap: 6, roll: 0.4 })[0]).toBe('standingLight')
  })

  it.each([1, -1] as const)('uses finite dashes and real jump startup facing %s', (facing) => {
    const fighter = { ...observed(), facing }
    const target = { ...duel().player, x: fighter.x + facing * 20 }
    const dashed = moveFeitanOpponent(fighter, target)!
    expect(motionOf(dashed).dash?.frames).toBe(styleMobility(fighter).forwardDash.frames)
    expect(Math.abs(dashed.x - fighter.x)).toBeLessThan(3)
    expect(dashed.health).toBe(fighter.health)
    const jumper = { ...fighter, pressureRead: { ...fighter.pressureRead, clock: 48 } }
    const jumped = moveFeitanOpponent(jumper, target)!
    expect(motionOf(jumped).prejumpFrames).toBeGreaterThan(0)
    expect(jumped.y).toBe(0)
    expect(jumped.attack).toBeNull()
  })

  it('reacts to observed pressure, preserves injury and respects blindness and occupied bodies', () => {
    const fighter = observed()
    const target = { ...duel().player, x: fighter.x - 10 }
    expect(moveFeitanOpponent(fighter, target)).toBeNull()
    const aware = { ...fighter, pressureRead: { ...fighter.pressureRead, seen: 20, move: 'heavy' } }
    const retreat = moveFeitanOpponent(aware, target)!
    expect(retreat.x).toBeGreaterThan(fighter.x)
    expect(retreat.health).toBe(fighter.health)
    expect(moveFeitanOpponent({ ...aware, hitStun: 12 }, target)).toBeNull()
    expect(
      moveFeitanOpponent(
        { ...aware, hatsuEffects: { ...aware.hatsuEffects, senseSeals: 1 } },
        target,
      ),
    ).toBeNull()
  })

  it('keeps the same anatomical weapon arm when sides switch', () => {
    const fighter = duel().opponent
    const move = moveForSlot('feitan', 'standingHeavy')!
    const state = performAuraAttack({
      state: duel(),
      side: 'opponent',
      kind: 'heavy',
      moveId: move.id,
      auraCharged: false,
    })
    const atContact = {
      ...state.opponent,
      attack: { ...state.opponent.attack!, frame: move.tuning.startup },
    }
    const right = bodyPlan({ ...atContact, facing: 1 }, { seconds: 0, progress: 0 })!
    const left = bodyPlan({ ...atContact, facing: -1 }, { seconds: 0, progress: 0 })!
    expect(left.pose.leadShoulder![0]).toEqual(right.pose.rearShoulder![0])
    expect(left.pose.leadShoulder![2]).toEqual(-right.pose.rearShoulder![2])
    expect(fighter.hatsuEffects.painPacker?.armour).toBe(false)
  })

  it('makes his actual ground travel distinctly faster than an already mobile fighter', () => {
    const state = duel()
    let feitan: ArcadeFighter = { ...state.opponent, x: 30, facing: 1 }
    let hisoka: ArcadeFighter = { ...state.player, x: 30, facing: 1 }
    const options = { input: { ...EMPTY_INPUT, right: true }, mobile: true, jumpable: false }
    for (let frame = 0; frame < 30; frame++) {
      feitan = steerFighter(feitan, options)
      hisoka = steerFighter(hisoka, options)
    }
    expect(feitan.x - 30).toBeGreaterThan((hisoka.x - 30) * 1.15)
    expect(feitan.x - 30).toBeCloseTo(walkSpeed(feitan) * 0.5)
    expect(walkSpeed(feitan) * styleMobility(feitan).backWalk).toBeGreaterThan(
      walkSpeed(hisoka) * styleMobility(hisoka).backWalk,
    )
    expect(styleMobility(feitan).forwardDash.peak).toBeGreaterThan(
      styleMobility(hisoka).forwardDash.peak,
    )
  })
})

describe('Feitan reference corrections', () => {
  it('keeps normal blade pressure ahead of the generic Nen preparation projection', () => {
    const state = duel()
    state.opponent.nenTactics = { goal: 'fight', slots: ['downSpecial'], range: [5, 9], reserve: 0 }
    expect(arsenalAttackSlots({ state, gap: 8, roll: 0.5 })[0]).toBe('standingLight')
  })

  it('does not turn a minor scratch into an immediate solar setup', () => {
    const before = duel()
    const state = recordFightInjuries(before, {
      ...before,
      opponent: { ...before.opponent, health: before.opponent.health - 5 },
    })
    expect(feitanAiSlots({ state, gap: 15, roll: 0.5 })).not.toContain('neutralSpecial')
    expect(
      performMove({ state, side: 'opponent', action: 'special' }).opponent.attack?.moveId,
    ).toBe('feitan:neutralSpecial')
  })

  it('uses a right umbrella aim instead of crossing the arms for a physical shot', () => {
    const state = duel()
    const next = performAuraAttack({ state, side: 'opponent', kind: 'ranged', auraCharged: false })
    const timeline = fighterKeyedMove(next.opponent, 'neutralSpecial').timeline
    const contact = timeline.find((key) => key.phase === 'active')!.pose
    expect(contact.rearShoulder![0]).toBeLessThan(-1)
    expect(contact.leadShoulder![0]).toBeGreaterThan(-0.8)
  })

  it('slips a seen high line with a real crouching body, without granting immunity', () => {
    const state = duel()
    const striking = performAuraAttack({
      state,
      side: 'player',
      kind: 'heavy',
      moveId: 'hisoka:backHeavy',
      auraCharged: false,
    })
    const fighter = {
      ...observed(),
      pressureRead: { ...observed().pressureRead, seen: 15, move: 'hisoka:backHeavy' },
    }
    const slipped = moveFeitanOpponent(fighter, striking.player)!
    expect(slipped.crouching).toBe(true)
    expect(slipped.blocking).toBe(false)
    expect(slipped.wakeupInvulnerableFrames).toBe(0)
    expect(slipped.x).toBe(fighter.x)
  })

  it('hops an observed sweep through normal prejump rather than teleporting', () => {
    const state = duel()
    const sweeping = performAuraAttack({
      state,
      side: 'player',
      kind: 'heavy',
      moveId: 'hisoka:lowHeavy',
      auraCharged: false,
      variant: 'low',
    })
    const fighter = {
      ...observed(),
      pressureRead: { ...observed().pressureRead, seen: 15, move: 'hisoka:lowHeavy' },
    }
    const hop = moveFeitanOpponent(fighter, sweeping.player)!
    expect(motionOf(hop).prejumpFrames).toBeGreaterThan(0)
    expect(hop.y).toBe(0)
    expect(hop.wakeupInvulnerableFrames).toBe(0)
  })
})

describe('Feitan physical sword presentation', () => {
  it('keeps the left sword and right umbrella together, rebuilds, confiscates and disposes', () => {
    const scene = new THREE.Scene()
    let figure = rig()
    const effects = createFeitanBladeScene({
      THREE,
      scene,
      figureOf: () => figure,
      worldX: (x) => x,
      worldY: (y) => y,
    })
    let state = duel()
    effects.sync(state, 0)
    const blade = figure.getObjectByName('feitan-blade:opponent')!
    expect(blade.visible).toBe(true)
    expect(blade.parent?.name).toBe('hand-left')
    expect(figure.getObjectByName('signature-umbrella-cloth')?.visible).toBe(true)
    state = performAuraAttack({
      state,
      side: 'opponent',
      kind: 'light',
      moveId: 'feitan:standingLight',
      auraCharged: false,
    })
    effects.sync(state, 0)
    expect(blade.visible).toBe(true)
    expect(figure.getObjectByName('signature-umbrella')?.visible).toBe(true)
    figure = rig()
    effects.sync({ ...state, opponent: { ...state.opponent, attack: null } }, 0)
    expect(figure.getObjectByName('feitan-blade:opponent')).toBe(blade)
    effects.sync({ ...state, opponent: { ...state.opponent, weaponsConfiscated: true } }, 0)
    expect(blade.visible).toBe(false)
    expect(figure.getObjectByName('signature-umbrella-cloth')?.visible).toBe(false)
    effects.dispose()
    expect(blade.parent).toBeNull()
    expect(figure.getObjectByName('signature-umbrella')?.visible).toBe(true)
  })
})

function rig() {
  const figure = new THREE.Group()
  const hand = new THREE.Group()
  hand.name = 'hand-right'
  for (const name of ['signature-umbrella', 'signature-umbrella-cloth']) {
    const object = new THREE.Group()
    object.name = name
    hand.add(object)
  }
  const swordHand = new THREE.Group()
  swordHand.name = 'hand-left'
  figure.add(hand, swordHand)
  return figure
}
