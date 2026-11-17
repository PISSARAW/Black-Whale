import { describe, expect, it } from 'vitest'
import { Group, Object3D } from 'three'
import type { AnimatedHuman } from '$lib/tour/humanAnimation'
import {
  FIGHTER_FACING_ANGLE,
  FIGHTER_FACE_ANGLE,
  FIGHTER_TURN_DURATION,
  createFighterFacing,
  trackFightOpponent,
  updateFighterFacing,
} from './fighterFacing'

function rig(): AnimatedHuman {
  return {
    pose: 'idle',
    figure: new Group(),
    torso: new Object3D(),
    pelvis: new Object3D(),
    head: new Object3D(),
    arms: [new Group(), new Group()],
    legs: [new Group(), new Group()],
    knees: [new Group(), new Group()],
  }
}

describe('fighter facing presentation', () => {
  it('faces right with a positive near-profile angle', () => {
    expect(createFighterFacing(1).angle).toBe(FIGHTER_FACING_ANGLE)
    expect(createFighterFacing(-1).angle).toBe(-FIGHTER_FACING_ANGLE)
  })

  it('smooths a side switch over ten frames', () => {
    const facing = createFighterFacing(1)
    updateFighterFacing(facing, -1, 1)
    const halfway = updateFighterFacing(facing, -1, 1 + FIGHTER_TURN_DURATION / 2)
    const finished = updateFighterFacing(facing, -1, 1 + FIGHTER_TURN_DURATION)

    expect(halfway).toBeCloseTo(0, 5)
    expect(finished).toBeCloseTo(-FIGHTER_FACING_ANGLE, 5)
  })

  it('turns the head toward the opponent instead of keeping the idle sweep', () => {
    const human = rig()
    const seconds = 2
    human.head.rotation.y = Math.sin(seconds * 0.37) * 0.08
    trackFightOpponent({
      fighter: { facing: 1, x: 30, y: 0 },
      opponent: { x: 70, y: 0 },
      bodyAngle: FIGHTER_FACING_ANGLE,
      seconds,
    })(human)

    expect(human.head.rotation.y).toBeCloseTo(FIGHTER_FACE_ANGLE - FIGHTER_FACING_ANGLE, 5)
  })
})
