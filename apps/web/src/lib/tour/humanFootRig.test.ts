import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { buildHumanFigure, type HumanLook } from './humanFigure'
import { EXTREMITY_QUALITY_TARGET, geometryMetrics } from './humanExtremityBudget'
import { humanFootRig } from './humanFootRig'

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

describe('hero skinned foot pilot', () => {
  it.each(['kurapika', 'hisoka'])('uses four bones and two bounded surfaces: %s', (identity) => {
    const model = buildHumanFigure({ THREE, glow, seen: appearance(identity) })
    for (const side of ['left', 'right'] as const) {
      const rig = humanFootRig(model.root.getObjectByName(`foot-${side}`)!)!
      expect(rig.surface).toBeInstanceOf(THREE.SkinnedMesh)
      expect(rig.surface.skeleton.bones).toHaveLength(EXTREMITY_QUALITY_TARGET.foot.bones)
      expect(
        geometryMetrics(model.root.getObjectByName(`foot-${side}`)!).drawCalls,
      ).toBeLessThanOrEqual(EXTREMITY_QUALITY_TARGET.foot.maxDrawCalls)
      expect(geometryMetrics(rig.surface).triangles).toBeLessThanOrEqual(
        EXTREMITY_QUALITY_TARGET.foot.maxTriangles,
      )
    }
  })

  it('bends the toe without moving the public contact anchors', () => {
    const model = buildHumanFigure({ THREE, glow, seen: appearance('kurapika') })
    const foot = model.root.getObjectByName('foot-left')!
    const toe = model.root.getObjectByName('toe-left')!
    const before = toe.position.clone()
    const rig = humanFootRig(foot)!
    rig.pose('pivot')
    expect(rig.toe.rotation.x).toBeLessThan(-0.3)
    expect(toe.position).toEqual(before)
  })

  it('keeps non-pilot footwear procedural', () => {
    const model = buildHumanFigure({ THREE, glow, seen: appearance('chrollo-lucilfer') })
    expect(humanFootRig(model.root.getObjectByName('foot-left')!)).toBeUndefined()
  })
})
