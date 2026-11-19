import { humanAnimationRig } from '$lib/tour/humanAnimation'
import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { beginFight, createFight, performAuraAttack, performMove, tickFight } from './engine'
import { canUseMovesetMove, moveForSlot } from './movesets'
import { HANZO_PHYSICAL_POSES } from './keyPosesHanzoPhysical'
import { keyPoseTimeline } from './keyPoseMoves'
import { sampleTimeline } from './keyPoseTimeline'
import { hanzoAiSlots, moveHanzoOpponent } from './hanzoAi'
import { bodyPlan, fightBodyMotion } from './fightBodyMotion'
import { buildFightFigure } from './fighterFigure'
import { boneSnapshot, physicalJoints, physicalViolations } from './physicalAuditTestKit'
import { motionOf, steerFighter } from './fighterMovement'
import { styleMobility, styleReactionFrames } from './styleMobility'
import { EMPTY_INPUT, type ArcadeFighter, type FightState, type MoveSlot } from './types'

function duel(): FightState {
  const state = beginFight(
    createFight('hanzo', 'hisoka', { mode: 'versus-local', formatId: 'knockout' }),
  )
  return { ...state, player: { ...state.player, x: 35 }, opponent: { ...state.opponent, x: 75 } }
}

function strike(state: FightState, slot: MoveSlot): FightState {
  const move = moveForSlot('hanzo', slot)!
  return performAuraAttack({
    state,
    side: 'player',
    kind: move.kind,
    moveId: move.id,
    variant: move.variant,
    auraCharged: false,
  })
}

describe('Hanzo — Hunter Exam hand-to-hand combat', () => {
  it('holds each authored hand or leg contact throughout its actual active frames', () => {
    expect(Object.keys(HANZO_PHYSICAL_POSES)).toHaveLength(12)
    for (const slot of Object.keys(HANZO_PHYSICAL_POSES) as MoveSlot[]) {
      const move = moveForSlot('hanzo', slot)!,
        timeline = keyPoseTimeline('hanzo', slot)!
      const first = sampleTimeline(timeline, { frame: move.tuning.startup, frames: move.tuning })
      const last = sampleTimeline(timeline, {
        frame: move.tuning.startup + move.tuning.active - 1,
        frames: move.tuning,
      })
      expect(last, slot).toEqual(first)
      expect(move.auraCost, slot).toBe(0)
      expect(move.reversalInvulnerableFrames, slot).toBe(0)
    }
  })

  it.each(['forwardSpecial', 'downSpecial', 'backSpecial'] as const)(
    '%s is a physical strike at zero aura, in Zetsu and with Skill 4 stolen',
    (slot) => {
      const state = duel()
      state.player = {
        ...state.player,
        aura: 0,
        nen: { ...state.player.nen, mode: 'zetsu' },
        hatsuEffects: { ...state.player.hatsuEffects, hatsuStolen: 1 },
      }
      expect(canUseMovesetMove(state, 'player', moveForSlot('hanzo', slot)!)).toBe(true)
      const next = strike(state, slot)
      expect(next.player.attack?.moveId).toBe(`hanzo:${slot}`)
      expect(next.player.attack?.hatsuSource).toBeNull()
      expect(next.player.aura).toBe(0)
      expect(next.player.hanzoProjection).toBeUndefined()
    },
  )

  it('keeps distant opponents safe and never converts a dash palm into a teleport', () => {
    const initial = duel()
    let state = strike(initial, 'forwardSpecial')
    for (let frame = 0; frame < 45; frame++)
      state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT, ai: false })
    expect(state.opponent.health).toBe(initial.opponent.health)
    expect(Math.abs(state.player.x - initial.player.x)).toBeLessThan(5)
    expect(state.player.x).toBeLessThan(state.opponent.x)
    expect(state.player.hanzoProjection).toBeUndefined()
  })

  it('retains a vulnerable, paid Skill 4 preparation, with no activation strike', () => {
    const initial = duel()
    const state = performMove({ state: initial, side: 'player', action: 'special' })
    expect(state.player.hanzoProjection?.startupFrames).toBeGreaterThan(0)
    expect(state.player.hanzoProjection?.bodyX).toBe(initial.player.x)
    expect(state.player.aura).toBeLessThan(initial.player.aura)
    expect(state.player.attack).toBeNull()
    expect(state.opponent.health).toBe(initial.opponent.health)
  })

  it('prefers actual hand-to-hand approaches and varies sweeps, palms and throws', () => {
    const state = { ...duel(), opponent: { ...duel().player, x: 60 }, player: duel().opponent }
    expect(hanzoAiSlots({ state, gap: 18, roll: 0.6 })[0]).toBe('forwardLight')
    expect(hanzoAiSlots({ state, gap: 8, roll: 0.3 })[0]).toBe('lowLight')
    expect(hanzoAiSlots({ state, gap: 8, roll: 0.6 })[0]).toBe('standingLight')
    expect(hanzoAiSlots({ state, gap: 4, roll: 0.1 })[0]).toBe('throw')
    expect(hanzoAiSlots({ state, gap: 34, roll: 0.9 })[0]).toBe('neutralSpecial')
  })

  it.each([1, -1] as const)(
    'takes a finite approach or withdrawal facing %s, subject to observation',
    (facing) => {
      const fighter = observed(facing)
      const target = { ...duel().opponent, x: fighter.x + facing * 24 }
      const next = moveHanzoOpponent(fighter, target)!
      expect(motionOf(next).dash?.frames).toBe(styleMobility(fighter).forwardDash.frames)
      expect(Math.abs(next.x - fighter.x)).toBeLessThan(3)
      expect(next.wakeupInvulnerableFrames).toBe(0)
      const threatened = {
        ...fighter,
        pressureRead: { ...fighter.pressureRead!, move: 'hisoka:standingHeavy', seen: 0 },
      }
      target.x = fighter.x + facing * 10
      expect(moveHanzoOpponent(threatened, target)).toBeNull()
      const reacts = moveHanzoOpponent(
        {
          ...threatened,
          pressureRead: { ...threatened.pressureRead, seen: styleReactionFrames(fighter) },
        },
        target,
      )!
      expect(motionOf(reacts).dash?.direction).toBe(-facing)
      expect(reacts.health).toBe(fighter.health)
      let travel = next
      for (let i = 0; i < 20; i++)
        travel = steerFighter(travel, { input: EMPTY_INPUT, mobile: true, jumpable: false })
      expect(motionOf(travel).dash).toBeNull()
    },
  )

  it('never uses the physical step while blind, injured, airborne or controlling a double', () => {
    const fighter = observed(1),
      target = { ...duel().opponent, x: fighter.x + 24 }
    const unavailable: ArcadeFighter[] = [
      { ...fighter, hitStun: 5 },
      { ...fighter, y: 5 },
      { ...fighter, hatsuEffects: { ...fighter.hatsuEffects, senseSeals: 1 } },
      {
        ...fighter,
        hanzoProjection: {
          bodyX: fighter.x,
          bodyFacing: 1,
          bodyNen: fighter.nen,
          startupFrames: 0,
        },
      },
    ]
    for (const actor of unavailable) expect(moveHanzoOpponent(actor, target)).toBeNull()
  })
})

