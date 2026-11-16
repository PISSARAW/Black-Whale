import { describe, expect, it } from 'vitest'
import { PerspectiveCamera, Vector3 } from 'three'
import { sceneryCameraFrame } from './stageCamera'
import { biscuitCameraFrame } from './biscuitCamera'
import { createFightState } from './fightState'

const scenery = { framing: { minimumDistance: 14, lookY: 3 } }

describe('tall suspension room framing', () => {
  it.each([1076 / 680, 366 / 560, 296 / 560])(
    'keeps bodies and the first exposed coils in view at aspect %s',
    (aspect) => {
      const base = createFightState('biscuit', 'biscuit')
      const state = {
        ...base,
        player: { ...base.player, biscuitTrueForm: true },
        opponent: { ...base.opponent, biscuitTrueForm: true },
      }
      const frame = sceneryCameraFrame(
        biscuitCameraFrame({ state, centre: 0, gap: 11.5, aspect }),
        scenery,
      )
      const camera = new PerspectiveCamera(34, aspect, 0.1, 100)
      camera.position.set(frame.x, frame.y, frame.z)
      camera.lookAt(frame.x, frame.lookY, 0)
      camera.updateMatrixWorld(true)
      for (const x of [-5.75, 5.75]) {
        const foot = new Vector3(x, 0, 0).project(camera)
        const head = new Vector3(x, 2.7, 0).project(camera)
        expect(Math.abs(foot.x)).toBeLessThan(0.95)
        expect(Math.abs(head.x)).toBeLessThan(0.95)
        expect(foot.y).toBeGreaterThan(-0.9)
        expect(head.y).toBeLessThan(0.35)
      }
      const coil = new Vector3(0, 6.5, -5).project(camera)
      expect(coil.y).toBeLessThan(0.9)
      expect(coil.y).toBeGreaterThan(-0.5)
    },
  )
})
