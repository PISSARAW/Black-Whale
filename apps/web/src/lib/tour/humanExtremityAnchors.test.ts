import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { buildHumanFigure, type HumanLook } from './humanFigure'
import { ensureHumanExtremityAnchors, humanExtremityAnchors } from './humanExtremityAnchors'

const glow = (color: number, opacity: number) =>
  new THREE.MeshBasicMaterial({ color, opacity, transparent: opacity < 1 })

const seen: HumanLook = {
  id: 'anchors',
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

describe('semantic human extremity anchors', () => {
  it('mounts stable hand, grip, effect and ground contacts on both sides', () => {
    const model = buildHumanFigure({ THREE, glow, seen })
    const anchors = ensureHumanExtremityAnchors(model.root)
    expect(humanExtremityAnchors(model.root)?.hands[0].grip).toBe(anchors.hands[0].grip)
    for (const [index, side] of ['left', 'right'].entries()) {
      const hand = anchors.hands[index]
      const foot = anchors.feet[index]
      expect(hand.hand.name).toBe(`hand-${side}`)
      expect(hand.palm.parent).toBe(hand.hand)
      expect(hand.grip.parent).toBe(hand.hand)
      expect(hand.effect.parent).toBe(hand.hand)
      expect(foot.foot.name).toBe(`foot-${side}`)
      expect(foot.heel.parent).toBe(foot.foot)
      expect(foot.toe.parent).toBe(foot.foot)
      expect(foot.ground.parent).toBe(foot.foot)
    }
  })

  it('is idempotent and does not change visible bounds', () => {
    const model = buildHumanFigure({ THREE, glow, seen })
    model.root.updateMatrixWorld(true)
    const before = new THREE.Box3().setFromObject(model.root)
    const first = ensureHumanExtremityAnchors(model.root)
    const second = ensureHumanExtremityAnchors(model.root)
    model.root.updateMatrixWorld(true)
    expect(second.hands[0].grip).toBe(first.hands[0].grip)
    expect(second.feet[1].ground).toBe(first.feet[1].ground)
    expect(new THREE.Box3().setFromObject(model.root)).toEqual(before)
  })
})
