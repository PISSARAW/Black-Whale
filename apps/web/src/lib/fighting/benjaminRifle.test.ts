import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { createFightState } from './fightState'
import { buildFightFigure, fightFigureKey } from './fighterFigure'
import { fightBodyMotion } from './fightBodyMotion'
import { attackData } from './frameData'
import type { ArcadeFighter } from './types'

const glow = (color: number, opacity: number) => new THREE.MeshBasicMaterial({ color, opacity })
function firing(facing: 1 | -1): ArcadeFighter {
  const fighter = createFightState('benjamin', 'hisoka').player
  return {
    ...fighter,
    facing,
    pose: 'ranged',
    attack: {
      kind: 'ranged',
      frame: 0,
      impacted: false,
      auraCharged: false,
      concealed: false,
      hatsuSource: null,
      projectileSpawned: false,
      reversal: false,
    },
  }
}

describe('Benjamin physically holds his rifle', () => {
  it.each([1, -1] as const)(
    'keeps both palms on their grips across the whole burst facing %s',
    (facing) => {
      const fighter = firing(facing)
      const model = buildFightFigure({ THREE, glow, fighter })
      model.root.position.set(3, 0.5, -2)
      model.root.rotation.y = (facing * Math.PI) / 2
      model.root.scale.setScalar(1.15)
      const gun = model.root.getObjectByName('benjamin-firearm')!
      const right = model.root.getObjectByName('hand-right')!
      const left = model.root.getObjectByName('hand-left')!
      expect(gun.parent).toBe(right)
      const startup = attackData('ranged', fighter).startup
      const key = fightFigureKey(fighter)
      for (const frame of [0, startup - 1, startup, startup + 6, startup + 12, startup + 18]) {
        fighter.attack!.frame = frame
        const before = JSON.stringify(fighter)
        model.animate(frame / 60, 'idle', {
          motion: fightBodyMotion({ fighter, seconds: frame / 60, progress: 0.5 }),
        })
        expect(gun.visible).toBe(true)
        const trigger = gun.getObjectByName('benjamin-trigger-grip')!
        const support = gun.getObjectByName('benjamin-support-grip')!
        expect(
          trigger
            .getWorldPosition(new THREE.Vector3())
            .distanceTo(right.getWorldPosition(new THREE.Vector3())),
        ).toBeLessThan(0.001)
        expect(
          support
            .getWorldPosition(new THREE.Vector3())
            .distanceTo(left.getWorldPosition(new THREE.Vector3())),
        ).toBeLessThan(0.012)
        const direction = new THREE.Vector3(0, 0, 1).applyQuaternion(
          gun.getWorldQuaternion(new THREE.Quaternion()),
        )
        expect(direction.x * facing).toBeGreaterThan(0.7)
        expect(JSON.stringify(fighter)).toBe(before)
        expect(fightFigureKey(fighter)).toBe(key)
      }
    },
  )

  it('flashes at the muzzle of the held rifle for the three actual shots and puts it away afterwards', () => {
    const fighter = firing(1)
    const model = buildFightFigure({ THREE, glow, fighter })
    const gun = model.root.getObjectByName('benjamin-firearm')!
    const flash = gun.getObjectByName('benjamin-muzzle-flash')!
    const startup = attackData('ranged', fighter).startup
    const draw = () =>
      model.animate(0.3, 'idle', {
        motion: fightBodyMotion({ fighter, seconds: 0.3, progress: 0.5 }),
      })
    for (const offset of [0, 6, 12]) {
      fighter.attack!.frame = startup + offset
      draw()
      expect(flash.visible).toBe(true)
      fighter.attack!.frame += 3
      draw()
      expect(flash.visible).toBe(false)
    }
    fighter.attack = null
    fighter.pose = 'idle'
    draw()
    expect(gun.visible).toBe(false)
    expect(flash.visible).toBe(false)
  })
})
