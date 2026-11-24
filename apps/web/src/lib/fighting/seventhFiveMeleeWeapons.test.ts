import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performMove } from './engine'
import { buildFightFigure } from './fighterFigure'
import { usesRightHandPose } from './fightHandConvention'
import { animateServiceHandgun } from './serviceHandgun'
import { meleeWeaponContact } from './meleeWeaponContact'
import { EMPTY_INPUT } from './types'

const glow = (color: number) => new THREE.MeshBasicMaterial({ color })

describe('seventh wave firearm melee', () => {
  it.each([
    ['furykov', true],
    ['longhi', true],
    ['musse', false],
  ] as const)('%s strikes with the equipped butt in either orientation', (id, back) => {
    for (const side of ['player', 'opponent'] as const) {
      const facing = side === 'player' ? 1 : -1
      const state = beginFight(
        createFight(side === 'player' ? id : 'hisoka', side === 'opponent' ? id : 'hisoka', {
          mode: 'versus-local',
        }),
      )
      const strike = performMove({
        state,
        side,
        action: 'heavy',
        input: { ...EMPTY_INPUT, left: back && facing === 1, right: back && facing === -1 },
      })
      const actor = strike[side]
      const slot = back ? 'backHeavy' : 'standingHeavy'
      expect(actor.attack?.moveId).toBe(`${id}:${slot}`)
      expect(usesRightHandPose(actor, `attack:${id}:${slot}`)).toBe(true)
      const model = buildFightFigure({ THREE, glow, fighter: actor })
      animateServiceHandgun(model.turns, actor)
      const gun = model.root.getObjectByName(`${id}-handgun`)!
      expect(gun.visible).toBe(true)
      expect(gun.parent?.name).toBe('hand-right')
      expect(meleeWeaponContact(model.turns, actor)).toBe(gun.getObjectByName(`${id}-pistol-butt`))
      expect(model.root.getObjectByName(`${id}-muzzle-flash`)?.visible).toBe(false)
      expect(strike.projectiles).toHaveLength(0)
      const disarmed = { ...actor, weaponsConfiscated: true }
      animateServiceHandgun(model.turns, disarmed)
      expect(gun.visible).toBe(false)
      expect(meleeWeaponContact(model.turns, disarmed)).toBeUndefined()
    }
  })
})
