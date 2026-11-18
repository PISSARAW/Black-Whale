import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { FIGHTING_ROSTER } from './roster'
import { createFightState } from './fightState'
import { buildFightFigure } from './fighterFigure'
import { fightBodyMotion } from './fightBodyMotion'
import { fightRigOf, type FightRig } from './fightRig'
import { HUMAN_JOINT_LIMITS } from './fightJointLimits'
import { FIGHT_MODEL_POSES } from './sceneMotion'
import { moveForSlot } from './movesets'
import { attackData } from './frameData'
import { createFightContactAlignment } from './fightContactAlignment'
import { humanAnimationRig } from '$lib/tour/humanAnimation'
import { createFightReactionPresentation } from './fightReactionPresentation'
import { performAuraAttack, tickFight } from './engine'
import { EMPTY_INPUT } from './types'
import { trackFightOpponent } from './fighterFacing'
import { fightGroundContact } from './fightGroundContact'
import { fightReplayHash } from './fightReplayHash'
import type { ArcadeFighter, FighterId, MoveSlot } from './types'

const glow = (color: number, opacity: number) =>
  new THREE.MeshBasicMaterial({ color, opacity, transparent: opacity < 1 })
const SLOTS: MoveSlot[] = [
  'standingLight',
  'standingHeavy',
  'lowLight',
  'lowHeavy',
  'airLight',
  'airHeavy',
  'forwardLight',
  'forwardHeavy',
  'backHeavy',
  'neutralSpecial',
  'forwardSpecial',
  'downSpecial',
  'backSpecial',
  'throw',
  'finisher',
]
const EPSILON = 1e-9

function attacking(fighter: ArcadeFighter, slot: MoveSlot): ArcadeFighter[] {
  const move = moveForSlot(fighter.id, slot)
  if (!move) return []
  const start: ArcadeFighter = {
    ...fighter,
    pose: move.kind,
    y: slot.startsWith('air') ? 1.5 : 0,
    crouching: slot.startsWith('low'),
    attack: {
      kind: move.kind,
      variant: move.variant,
      moveId: move.id,
      frame: 0,
      impacted: false,
      auraCharged: false,
      concealed: false,
      hatsuSource: null,
      projectileSpawned: false,
      reversal: false,
    },
  }
  const data = attackData(move.kind, start)
  const frames = data.startup + data.active + data.recovery
  return Array.from({ length: Math.ceil(frames / 3) }, (_, index) => ({
    ...start,
    attack: { ...start.attack!, frame: index * 3 },
  }))
}

function situations(id: FighterId): ArcadeFighter[] {
  const base = createFightState(id, 'hisoka').player
  return ([1, -1] as const).flatMap((facing) => {
    const fighter = { ...base, facing }
    return [
      fighter,
      { ...fighter, pose: 'walk' as const, x: fighter.x + 1.3 },
      { ...fighter, crouching: true },
      ...[2, 10, 20].map((hitStun) => ({ ...fighter, pose: 'hit' as const, hitStun })),
      ...[5, 20, 40].map((frames) => ({
        ...fighter,
        pose: 'down' as const,
        knockdownFrames: frames,
      })),
      { ...fighter, pose: 'ko' as const },
      { ...fighter, pose: 'wakeup' as const, wakeupInvulnerableFrames: 9 },
      ...SLOTS.flatMap((slot) => attacking(fighter, slot)),
    ]
  })
}

type Limit = (typeof HUMAN_JOINT_LIMITS)[keyof typeof HUMAN_JOINT_LIMITS]

function outside(name: string, parts: readonly THREE.Object3D[], limit: Limit): string[] {
  return parts.flatMap((part, index) => {
    const outward = 'sided' in limit && limit.sided ? (index === 0 ? -1 : 1) : 1
    const { x, y, z } = part.rotation
    const values = { x, y, z: z * outward }
    return (['x', 'y', 'z'] as const)
      .filter((axis) => {
        const [low, high] = limit[axis]
        return values[axis] < low - EPSILON || values[axis] > high + EPSILON
      })
      .map((axis) => `${name}${index}.${axis}=${values[axis].toFixed(2)}`)
  })
}

function violations(rig: FightRig): string[] {
  const { human } = rig
  const limits = HUMAN_JOINT_LIMITS
  return [
    ...outside('head', [human.head], { ...limits.head, sided: false } as Limit),
    ...outside('chest', [rig.chest], { ...limits.chest, sided: false } as Limit),
    ...outside('shoulder', human.arms, limits.shoulder),
    ...outside('elbow', rig.elbows, limits.elbow),
    ...outside('wrist', rig.wrists, limits.wrist),
    ...outside('hip', human.legs, limits.hip),
    ...outside('knee', human.knees, limits.knee),
    ...outside('ankle', rig.ankles, limits.ankle),
  ]
}

