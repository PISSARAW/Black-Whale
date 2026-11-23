import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { buildHumanFigure } from '$lib/tour/humanFigure'
import { lerpPose, scalePose } from './fightPose'
import { interpolateJointTurn } from './fightPoseSlerp'
import { applyProceduralClavicles, clavicleOffset } from './fightClavicle'
import { applyFightPose, borrowFightRig, fightRigOf, resetFightRig } from './fightRig'
import { humanAnimationRig } from '$lib/tour/humanAnimation'

const glow = (colour: number, opacity: number) =>
  new THREE.MeshBasicMaterial({ color: colour, opacity, transparent: opacity < 1 })

function makeFigure() {
  const model = buildHumanFigure({
    THREE,
    glow,
    seen: {
      id: 'slerp-clavicle-test:kurapika',
      kind: 'combatant',
      spaceId: 'black-whale-clash',
      tierId: 'arcade-stage',
      at: [0, 0],
      y: 0,
      size: 1,
      colour: 0xffffff,
      stage: 0,
      hidden: false,
      human: { role: 'fighter', identity: 'kurapika', pose: 'idle', aura: 'none' },
    },
  })
  return humanAnimationRig(model.turns)!
}

describe('fightPoseSlerp', () => {
  it('matches Three.js quaternion slerp on multi-axis shoulder and hip turns', () => {
    const from = [-0.4, 0.35, 0.25] as const
    const to = [-1.5, -0.6, 0.9] as const
    const actual = interpolateJointTurn('leadShoulder', { from, to }, 0.5)

    const qa = new THREE.Quaternion().setFromEuler(new THREE.Euler(from[0], from[1], from[2], 'XYZ'))
    const qb = new THREE.Quaternion().setFromEuler(new THREE.Euler(to[0], to[1], to[2], 'XYZ'))
    const expected = new THREE.Euler().setFromQuaternion(qa.clone().slerp(qb, 0.5), 'XYZ')

    expect(actual[0]).toBeCloseTo(expected.x, 5)
    expect(actual[1]).toBeCloseTo(expected.y, 5)
    expect(actual[2]).toBeCloseTo(expected.z, 5)
  })

  it('keeps endpoints exact, hinge joints linear, and scalePose linear for negative factors', () => {
    const from = { leadShoulder: [-0.3, 0.2, 0.4] as const, leadElbow: [-0.4, 0, 0] as const }
    const to = { leadShoulder: [-1.4, -0.5, 0.8] as const, leadElbow: [-1.6, 0, 0] as const }

    expect(lerpPose(from, to, 0)).toEqual(from)
    expect(lerpPose(from, to, 1)).toEqual(to)
    expect(lerpPose(from, to, 0.5).leadElbow).toEqual([-1, 0, 0])

    const scaled = scalePose(from, -0.5)
    expect(scaled.leadShoulder).toEqual([0.15, -0.1, -0.2])
  })

  it('falls back to linear on extreme angles (> 2.8 rad) without flipping branch', () => {
    const from = [0, 0, 0] as const
    const to = [-3.1, 0.1, 0.2] as const
    const mid = interpolateJointTurn('leadShoulder', { from, to }, 0.5)
    expect(mid[0]).toBeCloseTo(-1.55, 5)
  })
})

describe('fightClavicle', () => {
  it('lifts, protracts, and tucks overhead shoulders while retracting pulled-back arms', () => {
    const forward = clavicleOffset(-1.2, 0.22)
    expect(forward[1]).toBeGreaterThan(0.01)
    expect(forward[2]).toBeGreaterThan(0.01)

    const overhead = clavicleOffset(-2.3, 0.22)
    expect(overhead[0]).toBeLessThan(0)
    expect(overhead[1]).toBeGreaterThan(forward[1])

    const chambered = clavicleOffset(0.8, 0.22)
    expect(chambered[1]).toBeLessThan(0)
    expect(chambered[2]).toBeLessThan(0)
  })

  it('applies clavicles on FightRig and restores rest shoulders without drift', () => {
    const human = makeFigure()
    const rig = fightRigOf(human)
    const restLead = rig.restShoulders[1].clone()

    applyFightPose(rig, { leadShoulder: [-1.5, 0, 0.2] }, 1)
    expect(human.arms[1].position.y).toBeGreaterThan(restLead.y)
    expect(human.arms[1].position.z).toBeGreaterThan(restLead.z)

    resetFightRig(rig)
    expect(human.arms[1].position.distanceTo(restLead)).toBeCloseTo(0, 6)

    // Borrowed rig also restores shoulder positions cleanly.
    const human2 = makeFigure()
    const rest2 = human2.arms[1].position.clone()
    const borrowed = borrowFightRig(human2)
    applyProceduralClavicles(borrowed.rig.human.arms, borrowed.rig.restShoulders)
    applyFightPose(borrowed.rig, { leadShoulder: [-1.6, 0, 0] }, 1)
    borrowed.restore()
    expect(human2.arms[1].position.distanceTo(rest2)).toBeCloseTo(0, 6)
  })
})
