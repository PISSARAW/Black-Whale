import { expect, it } from 'vitest'
import { Group, Vector3 } from 'three'
import { keepHumanJoint } from './humanJointLimits'
import { reachHumanLimb } from './humanLimbReach'

it('keeps the equivalent shoulder rotation across the Euler wrap', () => {
  const shoulder = new Group()
  shoulder.name = 'shoulder-right'
  shoulder.rotation.x = Math.PI - 0.02
  const before = shoulder.quaternion.clone()
  keepHumanJoint(shoulder)
  expect(shoulder.rotation.x).toBeCloseTo(-Math.PI - 0.02)
  expect(shoulder.quaternion.angleTo(before)).toBeLessThan(1e-7)
})

it('follows a moving hand continuously when the authored elbow pole changes sides', () => {
  const body = new Group(),
    root = new Group(),
    hinge = new Group(),
    end = new Group()
  root.name = 'shoulder-right'
  hinge.name = 'elbow-right'
  end.name = 'hand-right'
  body.add(root)
  root.add(hinge)
  hinge.add(end)
  hinge.position.y = -0.3
  end.position.y = -0.28
  let reference = undefined as typeof root.quaternion | undefined
  for (let frame = 0; frame < 360; frame++) {
    const angle = (frame * Math.PI) / 180
    const target = new Vector3(0.25, -0.35, 0.15 * Math.sin(angle))
    const pole = new Vector3(0.1 * Math.sin(angle), -0.4, 0.12 * Math.cos(angle))
    expect(reachHumanLimb({ root, hinge, end }, target, { pole, reference })).toBeLessThan(0.002)
    if (reference) expect(root.quaternion.angleTo(reference), `frame ${frame}`).toBeLessThan(0.3)
    expect(hinge.rotation.y).toBe(0)
    expect(hinge.rotation.z).toBe(0)
    expect(hinge.position.toArray()).toEqual([0, -0.3, 0])
    expect(end.position.toArray()).toEqual([0, -0.28, 0])
    reference = root.quaternion.clone()
  }
})
