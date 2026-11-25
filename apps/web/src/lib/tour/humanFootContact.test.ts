import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { humanFootClearance, humanFootContactPoint } from './humanFootContact'

function foot() {
  const space = new THREE.Group()
  const foot = new THREE.Group()
  foot.name = 'foot-left'
  space.add(foot)
  for (const [name, position] of [
    ['heel-left', [0, -0.05, -0.08]],
    ['toe-left', [0, -0.05, 0.14]],
    ['ground-contact-left', [0, -0.05, 0.03]],
  ] as const) {
    const anchor = new THREE.Group()
    anchor.name = name
    anchor.position.set(position[0], position[1], position[2])
    foot.add(anchor)
  }
  return { space, foot }
}

describe('semantic sole contact', () => {
  it('uses the lower endpoint while retaining the authored sole centre', () => {
    const model = foot()
    model.foot.rotation.x = 0.3
    const point = humanFootContactPoint(model.foot, model.space, new THREE.Vector3())
    const heel = model.foot.getObjectByName('heel-left')!.getWorldPosition(new THREE.Vector3())
    const toe = model.foot.getObjectByName('toe-left')!.getWorldPosition(new THREE.Vector3())
    expect(point.y).toBeCloseTo(Math.min(heel.y, toe.y), 10)
    expect(point.z).not.toBeCloseTo(model.foot.position.z, 4)
  })

  it('tracks parent translation without visiting decorative descendants', () => {
    const model = foot()
    const decoration = new THREE.Group()
    model.foot.add(decoration)
    model.space.position.set(5, 7, 9)
    const before = humanFootClearance(model.foot, model.space, new THREE.Vector3())
    model.foot.position.y += 0.4
    const after = humanFootClearance(model.foot, model.space, new THREE.Vector3())
    expect(after - before).toBeCloseTo(0.4, 10)
  })
})
