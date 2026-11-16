import { describe, expect, it } from 'vitest'
import { PerspectiveCamera, Vector3 } from 'three'
import { createFight } from './engine'
import { fightWorldX, fightWorldY } from './fightCoordinates'
import { combatCameraTarget, createCombatCamera } from './combatCamera'
import { COMBAT_FIGHTERS } from './combatRoutes'
import { defaultFightComfort, effectiveFightComfort, readFightComfort } from './fightComfort'

const base = { x: 0, y: 2.2, z: 8.2, lookY: 1.18 }
describe('dynamic combat framing', () => {
  for (const fighter of COMBAT_FIGHTERS)
    it.each([0.35, 0.65, 1.4, 2.4])(
      `${fighter}, aspect %s: keeps heads and feet visible through separation and jumps`,
      (aspect) => {
        const rig = createCombatCamera()
        const camera = new PerspectiveCamera(34, aspect, 0.1, 100)
        const fresh = createFight(fighter, 'chrollo')
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
            player: { ...fresh.player, x: left, y: height },
            opponent: { ...fresh.opponent, x: right },
          }
          const span = {
            centre: (fightWorldX(left) + fightWorldX(right)) / 2,
            gap: Math.abs(left - right) * 0.115,
          }
          const pose = rig.update({ state, base, span, aspect, intensity: 1, dt: 1 / 120 })
          camera.position.set(pose.x, pose.y, pose.z)
          camera.lookAt(pose.x, pose.lookY, 0)
          camera.updateMatrixWorld(true)
          for (const actor of [state.player, state.opponent]) {
            for (const y of [fightWorldY(actor.y), fightWorldY(actor.y) + 1.9]) {
              const point = new Vector3(fightWorldX(actor.x), y, 0).project(camera)
              expect(Math.abs(point.x)).toBeLessThan(0.9)
              expect(point.y).toBeLessThan(0.78)
              expect(point.y).toBeGreaterThan(-0.95)
            }
          }
        }
      },
    )
  it('supports stable framing, old saved preferences and reduced motion', () => {
    const fresh = createFight('hisoka', 'kurapika')
    const state = {
      ...fresh,
      player: { ...fresh.player, x: 44 },
      opponent: { ...fresh.opponent, x: 50 },
    }
    const options = {
      state,
      base,
      span: { centre: 0, gap: 0.7 },
      aspect: 1.7,
      dt: 1 / 60,
      intensity: 0,
    }
    expect(combatCameraTarget(options).z).toBe(base.z)
    expect(combatCameraTarget({ ...options, intensity: 1 }).z).toBeLessThan(base.z)
    expect(
      readFightComfort({ getItem: () => '{"shake":0.5,"flashes":false,"highContrast":true}' })
        .camera,
    ).toBe(1)
    expect(effectiveFightComfort(defaultFightComfort(), true).camera).toBe(0)
  })
  it('preserves the minimum shot authored for Biscuit instead of pushing into her large form', () => {
    const state = createFight('biscuit', 'benjamin')
    const target = combatCameraTarget({
      state,
      base: { ...base, z: 14 },
      span: { centre: 0, gap: 2 },
      aspect: 1.7,
      dt: 1 / 60,
      intensity: 1,
    })
    expect(target.z).toBeGreaterThanOrEqual(14)
  })
  it('never mutates gameplay, respects stage minimum distance and resets when rewinding', () => {
    const state = createFight('benjamin', 'chrollo')
    const saved = JSON.stringify(state)
    const rig = createCombatCamera()
    const options = {
      state,
      base,
      span: { centre: 0, gap: 1 },
      aspect: 1.7,
      dt: 1 / 60,
      intensity: 1,
      minimumDistance: 12,
    }
    expect(rig.update(options).z).toBeGreaterThanOrEqual(12)
    rig.update({ ...options, state: { ...state, frame: 600 } })
    expect(rig.update(options)).toEqual(createCombatCamera().update(options))
    expect(JSON.stringify(state)).toBe(saved)
  })
})
