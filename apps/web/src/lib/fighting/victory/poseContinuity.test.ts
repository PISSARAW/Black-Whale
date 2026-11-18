import { expect, it } from 'vitest'
import * as THREE from 'three'
import { createFightState } from '../fightState'
import { buildFightFigure } from '../fighterFigure'
import { humanAnimationRig } from '$lib/tour/humanAnimation'
import { nativePoseEntry, rememberVictoryPose } from './poseContinuity'

it('carries the outgoing pose into a native fall, freezes in pause and finishes on its authored pose', () => {
  const fighter = createFightState('hisoka', 'franklin').opponent
  const model = buildFightFigure({
    THREE,
    glow: (color) => new THREE.MeshBasicMaterial({ color }),
    fighter,
  })
  const head = humanAnimationRig(model.turns)!.head
  head.rotation.x = 0.6
  rememberVictoryPose(model.root, { token: 'film', age: 9 })
  const draw = (age: number) => {
    head.rotation.x = 0.6
    const enter = nativePoseEntry(model.root, { token: 'film', phase: 'fall', age, start: 10 })
    head.rotation.x = -0.6
    enter()
    const result = head.quaternion.clone()
    rememberVictoryPose(model.root, { token: 'film', age })
    return result
  }
  draw(10)
  expect(head.rotation.x).toBeCloseTo(0.6)
  const middle = draw(13)
  expect(Math.abs(head.rotation.x)).toBeLessThan(0.01)
  expect(draw(13).angleTo(middle)).toBeLessThan(1e-7)
  draw(16)
  expect(head.rotation.x).toBeCloseTo(-0.6)
  // Seeking reconstructs the outgoing source pose before applying the phase.
  draw(10)
  expect(head.rotation.x).toBeCloseTo(0.6)
  draw(12)
  expect(head.rotation.x).toBeGreaterThan(0)
})
