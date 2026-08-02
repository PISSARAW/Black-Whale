import { describe, expect, it } from 'vitest'
import { Group, Object3D } from 'three'
import { humanAnimation } from './humanAnimation'

function rig() {
  const arms = [new Group(), new Group()]
  for (const arm of arms) arm.add(new Object3D(), new Group())
  return {
    pose: 'idle' as const,
    figure: new Group(),
    torso: new Object3D(),
    pelvis: new Object3D(),
    head: new Object3D(),
    arms,
    legs: [new Group(), new Group()],
    knees: [new Group(), new Group()],
  }
}

describe('humanAnimation', () => {
  it('changes a combatant pose without rebuilding its rig', () => {
    const human = rig()
    const animate = humanAnimation(human)

    animate(1, 'attack')
    expect(human.arms[1].rotation.x).toBeLessThan(-1.2)

    animate(1, 'guard')
    expect(human.arms[0].rotation.z).toBeCloseTo(0.64)
    expect(human.arms[1].rotation.z).toBeCloseTo(-0.64)

    animate(1, 'fallen')
    expect(human.figure.rotation.z).toBeCloseTo(1.3)

    animate(1, 'idle')
    expect(human.figure.rotation.z).toBe(0)
    expect(human.arms[1].rotation.z).toBe(0)
  })
})
