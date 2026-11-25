import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { buildHumanFigure, type HumanLook } from './humanFigure'
import { geometryMetrics, EXTREMITY_QUALITY_TARGET } from './humanExtremityBudget'
import { humanHandRig } from './humanHandRig'

const glow = (color: number, opacity: number) =>
  new THREE.MeshBasicMaterial({ color, opacity, transparent: opacity < 1 })

function appearance(identity: string): HumanLook {
  return {
    id: identity,
    kind: 'avatar',
    spaceId: 'room',
    tierId: 'tier-1',
    at: [0, 0],
    y: 0,
    size: 0.42,
    colour: 0xffffff,
    stage: 0,
    hidden: false,
    human: { role: 'hunter', identity, pose: 'idle', aura: 'none' },
  }
}

describe('hero skinned hand pilot', () => {
  it.each(['kurapika', 'hisoka'])(
    'mounts sixteen bones and shared bounded skin: %s',
    (identity) => {
      const first = buildHumanFigure({ THREE, glow, seen: appearance(identity) })
      const second = buildHumanFigure({ THREE, glow, seen: appearance(identity) })
      for (const side of ['left', 'right'] as const) {
        const hand = first.root.getObjectByName(`hand-${side}`)!
        const rig = humanHandRig(hand)!
        expect(rig.mesh).toBeInstanceOf(THREE.SkinnedMesh)
        expect(rig.mesh.skeleton.bones).toHaveLength(16)
        expect(rig.mesh.geometry).toBe(
          humanHandRig(second.root.getObjectByName(`hand-${side}`)!)!.mesh.geometry,
        )
        expect(geometryMetrics(rig.mesh).triangles).toBeLessThanOrEqual(
          EXTREMITY_QUALITY_TARGET.hand.maxTriangles,
        )
      }
    },
  )

  it('changes finger bones without moving the public grip anchor', () => {
    const model = buildHumanFigure({ THREE, glow, seen: appearance('kurapika') })
    const hand = model.root.getObjectByName('hand-left')!
    const rig = humanHandRig(hand)!
    const grip = model.root.getObjectByName('grip-left')!
    const before = grip.position.clone()
    rig.pose('fist')
    expect(rig.fingers[0].middle.rotation.x).toBeLessThan(-1)
    expect(grip.position).toEqual(before)
  })

  it('leaves non-pilot characters on the procedural hand', () => {
    const model = buildHumanFigure({ THREE, glow, seen: appearance('chrollo-lucilfer') })
    expect(humanHandRig(model.root.getObjectByName('hand-left')!)).toBeUndefined()
    expect(model.root.getObjectByName('hand-skin-left')).toBeUndefined()
  })
})
