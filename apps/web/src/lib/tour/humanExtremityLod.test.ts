import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { buildHumanFigure, type HumanLook } from './humanFigure'
import { setHumanExtremityLod } from './humanExtremityLod'
import { humanHandRig } from './humanHandRig'
import { humanFootRig } from './humanFootRig'

const glow = (color: number, opacity: number) =>
  new THREE.MeshBasicMaterial({ color, opacity, transparent: opacity < 1 })

const seen: HumanLook = {
  id: 'kurapika',
  kind: 'avatar',
  spaceId: 'room',
  tierId: 'tier-1',
  at: [0, 0],
  y: 0,
  size: 0.42,
  colour: 0xffffff,
  stage: 0,
  hidden: false,
  human: { role: 'hunter', identity: 'kurapika', pose: 'idle', aura: 'none' },
}

describe('extremity distance LOD', () => {
  it('uses skinned detail near and procedural geometry at mid distance', () => {
    const model = buildHumanFigure({ THREE, glow, seen })
    const hand = model.root.getObjectByName('hand-left')!
    const foot = model.root.getObjectByName('foot-left')!
    const handRig = humanHandRig(hand)!
    const footRig = humanFootRig(foot)!
    setHumanExtremityLod(model.root, 4)
    expect(handRig.mesh.visible).toBe(true)
    expect(footRig.surface.visible).toBe(true)
    setHumanExtremityLod(model.root, 12)
    expect(handRig.mesh.visible).toBe(false)
    expect(footRig.surface.visible).toBe(false)
    expect(((hand as THREE.Mesh).material as THREE.Material).visible).toBe(true)
    expect(foot.children.some((child) => (child as THREE.Mesh).isMesh && child.visible)).toBe(true)
  })

  it('is idempotent at a stable distance', () => {
    const model = buildHumanFigure({ THREE, glow, seen })
    setHumanExtremityLod(model.root, 16)
    const hand = humanHandRig(model.root.getObjectByName('hand-left')!)!
    setHumanExtremityLod(model.root, 16)
    expect(hand.mesh.visible).toBe(false)
  })
})
