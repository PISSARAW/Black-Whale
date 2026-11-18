import { describe, expect, it } from 'vitest'
import { PerspectiveCamera } from 'three'
import { directedThrowShot, fitThrowShot } from './camera'
import { THROW_PERFORMANCES } from './catalogue'
import { introInFrame } from '../presentation/introFreeCamera'
import type { ThrowCinematicFrame } from '../throwCinematic'

const bounds = { left: -0.9, right: 1.4, bottom: 0.02, top: 3.2, near: -0.45, far: 0.65 }
describe('directed throw camera safety', () => {
  it.each([16 / 9, 390 / 720, 320 / 720])('fits both bodies during every action and result shot at aspect %s', (aspect) => {
    const camera = new PerspectiveCamera(34, aspect, 0.1, 100)
    for (const performance of THROW_PERFORMANCES) for (const facing of [1, -1] as const) {
      for (const t of [0.3, 0.5, 0.65, 0.8, 0.9]) {
        const frame: ThrowCinematicFrame = { attacker: 'player', victim: 'opponent', sequence: 1, facing, active: true, age: 84 * t, duration: 84, performance: performance.id }
        const shot = directedThrowShot({ frame, bounds, baseRadius: 6, minimumDistance: 8 })
        expect(shot.radius).toBeGreaterThanOrEqual(8)
        fitThrowShot(camera, shot)
        expect(introInFrame(camera, { x: shot.focus.x, height: bounds.top, landmarks: bounds, safeTop: 0.801 })).toBe(true)
        expect(camera.position.toArray().every(Number.isFinite)).toBe(true)
      }
    }
  })
})
