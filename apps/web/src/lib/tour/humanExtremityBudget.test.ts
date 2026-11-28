import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { buildHumanFigure, type HumanLook } from './humanFigure'
import { EXTREMITY_QUALITY_TARGET, geometryMetrics } from './humanExtremityBudget'

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

describe('near extremity quality budget', () => {
  it.each(['kurapika', 'hisoka', 'biscuit-freecss', 'franklin-bordeau'])(
    'keeps stable anchors and records bounded procedural baselines: %s',
    (identity) => {
      const model = buildHumanFigure({ THREE, glow, seen: appearance(identity) })
      for (const side of ['left', 'right'] as const) {
        const hand = model.root.getObjectByName(`hand-${side}`)!
        const foot = model.root.getObjectByName(`foot-${side}`)!
        expect(hand).toBeTruthy()
        expect(foot).toBeTruthy()
        expect(geometryMetrics(hand).triangles).toBeLessThanOrEqual(
          EXTREMITY_QUALITY_TARGET.hand.maxTriangles,
        )
        expect(geometryMetrics(foot).triangles).toBeLessThanOrEqual(
          EXTREMITY_QUALITY_TARGET.foot.maxTriangles,
        )
      }
    },
  )

  it('reserves distinct near and mid ranges', () => {
    expect(EXTREMITY_QUALITY_TARGET.nearDistance).toBeLessThan(EXTREMITY_QUALITY_TARGET.midDistance)
  })
})
