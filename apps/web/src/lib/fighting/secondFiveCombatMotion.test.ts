import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { bodyPlan } from './fightBodyMotion'
import { fighterKeyedMove } from './fighterKeyedMove'
import { createFightState } from './fightState'
import { motionOf, PREJUMP_FRAMES } from './fighterMovement'
import { attackData } from './frameData'
import { keyPoseSource, keyPoseTimeline } from './keyPoseMoves'
import { COMBAT_NORMALS } from './secondFiveNormals'
import { createVisitWeaponScene } from './visitWeaponScene'
import type { ArcadeFighter } from './types'

const FIGHTERS = ['feitan', 'saiyu', 'theta', 'biscuit', 'phinks'] as const
const context = { seconds: 1, progress: 0.5 }

function locomotion(fighter: ArcadeFighter) {
  const motion = motionOf(fighter)
  const variants: ArcadeFighter[] = [
    { ...fighter, pose: 'walk', motion: { ...motion, heldDirection: fighter.facing } },
    {
      ...fighter,
      pose: 'walk',
      motion: { ...motion, heldDirection: fighter.facing === 1 ? -1 : 1 },
    },
    { ...fighter, pose: 'guard' },
    { ...fighter, motion: { ...motion, prejumpFrames: PREJUMP_FRAMES - 1 } },
    { ...fighter, pose: 'jump', y: 3 },
    { ...fighter, motion: { ...motion, landingFrames: 2 } },
  ]
  return variants.map((variant) => bodyPlan(variant, context))
}

describe('second five Hatsu combat styles', () => {
  it('draws distinct ground and jump poses through the standard motion path', () => {
    const signatures = FIGHTERS.flatMap((id) => {
      const fighter = createFightState(id, 'hisoka').player
      return [fighter, { ...fighter, facing: -1 as const }].map(locomotion)
    })
    const keys = ['walk:forward', 'walk:backward', 'guard', 'prejump', 'jump', 'landing']
    for (const [index, poses] of signatures.entries()) {
      const expected = index < 2 ? keys.map((key) => (key === 'jump' ? 'feitan:air' : key)) : keys
      expect(poses.map((plan) => plan?.key)).toEqual(expected)
    }
    for (const [index] of keys.entries()) {
      const right = signatures.filter((_, index) => index % 2 === 0)
      expect(new Set(right.map((poses) => JSON.stringify(poses[index]?.pose))).size).toBe(5)
    }
    const biscuit = createFightState('biscuit', 'hisoka').player
    const natural = locomotion({ ...biscuit, biscuitTrueForm: true })
    locomotion(biscuit).forEach((plan, index) =>
      expect(natural[index]?.pose).not.toEqual(plan?.pose),
    )
  })

  it('registers 45 distinct clips with active coverage and a separate natural Biscuit motion', () => {
    const contacts = new Set<string>()
    for (const id of FIGHTERS) {
      for (const slot of COMBAT_NORMALS) {
        const timeline = keyPoseTimeline(id, slot)!
        expect(keyPoseSource(id, slot)).toBe('dedicated')
        const contact = timeline.find((key) => key.phase === 'active' && key.at === 0)
        expect(contact, `${id} ${slot}`).toBeDefined()
        expect(
          timeline.some((key) => key.phase === 'active' && key.at === 1),
          `${id} ${slot}`,
        ).toBe(true)
        contacts.add(JSON.stringify(contact?.pose))
      }
    }
    expect(contacts.size).toBe(45)
    const biscuit = createFightState('biscuit', 'hisoka').player
    for (const slot of COMBAT_NORMALS) {
      expect(fighterKeyedMove({ ...biscuit, biscuitTrueForm: true }, slot).timeline).not.toEqual(
        fighterKeyedMove(biscuit, slot).timeline,
      )
    }
  })

  it('keeps Saiyu’s staff in the leading hand with a separate contact angle for each normal', () => {
    const state = createFightState('saiyu', 'hisoka')
    const figure = new THREE.Group()
    const scene = new THREE.Scene()
    for (const [name, x] of [
      ['left', -1],
      ['right', 1],
    ] as const) {
      const hand = new THREE.Object3D()
      hand.name = `hand-${name}`
      hand.position.x = x
      figure.add(hand)
    }
    const weapons = createVisitWeaponScene({
      THREE,
      scene,
      figureOf: () => figure,
      worldX: (x) => x,
      worldY: (y) => y,
    })
    try {
      for (const facing of [1, -1] as const) {
        state.player.facing = facing
        const angles = new Set<number>()
        for (const slot of COMBAT_NORMALS) {
          state.player.attack = {
            moveId: `saiyu:${slot}`,
            kind: slot.endsWith('Light') ? 'light' : 'heavy',
            frame: 0,
            impacted: false,
            auraCharged: false,
            concealed: false,
            hatsuSource: null,
            projectileSpawned: false,
            reversal: false,
          }
          state.player.attack.frame = attackData(state.player.attack.kind, state.player).startup
          weapons.sync(state, 0)
          const staff = scene.getObjectByName('priest-staff:player')!
          expect(staff.position.x).toBe(facing)
          angles.add(staff.rotation.z)
        }
        expect(angles.size).toBe(9)
      }
    } finally {
      weapons.dispose()
    }
  })
})