describe('fighters only move like a human body', () => {
  it('never plays the civilian walking stride in a duel', () => {
    expect(FIGHT_MODEL_POSES.walk).not.toBe('walk')
    expect(Object.values(FIGHT_MODEL_POSES)).not.toContain('walk')
  })

  it.each(FIGHTING_ROSTER)(
    '$name: every stance, move, hit and fall stays inside human joint range',
    ({ id }) => {
      const states = situations(id)
      const model = buildFightFigure({ THREE, glow, fighter: states[0] })
      const found = new Set<string>()
      states.forEach((fighter, index) => {
        const seconds = index * 0.5
        model.animate(seconds, FIGHT_MODEL_POSES[fighter.pose], {
          motion: (human) => {
            fightBodyMotion({ fighter, seconds, progress: 0.5 })(human)
            const label = `${fighter.pose}:${fighter.attack?.moveId ?? ''}@${fighter.attack?.frame ?? ''}`
            violations(fightRigOf(human)).forEach((joint) => found.add(`${label} ${joint}`))
          },
        })
      })
      expect([...found]).toEqual([])
    },
  )

  it('keeps the legs in stance while walking, lifting one foot at a time', () => {
    const base = createFightState('kurapika', 'hisoka').player
    const model = buildFightFigure({ THREE, glow, fighter: base })
    const lifts: number[] = []
    for (let step = 0; step < 24; step++) {
      const fighter: ArcadeFighter = { ...base, pose: 'walk', x: base.x + step * 0.2 }
      model.animate(step / 10, FIGHT_MODEL_POSES.walk, {
        motion: (human) => {
          fightBodyMotion({ fighter, seconds: step / 10, progress: 0 })(human)
          const knees = human.knees.map((knee) => knee.rotation.x)
          // A stride swings one leg behind the other; a shuffle keeps both knees bent.
          knees.forEach((bend) => expect(bend).toBeGreaterThanOrEqual(0))
          lifts.push(Math.abs(knees[0] - knees[1]))
        },
      })
    }
    expect(Math.max(...lifts)).toBeGreaterThan(Math.min(...lifts))
  })
})

// The old joint matrix ended inside fightBodyMotion, before the scene's final IK.
it.each(FIGHTING_ROSTER)(
  '$name keeps its final contact pose anatomical in both orientations',
  ({ id }) => {
    const base = createFightState(id, 'leorio')
    const models = {
      player: buildFightFigure({ THREE, glow, fighter: base.player }),
      opponent: buildFightFigure({ THREE, glow, fighter: base.opponent }),
    }
    new THREE.Scene().add(models.player.root, models.opponent.root)
    let frame = 0
    for (const facing of [1, -1] as const)
      for (const slot of ['standingLight', 'standingHeavy', 'lowHeavy', 'forwardHeavy'] as const) {
        const player = attacking(base.player, slot)[0]
        if (!player) continue
        const state = {
          ...base,
          phase: 'fighting' as const,
          frame: ++frame,
          player: { ...player, x: facing === 1 ? 44 : 50, facing },
          opponent: {
            ...base.opponent,
            x: facing === 1 ? 50 : 44,
            facing: facing === 1 ? (-1 as const) : (1 as const),
          },
        }
        state.player.attack!.frame = attackData(state.player.attack!.kind, state.player).startup
        for (const side of ['player', 'opponent'] as const) {
          const fighter = state[side],
            model = models[side]
          model.root.position.set((fighter.x - 50) * 0.115, fighter.y * 0.12, 0)
          model.root.rotation.y = fighter.facing * 1.25
          model.animate(frame, FIGHT_MODEL_POSES[fighter.pose], {
            motion: fightBodyMotion({ fighter, seconds: frame, progress: 0 }),
          })
        }
        createFightContactAlignment((side) => models[side].turns)(state)
        for (const side of ['player', 'opponent'] as const)
          expect(
            violations(fightRigOf(humanAnimationRig(models[side].turns)!)),
            `${slot} facing ${facing}: ${side}`,
          ).toEqual([])
      }
  },
)

it.each([
  ['benjamin', 'forwardHeavy'],
  ['feitan', 'standingHeavy'],
] as const)(
  '%s %s stays anatomical after support and contact IK throughout a real attack',
  (id, slot) => {
    let state = createFightState(id, 'leorio', { mode: 'versus-local', formatId: 'knockout' })
    state = {
      ...state,
      phase: 'fighting',
      player: { ...state.player, x: 44 },
      opponent: { ...state.opponent, x: 50 },
    }
    const models = {
      player: buildFightFigure({ THREE, glow, fighter: state.player }),
      opponent: buildFightFigure({ THREE, glow, fighter: state.opponent }),
    }
    new THREE.Scene().add(models.player.root, models.opponent.root)
    const read = createFightReactionPresentation()
    const align = createFightContactAlignment((side) => models[side].turns)
    const draw = () => {
      const hash = fightReplayHash(state)
      const seconds = state.frame / 60
      for (const side of ['player', 'opponent'] as const) {
        const fighter = state[side],
          model = models[side]
        model.root.position.set((fighter.x - 50) * 0.115, fighter.y * 0.12, 0)
        model.root.rotation.y = fighter.facing * 1.25
        model.animate(seconds, FIGHT_MODEL_POSES[fighter.pose], {
          transitionKey: `${fighter.pose}:${fighter.attack?.moveId ?? ''}`,
          transitionSeconds: 0,
          motion: trackFightOpponent({
            fighter,
            opponent: state[side === 'player' ? 'opponent' : 'player'],
            bodyAngle: model.root.rotation.y,
            seconds,
            motion: fightBodyMotion({
              fighter,
              seconds,
              ...read(state, side, { fighter, seconds }),
            }),
          }),
          afterMotion: fightGroundContact(fighter),
        })
      }
      align(state)
      for (const side of ['player', 'opponent'] as const)
        expect(
          violations(fightRigOf(humanAnimationRig(models[side].turns)!)),
          `${side} frame ${state.frame}`,
        ).toEqual([])
      expect(fightReplayHash(state)).toBe(hash)
    }
    draw()
    const move = moveForSlot(id, slot)!
    state = performAuraAttack({
      state,
      side: 'player',
      kind: move.kind,
      moveId: move.id,
      auraCharged: false,
    })
    for (let frame = 0; frame < 45; frame++) {
      state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, ai: false, opponentInput: EMPTY_INPUT })
      draw()
    }
  },
)
