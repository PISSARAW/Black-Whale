import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import type { AnimatedHuman } from '$lib/tour/humanAnimation'
import { buildFightFigure } from './fighterFigure'
import { fightBodyMotion } from './fightBodyMotion'
import { fightGroundContact, lowestBodyHeight } from './fightGroundContact'
import { trackFightOpponent, FIGHTER_FACING_ANGLE } from './fighterFacing'
import { FIGHT_MODEL_POSES, transitionSecondsFor } from './sceneMotion'
import { createFightState } from './fightState'
import { FIGHTING_ROSTER } from './roster'
import type { ArcadeFighter } from './types'

const glow = (color: number, opacity: number) =>
  new THREE.MeshBasicMaterial({ color, opacity, transparent: opacity < 1 })

function draw(
  model: ReturnType<typeof buildFightFigure>,
  fighter: ArcadeFighter,
  context: { seconds: number; progress: number },
) {
  model.root.position.y = fighter.y * 0.12
  model.root.rotation.y = fighter.facing * FIGHTER_FACING_ANGLE
  let human!: AnimatedHuman
  model.animate(context.seconds, FIGHT_MODEL_POSES[fighter.pose], {
    motion: trackFightOpponent({
      fighter,
      opponent: { x: fighter.x + fighter.facing * 10, y: 0 },
      bodyAngle: model.root.rotation.y,
      seconds: context.seconds,
      motion: fightBodyMotion({ fighter, ...context }),
    }),
    transitionKey: fighter.pose,
    transitionSeconds: transitionSecondsFor(fighter),
    afterMotion: (rig) => {
      fightGroundContact(fighter)(rig)
      human = rig
    },
  })
  return human
}

describe.each(FIGHTING_ROSTER.map(({ id }) => id))('%s body landing', (id) => {
  it.each([1, -1] as const)('lies on its back at floor level, facing %i', (facing) => {
    const fighter = { ...createFightState(id, 'hisoka').player, facing }
    const model = buildFightFigure({ THREE, glow, fighter })
    for (const pose of ['down', 'ko'] as const) {
      const body = draw(
        model,
        { ...fighter, pose },
        { seconds: pose === 'down' ? 1 : 3, progress: 1 },
      )
      // Let the real outer transition finish, as the scene does on successive frames.
      draw(model, { ...fighter, pose }, { seconds: pose === 'down' ? 2 : 4, progress: 1 })
      expect(lowestBodyHeight(body)).toBeCloseTo(0.012, 5)
      const up = new THREE.Vector3(0, 1, 0).transformDirection(model.turns.matrixWorld)
      expect(Math.abs(up.y)).toBeLessThan(0.15)
      expect(Math.abs(model.turns.rotation.z)).toBeLessThan(0.05)
      // Independent surface measurement: the back of the visible torso is near the floor.
      const back = new THREE.Box3().setFromObject(body.torso)
      expect(back.min.y).toBeGreaterThan(-0.03)
      expect(back.min.y).toBeLessThan(0.2)
    }
  })

  it('keeps contacts above the floor through falling, outer cross-fades and getting up', () => {
    const fighter = createFightState(id, 'hisoka').player
    const model = buildFightFigure({ THREE, glow, fighter })
    draw(model, fighter, { seconds: 0, progress: 0 })
    for (const [index, pose] of (['down', 'wakeup'] as const).entries())
      for (let frame = 0; frame <= 24; frame++) {
        const human = draw(
          model,
          { ...fighter, pose },
          {
            seconds: 1 + index + frame / 60,
            progress: frame / 24,
          },
        )
        expect(lowestBodyHeight(human)).toBeCloseTo(0.012, 5)
      }
    const standing = draw(model, { ...fighter, pose: 'wakeup' }, { seconds: 4, progress: 1 })
    expect(standing.torso.getWorldPosition(new THREE.Vector3()).y).toBeGreaterThan(0.5)
  })
})

it('does not let held equipment, shadows or aura become a body support', () => {
  const fighter = { ...createFightState('chrollo', 'hisoka').player, pose: 'ko' as const }
  const model = buildFightFigure({ THREE, glow, fighter })
  const human = draw(model, fighter, { seconds: 0, progress: 1 })
  const height = human.figure.position.y
  const prop = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), glow(0xffffff, 1))
  human.arms[0].children[1].children[1].add(prop)
  draw(model, fighter, { seconds: 0, progress: 1 })
  expect(human.figure.position.y).toBeCloseTo(height, 5)
  expect(lowestBodyHeight(human)).toBeCloseTo(0.012, 5)
})

it('clamps an airborne falling body above the floor without pulling it out of its flight', () => {
  const fighter = { ...createFightState('benjamin', 'hisoka').player, pose: 'ko' as const, y: 10 }
  const model = buildFightFigure({ THREE, glow, fighter })
  const high = draw(model, fighter, { seconds: 0, progress: 1 })
  expect(model.root.position.y).toBe(1.2)
  expect(lowestBodyHeight(high)).toBeGreaterThan(0.5)
  const low = draw(model, { ...fighter, y: 0.01 }, { seconds: 1, progress: 1 })
  expect(lowestBodyHeight(low)).toBeGreaterThanOrEqual(0.012 - 1e-6)
})

it('gives falling and getting up priority over a maintained technique pose', () => {
  const fighter = { ...createFightState('benjamin', 'hisoka').player, coveringEars: true }
  const model = buildFightFigure({ THREE, glow, fighter })
  const human = draw(model, { ...fighter, pose: 'ko' }, { seconds: 0, progress: 1 })
  draw(model, { ...fighter, pose: 'ko' }, { seconds: 1, progress: 1 })
  const up = new THREE.Vector3(0, 1, 0).transformDirection(human.figure.matrixWorld)
  expect(Math.abs(up.y)).toBeLessThan(0.15)
  expect(lowestBodyHeight(human)).toBeCloseTo(0.012, 5)
})

it('grounds Biscuit’s large natural form after the model scale and body masses change', () => {
  const fighter = {
    ...createFightState('biscuit', 'hisoka').player,
    biscuitTrueForm: true,
    pose: 'ko' as const,
  }
  const model = buildFightFigure({ THREE, glow, fighter })
  const human = draw(model, fighter, { seconds: 0, progress: 1 })
  draw(model, fighter, { seconds: 1, progress: 1 })
  expect(lowestBodyHeight(human)).toBeCloseTo(0.012, 5)
  expect(new THREE.Vector3(0, 1, 0).transformDirection(human.figure.matrixWorld).y).toBeLessThan(
    0.15,
  )
})
