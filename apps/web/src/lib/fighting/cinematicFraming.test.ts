import { describe, expect, it } from 'vitest'
import { PerspectiveCamera, Vector3 } from 'three'
import { beginFight, createFight } from './engine'
import { createCombatCamera } from './combatCamera'
import { fightWorldX, fightWorldY } from './fightCoordinates'
import { cinematicDetailRect, futureDetailRect } from './cinematicDetailLayout'

describe('simultaneous combat and detail framing', () => {
  it.each(
    [0.35, 0.65, 1.14, 1.4, 2.24].flatMap((aspect) => [
      { aspect, prediction: false },
      { aspect, prediction: true },
    ]),
  )(
    'keeps both bodies outside the panel at $aspect (Laplace: $prediction)',
    ({ aspect, prediction }) => {
      const rect = prediction ? futureDetailRect(aspect, 420) : cinematicDetailRect(aspect)
      const rig = createCombatCamera()
      const camera = new PerspectiveCamera(34, aspect, 0.1, 500)
      const base = { x: 0, y: 2.2, z: 8.2, lookY: 1.18 }
      const fresh = beginFight(createFight('biscuit', 'kurapika'))
      for (const [left, right, height] of [
        [44, 50, 0],
        [7, 93, 0],
        [7, 14, 10],
        [86, 93, 8],
        [50, 44, 0],
      ]) {
        const state = {
          ...fresh,
          frame: 100,
          player: { ...fresh.player, x: left, y: height, biscuitTrueForm: true, velocityY: 15 },
          opponent: { ...fresh.opponent, x: right },
        }
        const options = {
          state,
          base,
          span: {
            centre: (fightWorldX(left) + fightWorldX(right)) / 2,
            gap: Math.abs(left - right) * 0.115,
          },
          aspect,
          intensity: 1,
          dt: 1 / 60,
          detail: true,
          detailRect: rect,
          companion: prediction ? ('opponent' as const) : undefined,
        }
        for (let step = 0; step < 50; step++) {
          const pose = rig.update(options)
            expect(pose.z).toBeLessThan(500)
          camera.position.set(pose.x, pose.y, pose.z)
          camera.lookAt(pose.x, pose.lookY, 0)
          camera.updateMatrixWorld(true)
          for (const actor of [state.player, state.opponent]) {
            for (const dx of [-0.65, 0.65])
              for (const height of [0, actor.id === 'biscuit' ? 2.8 : 2.22]) {
                const p = new Vector3(
                  fightWorldX(actor.x) + dx,
                  fightWorldY(actor.y) + height,
                  0,
                ).project(camera)
                expect(p.x).toBeGreaterThan(-0.9)
                expect(p.x).toBeLessThan(0.9)
                expect(p.y).toBeGreaterThan(-0.95)
                expect(p.y).toBeLessThan(0.78)
                if (pose.detailReady) {
                  const x = (p.x + 1) / 2
                  const y = (1 - p.y) / 2
                  expect(x < rect.x || y > rect.y + rect.height).toBe(true)
                }
              }
          }
        }
      }
    },
  )
})
