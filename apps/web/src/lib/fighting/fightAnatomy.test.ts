import { expect, it } from 'vitest'
import * as THREE from 'three'
import { buildFightFigure } from './fighterFigure'
import { createFightState } from './fightState'
import { FIGHTING_ROSTER } from './roster'
import { fightBodyMotion } from './fightBodyMotion'
import { fightRigOf } from './fightRig'
import { humanAnimationRig } from '$lib/tour/humanAnimation'
import { reachLimb } from './fightLimbReach'
import { COMBAT_JOINT_RANGES, constrainFightRig } from './fightAnatomy'
import { fightReplayHash } from './fightReplayHash'

it.each(FIGHTING_ROSTER.map((f) => f.id))(
  '%s retains fixed-length limbs and anatomical hinges after contact correction',
  (id) => {
    const s = createFightState(id, 'franklin'),
      f = s.player,
      hash = fightReplayHash(s)
    const model = buildFightFigure({
      THREE,
      glow: (c) => new THREE.MeshBasicMaterial({ color: c }),
      fighter: f,
    })
    const scene = new THREE.Scene()
    scene.add(model.root)
    model.animate(0, 'idle', {
      transitionSeconds: 0,
      motion: fightBodyMotion({ fighter: f, seconds: 0, progress: 0 }),
    })
    const rig = fightRigOf(humanAnimationRig(model.turns)!)
    const chain = { root: rig.human.legs[0], hinge: rig.human.knees[0], end: rig.ankles[0] }
    const length = () =>
      chain.root
        .getWorldPosition(new THREE.Vector3())
        .distanceTo(chain.hinge.getWorldPosition(new THREE.Vector3()))
    const before = length()
    for (const x of [-0.2, 0, 0.2]) {
      const target = chain.end
        .getWorldPosition(new THREE.Vector3())
        .add(new THREE.Vector3(x, 0.1, 0.08))
      reachLimb(chain, target)
      expect(length()).toBeCloseTo(before, 8)
      expect(chain.hinge.rotation.x).toBeGreaterThanOrEqual(0)
      expect(chain.hinge.rotation.x).toBeLessThanOrEqual(COMBAT_JOINT_RANGES.knee[0][1])
      expect(Math.abs(chain.hinge.rotation.y)).toBeLessThanOrEqual(0.04 + 1e-8)
      expect(Math.abs(chain.hinge.rotation.z)).toBeLessThanOrEqual(0.04 + 1e-8)
    }
    constrainFightRig(rig)
    const pose = chain.hinge.quaternion.clone()
    constrainFightRig(rig)
    expect(chain.hinge.quaternion.angleTo(pose)).toBeLessThan(1e-7)
    expect(fightReplayHash(s)).toBe(hash)
  },
)
it('keeps an elbow on its hinge and reaches a feasible target without changing bone length', () => {
  const scene = new THREE.Group(),
    root = new THREE.Group(),
    hinge = new THREE.Group(),
    end = new THREE.Group()
  root.name = 'arm-right'
  hinge.name = 'elbow-right'
  end.name = 'hand-right'
  scene.add(root)
  root.add(hinge)
  hinge.add(end)
  hinge.position.y = -1
  end.position.y = -1
  const target = new THREE.Vector3(0, -1.5, 0.8)
  const error = reachLimb({ root, hinge, end }, target)
  expect(error).toBeLessThan(0.001)
  expect(hinge.rotation.x).toBeLessThanOrEqual(0)
  expect(Math.abs(hinge.rotation.y) + Math.abs(hinge.rotation.z)).toBeLessThan(1e-8)
})
