import { expect, it } from 'vitest'
import * as THREE from 'three'
import { humanAnimationRig } from '$lib/tour/humanAnimation'
import { createFightState } from './fightState'
import { buildFightFigure } from './fighterFigure'
import { fightBodyMotion } from './fightBodyMotion'
import { fightRigOf } from './fightRig'
import { reachFightFoot } from './fightFootReach'
import { FIGHTING_ROSTER } from './roster'

it.each(FIGHTING_ROSTER)(
  '$name reaches a nearby foot target without changing bones or flipping its knee',
  ({ id }) => {
    const fighter = createFightState(id, 'leorio').player
    const model = buildFightFigure({
      THREE,
      glow: (color) => new THREE.MeshBasicMaterial({ color }),
      fighter,
    })
    model.root.rotation.y = -1.25
    model.animate(0, 'idle', { motion: fightBodyMotion({ fighter, seconds: 0, progress: 0 }) })
    const rig = fightRigOf(humanAnimationRig(model.turns)!)
    for (const index of [0, 1]) {
      const chain = {
        root: rig.human.legs[index],
        hinge: rig.human.knees[index],
        end: rig.ankles[index],
      }
      const nodes = [chain.root, chain.hinge, chain.end]
      const bones = nodes.map((node) => [...node.position.toArray(), ...node.scale.toArray()])
      const hip = chain.root.quaternion.clone(),
        knee = chain.hinge.quaternion.clone()
      const sole = chain.end.getWorldPosition(new THREE.Vector3())
      expect(reachFightFoot(chain, sole)).toBeLessThan(1e-5)
      expect(chain.root.quaternion.angleTo(hip)).toBeLessThan(1e-6)
      expect(chain.hinge.quaternion.angleTo(knee)).toBeLessThan(1e-6)
      const bend = chain.hinge.rotation.x
      chain.root.rotation.x -= 0.04
      chain.hinge.rotation.x += 0.15
      const target = chain.end.getWorldPosition(new THREE.Vector3())
      chain.root.quaternion.copy(hip)
      chain.hinge.quaternion.copy(knee)
      expect(reachFightFoot(chain, target), `${id}, leg ${index}`).toBeLessThan(0.005)
      expect(Math.abs(chain.hinge.rotation.x - bend)).toBeLessThan(0.4)
      expect(nodes.map((node) => [...node.position.toArray(), ...node.scale.toArray()])).toEqual(
        bones,
      )
    }
  },
)
