import { describe, expect, it } from 'vitest'
import { PerspectiveCamera, Vector3 } from 'three'
import { biscuitCameraFrame } from './biscuitCamera'
import { createFightState } from './fightState'
import type { FightSide } from './types'

describe('Biscuit camera framing', () => {
  it.each([0.9, 1.2, 2.5])(
    'keeps both natural bodies clear of HUD and controls at aspect %s',
    (aspect) => {
      const base = createFightState('biscuit', 'biscuit')
      const state = {
        ...base,
        player: { ...base.player, biscuitTrueForm: true },
        opponent: { ...base.opponent, biscuitTrueForm: true },
      }
      const frame = biscuitCameraFrame({ state, centre: 0, gap: 6.44, aspect })
      const camera = new PerspectiveCamera(34, aspect, 0.1, 100)
      camera.position.set(frame.x, frame.y, frame.z)
      camera.lookAt(frame.x, frame.lookY, 0)
      camera.updateMatrixWorld()
      for (const x of [-3.22, 3.22]) {
        const head = new Vector3(x, 2.6, 0).project(camera)
        const foot = new Vector3(x, 0, 0).project(camera)
        expect(Math.abs(head.x)).toBeLessThan(0.9)
        expect(Math.abs(foot.x)).toBeLessThan(0.9)
        expect(head.y).toBeLessThan(0.25)
        expect(foot.y).toBeGreaterThan(-0.72)
      }
    },
  )

  it.each<FightSide>(['player', 'opponent'])('adapts when %s reveals the body', (side) => {
    const state = createFightState('biscuit', 'biscuit')
    const options = { state, centre: -1, gap: 1, aspect: 2.5 }
    const small = biscuitCameraFrame(options)
    const large = biscuitCameraFrame({
      ...options,
      state: { ...state, [side]: { ...state[side], biscuitTrueForm: true } },
    })
    expect(large.z).toBeGreaterThan(small.z)
    expect(large.lookY).toBeGreaterThan(small.lookY)
    expect(large.x).toBe(-1)
  })

  it('preserves the established camera when both fighters already fit', () => {
    const state = createFightState('kurapika', 'hisoka')
    expect(biscuitCameraFrame({ state, centre: 2, gap: 4, aspect: 2 })).toEqual({
      x: 0.64,
      y: 2.2,
      z: 8.74,
      lookY: 1.18,
    })
    expect(
      biscuitCameraFrame({ state: { ...state, phase: 'finished' }, centre: 0, gap: 4, aspect: 2 })
        .z,
    ).toBe(7.2)
  })

  it.each([0.5, 0.75, 1])('keeps ordinary fighters on screen at aspect %s', (aspect) => {
    const state = createFightState('kurapika', 'hisoka')
    const frame = biscuitCameraFrame({ state, centre: 1, gap: 6.44, aspect })
    const camera = new PerspectiveCamera(34, aspect, 0.1, 100)
    camera.position.set(frame.x, frame.y, frame.z)
    camera.lookAt(frame.x, frame.lookY, 0)
    camera.updateMatrixWorld()
    for (const x of [-2.22, 4.22]) {
      const head = new Vector3(x, 2.1, 0).project(camera)
      const foot = new Vector3(x, 0, 0).project(camera)
      expect(Math.abs(head.x)).toBeLessThan(0.9)
      expect(Math.abs(foot.x)).toBeLessThan(0.9)
      expect(head.y).toBeLessThan(0.35)
      expect(foot.y).toBeGreaterThan(-0.75)
    }
  })
})
