import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { buildFightFigure } from './fighterFigure'
import { createFightState } from './fightState'
import { fightBodyMotion } from './fightBodyMotion'
import { captureFootPlant, fightRigOf, type FightRig } from './fightRig'

const glow = (color: number, opacity: number) =>
  new THREE.MeshBasicMaterial({ color, opacity, transparent: opacity < 1 })

function legacyFeet(rig: FightRig) {
  const ground = rig.human.figure.parent ?? rig.human.figure
  ground.updateWorldMatrix(true, true)
  return rig.ankles.map((ankle) => ground.worldToLocal(ankle.getWorldPosition(rig.probe)).clone())
}

describe('foot matrix traversal', () => {
  it.each(['kurapika', 'hisoka', 'chrollo', 'benjamin'] as const)(
    'matches the complete hierarchy traversal for %s, including changed ancestors',
    (id) => {
      const fighter = createFightState(id, 'hisoka').player
      const model = buildFightFigure({ THREE, glow, fighter })
      const parent = new THREE.Group()
      parent.add(model.root)
      for (const facing of [1, -1] as const) {
        for (let frame = 0; frame < 48; frame++) {
          parent.position.set(frame * 0.01, -0.3, 2)
          parent.rotation.set(0.1, frame * 0.03, -0.15)
          parent.scale.set(0.9 + frame * 0.002, 1.2, 0.85)
          model.animate(frame / 12, frame % 2 ? 'idle' : 'walk', {
            motion: (human) => {
              fightBodyMotion({
                fighter: { ...fighter, facing, crouching: frame % 2 === 1 },
                seconds: frame / 12,
                progress: 0,
              })(human)
              const rig = fightRigOf(human)
              const actual = captureFootPlant(rig)
              const expected = legacyFeet(rig)
              actual.positions.forEach((position, index) => {
                expect(position.distanceTo(expected[index])).toBeLessThan(1e-10)
              })
            },
          })
        }
      }
    },
  )

  it('does not visit decorative branches or mutate a previously captured anchor', () => {
    const model = buildFightFigure({
      THREE,
      glow,
      fighter: createFightState('kurapika', 'hisoka').player,
    })
    model.animate(0, 'idle', {
      motion: (human) => {
        const decoration = new THREE.Group()
        human.head.add(decoration)
        const visit = vi.spyOn(decoration, 'updateWorldMatrix')
        const rig = fightRigOf(human)
        const anchor = captureFootPlant(rig)
        const saved = anchor.positions.map((point) => point.toArray())
        human.figure.position.y += 1
        const after = captureFootPlant(rig)
        expect(visit).not.toHaveBeenCalled()
        expect(anchor.positions.map((point) => point.toArray())).toEqual(saved)
        expect(after.positions[0].y - anchor.positions[0].y).toBeCloseTo(1, 10)
      },
    })
  })
})
