import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { buildHumanFigure } from './humanFigure'
import { humanAnimationRig } from './humanAnimation'
import { createHumanLocomotion } from './humanLocomotion'
import { WALK_STRIDE_SECONDS } from './humanWalk'

function setup() {
  const model = buildHumanFigure({
    THREE,
    glow: (color) => new THREE.MeshBasicMaterial({ color }),
    seen: {
      id: 'locomotion-test',
      kind: 'avatar',
      spaceId: 'room',
      tierId: 'deck',
      at: [0, 0],
      y: 0,
      size: 0.42,
      colour: 0xffffff,
      stage: 0,
      hidden: false,
      human: { role: 'guard', identity: 'babimyna', pose: 'guard', aura: 'none' },
    },
  })
  const root = new THREE.Group()
  root.add(model.root)
  const motion = createHumanLocomotion()
  const human = humanAnimationRig(model.turns)!
  const draw = (frame: number, at: readonly [number, number], heading = 0) => {
    const next = motion(
      root,
      { at, y: 0, pose: 'guard', heading },
      { seconds: frame / 60, delta: 1 / 60 },
    )
    model.animate(frame / 60, next.pose, next.layer)
    return next
  }
  return { root, model, human, draw }
}

describe('the rendered Tour walk', () => {
  it('eases guard-to-walk shoulders instead of jumping by 57 degrees in one frame', () => {
    const { human, draw } = setup()
    draw(0, [0, 0])
    let before = human.arms[0].rotation.x
    let largest = 0
    for (let frame = 1; frame < 60; frame++) {
      draw(frame, [0, 3])
      largest = Math.max(largest, Math.abs(human.arms[0].rotation.x - before))
      before = human.arms[0].rotation.x
    }
    expect(largest).toBeLessThan(0.18)
    expect(largest).toBeGreaterThan(0.01)
  })

  it('pins the support foot in world space while the body travels, with no backward knee bend', () => {
    const { root, human, draw } = setup()
    let previous = -1
    let anchor = new THREE.Vector3()
    let largestDrift = 0
    let worst = {}
    let largestStep = 0
    const previousRoot = root.position.clone()
    for (let frame = 0; frame < 210; frame++) {
      const next = draw(frame, [0, 4])
      const phase = (((next.layer.strideClock! / WALK_STRIDE_SECONDS) % 1) + 1) % 1
      const support = phase < 0.5 ? 0 : 1
      const foot = human.knees[support].children[1].getWorldPosition(new THREE.Vector3())
      if (support !== previous || frame < 20) anchor = foot.clone()
      else if (foot.distanceTo(anchor) > largestDrift) {
        largestDrift = foot.distanceTo(anchor)
        worst = {
          frame,
          phase,
          foot,
          anchor,
          root: root.position.clone(),
          hip: human.legs[support].rotation.toArray(),
        }
      }
      previous = support
      largestStep = Math.max(largestStep, root.position.distanceTo(previousRoot))
      previousRoot.copy(root.position)
      for (const knee of human.knees) {
        expect(knee.rotation.x).toBeGreaterThanOrEqual(0)
        expect(Math.abs(knee.rotation.z)).toBeLessThanOrEqual(0.1)
      }
    }
    expect(largestDrift, JSON.stringify(worst)).toBeLessThan(0.025)
    expect(largestStep).toBeLessThanOrEqual(1.4 / 60 + 1e-6)
    expect(root.position.z).toBeGreaterThan(2)
  })

  it('takes alternating steps during a bounded half turn, then returns to rest', () => {
    const { root, draw } = setup()
    draw(0, [0, 0])
    let previous = 0
    let stepped = false
    for (let frame = 1; frame < 240; frame++) {
      const next = draw(frame, [0, 0], Math.PI)
      stepped ||= next.pose === 'walk'
      expect(Math.abs(root.rotation.y - previous)).toBeLessThanOrEqual(2.4 / 60 + 1e-6)
      previous = root.rotation.y
    }
    expect(stepped).toBe(true)
    expect(root.rotation.y).toBeCloseTo(Math.PI)
    expect(draw(240, [0, 0], Math.PI).pose).toBe('guard')
    expect(root.position.length()).toBe(0)
  })

  it('brakes its velocity vector before reversing toward a new destination', () => {
    const { root, draw } = setup()
    let previous = root.position.clone()
    let velocity = new THREE.Vector3()
    for (let frame = 0; frame < 120; frame++) {
      draw(frame, frame < 60 ? [0, 4] : [0, -4])
      const next = root.position.clone().sub(previous).multiplyScalar(60)
      expect(next.clone().sub(velocity).length() * 60).toBeLessThanOrEqual(3.01)
      previous = root.position.clone()
      velocity = next
    }
  })

  it('does not advance a walking cycle when the rendered body covers no ground', () => {
    const { root, model } = setup()
    const motion = createHumanLocomotion()
    const destination = { at: [0, 3] as const, y: 0, pose: 'guard' as const, heading: 0 }
    const first = motion(root, destination, { seconds: 1, delta: 1 / 60 })
    model.animate(1, first.pose, first.layer)
    const frozen = motion(root, destination, { seconds: 1, delta: 0 })
    expect(frozen.layer.strideClock).toBe(first.layer.strideClock)
  })
})