function observed(facing: 1 | -1): ArcadeFighter {
  return {
    ...duel().player,
    x: 50,
    facing,
    pressureRead: { clock: 120, attackFrame: -1, seen: 0, lastHit: -1000, impact: -1 },
  }
}

it.each([1, -1] as const)(
  'Hanzo preserves joint limits and bone lengths throughout every physical strike facing %s',
  (facing) => {
    const glow = (colour: number) => new THREE.MeshBasicMaterial({ color: colour })
    const model = buildFightFigure({ THREE, glow, fighter: duel().player })
    for (const slot of Object.keys(HANZO_PHYSICAL_POSES) as MoveSlot[]) {
      const move = moveForSlot('hanzo', slot)!,
        state = duel()
      if (move.variant === 'air') state.player.y = 5
      const actor = { ...strike(state, slot).player, facing }
      expect(actor.attack?.moveId).toBe(move.id)
      const baseline = JSON.stringify(actor)
      const total = move.tuning.startup + move.tuning.active + move.tuning.recovery
      let bones: ReturnType<typeof boneSnapshot> | undefined
      for (let frame = 0; frame <= total; frame++) {
        const fighter = { ...actor, attack: { ...actor.attack!, frame } }
        model.animate(frame / 60, 'idle', {
          transitionSeconds: 0,
          motion: fightBodyMotion({ fighter, seconds: frame / 60, progress: 0 }),
        })
        model.root.updateMatrixWorld(true)
        const joints = physicalJoints(model.root)
        expect(physicalViolations(joints), `${slot} frame ${frame}`).toEqual([])
        if (move.variant !== 'air') {
          const soles = joints
            .filter((joint) => joint.kind === 'ankle')
            .map((joint) => new THREE.Box3().setFromObject(joint.node, true).min.y)
          expect(Math.min(...soles), `${slot} grounded frame ${frame}`).toBeGreaterThanOrEqual(0)
          expect(Math.min(...soles), `${slot} grounded frame ${frame}`).toBeLessThan(0.015)
        }
        bones ??= boneSnapshot(joints)
        expect(boneSnapshot(joints), `${slot} frame ${frame}`).toEqual(bones)
        expect(bodyPlan(fighter, { seconds: frame / 60, progress: 0 })?.key).toBe(
          `attack:${move.id}`,
        )
      }
      expect(JSON.stringify(actor)).toBe(baseline)
    }
  },
)

it.each(['lowLight', 'lowHeavy', 'downSpecial'] as const)(
  'Hanzo unfolds the %s striking leg toward the opponent',
  (slot) => {
    const move = moveForSlot('hanzo', slot)!
    const fighter = strike(duel(), slot).player
    fighter.attack = { ...fighter.attack!, frame: move.tuning.startup }
    const model = buildFightFigure({
      THREE,
      glow: (colour) => new THREE.MeshBasicMaterial({ color: colour }),
      fighter,
    })
    model.animate(0, 'idle', {
      transitionSeconds: 0,
      motion: fightBodyMotion({ fighter, seconds: 0, progress: 0 }),
    })
    model.root.updateMatrixWorld(true)
    const human = humanAnimationRig(model.turns)!
    const side = 1
    const hip = human.legs[side].getWorldPosition(new THREE.Vector3())
    const foot = human.knees[side].children[1].getWorldPosition(new THREE.Vector3())
    expect(
      foot.z - hip.z,
      JSON.stringify({
        slot,
        variant: fighter.attack.variant,
        plan: bodyPlan(fighter, { seconds: 0, progress: 0 })?.pose,
        hip: human.legs[side].rotation.toArray(),
        knee: human.knees[side].rotation.toArray(),
        foot: foot.toArray(),
      }),
    ).toBeGreaterThan(0.15)
  },
)
