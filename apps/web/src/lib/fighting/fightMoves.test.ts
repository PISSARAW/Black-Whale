import { describe, expect, it } from 'vitest'
import { Group, Object3D } from 'three'
import { FIGHT_MOVE_TIMING, fightMove } from './fightMoves'
import { FIGHTING_ROSTER } from './roster'
import type { AnimatedHuman } from '$lib/tour/humanAnimation'
import type { FighterId, FighterPose } from './types'

function rig(): AnimatedHuman {
  const arms = [new Group(), new Group()]
  arms.forEach((arm) => arm.add(new Object3D(), new Group()))
  return {
    pose: 'idle',
    figure: new Group(),
    torso: new Object3D(),
    pelvis: new Object3D(),
    head: new Object3D(),
    arms,
    legs: [new Group(), new Group()],
    knees: [new Group(), new Group()],
  }
}

function apply(id: FighterId, pose: FighterPose, progress: number): AnimatedHuman {
  const human = rig()
  fightMove({ id, pose }, progress)?.(human)
  return human
}

describe('fight moves', () => {
  it('extends the jab through windup, strike and recovery', () => {
    const windup = apply('kurapika', 'light', 0.15)
    const strike = apply('kurapika', 'light', FIGHT_MOVE_TIMING.light.impact)
    const recovered = apply('kurapika', 'light', 1)
    expect(windup.arms[1].children[1].rotation.x).toBeLessThan(-0.5)
    expect(strike.arms[1].rotation.x).toBeLessThan(windup.arms[1].rotation.x)
    expect(Math.abs(recovered.arms[1].rotation.x)).toBeLessThan(0.01)
  })

  it('makes the heavy attack a kick rather than another raised arm', () => {
    const human = apply('kurapika', 'heavy', FIGHT_MOVE_TIMING.heavy.impact)
    expect(human.legs[1].rotation.x).toBeLessThan(-1)
    expect(Math.abs(human.figure.rotation.y)).toBeGreaterThan(0.3)
  })

  it('gives every fighter a distinct normal-move silhouette', () => {
    for (const pose of ['light', 'heavy'] as const) {
      const silhouettes = FIGHTING_ROSTER.map(({ id }) => {
        const human = apply(id, pose, FIGHT_MOVE_TIMING[pose].impact)
        return [
          human.figure.rotation.x,
          human.figure.rotation.y,
          human.figure.rotation.z,
          human.arms[0].rotation.x,
          human.arms[1].rotation.x,
          human.legs[0].rotation.x,
          human.legs[1].rotation.x,
        ]
          .map((value) => value.toFixed(2))
          .join(':')
      })
      expect(new Set(silhouettes).size).toBe(FIGHTING_ROSTER.length)
    }
  })

  it('gives each Hatsu a distinct silhouette', () => {
    const silhouettes = FIGHTING_ROSTER.map(({ id }) => {
      const human = apply(id, 'special', 0.45)
      return [
        human.figure.rotation.x,
        human.figure.rotation.y,
        human.arms[0].rotation.x,
        human.arms[0].rotation.z,
        human.arms[1].rotation.x,
        human.arms[1].rotation.z,
      ]
        .map((value) => value.toFixed(2))
        .join(':')
    })
    expect(new Set(silhouettes).size).toBe(FIGHTING_ROSTER.length)
  })

  it('turns the K.O. pose into a progressive fall', () => {
    const early = apply('hisoka', 'ko', 0.2)
    const late = apply('hisoka', 'ko', 0.9)
    expect(late.figure.rotation.z).toBeGreaterThan(early.figure.rotation.z)
    expect(late.figure.position.y).toBeGreaterThan(early.figure.position.y)
  })
})
