import { describe, expect, it } from 'vitest'
import { Group, Object3D } from 'three'
import { humanAnimation, poseHuman } from './humanAnimation'

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

  it('lets a guard set walking drop their arms to how they hung', () => {
    const human = { ...rig(), pose: 'guard' as const }
    const elbows = human.arms.map((arm) => arm.children[1] as Group)
    poseHuman({ ...human, elbows })
    const animate = humanAnimation(human)

    animate(1, 'walk')
    expect(human.arms[0].rotation.z).toBeCloseTo(0)
    expect(human.arms[0].children[1]!.rotation.x).toBeCloseTo(0)
    expect(human.arms[0].rotation.x).not.toBeCloseTo(human.arms[1].rotation.x)

    animate(1, 'guard')
    expect(human.arms[0].rotation.z).toBeCloseTo(0.64)
  })

  it('gives a flute performance phrasing, breath and moving keys', () => {
    const human = { ...rig(), pose: 'flute' as const }
    const flute = new Group()
    flute.name = 'signature-flute'
    const key = new Object3D()
    key.name = 'signature-flute-key-0'
    key.position.z = 0.017
    flute.add(key)
    human.figure.add(flute)
    const animate = humanAnimation(human)

    animate(0.4)
    const first = {
      sway: human.figure.rotation.z,
      shoulder: human.arms[0].rotation.z,
      key: key.position.z,
    }
    animate(1.1)
    expect(human.figure.rotation.z).not.toBeCloseTo(first.sway)
    expect(human.arms[0].rotation.z).not.toBeCloseTo(first.shoulder)
    expect(Math.abs(key.position.z - first.key)).toBeGreaterThan(0.003)
    expect(human.head.rotation.y).toBe(0)
  })

  it('bows from the waist before a formal performance', () => {
    const human = { ...rig(), pose: 'bow' as const }
    const elbows = human.arms.map((arm) => arm.children[1] as Group)
    poseHuman({ ...human, elbows })
    expect(human.figure.rotation.x).toBeCloseTo(0.28)
    expect(human.head.rotation.x).toBeCloseTo(-0.16)
    const animate = humanAnimation(human)
    animate(0.5)
    expect(human.figure.rotation.x).toBeGreaterThan(0.28)
  })
})
