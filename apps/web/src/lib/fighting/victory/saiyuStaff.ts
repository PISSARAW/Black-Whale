import * as THREE from 'three'
import type { VictoryContext } from './types'
import type { SaiyuVictoryPose } from './saiyuPose'
import { createVisitHatsuModel } from '../visitHatsuModel'
import { reachVictoryHand } from './pose'
import { ease } from './resources'

/** The visit's actual extensible staff; hands meet its real shaft at two separate grips. */
export function createSaiyuVictoryStaff() {
  const model = createVisitHatsuModel(THREE, { model: 'priest-staff' })
  model.root.name = 'saiyu-victory-priest-staff'
  return {
    root: model.root,
    sync(context: VictoryContext, pose: SaiyuVictoryPose) {
      const { hero, age } = context
      const wind = ease((age - 282) / 42) * (1 - ease((age - 352) / 8))
      const strike = ease((age - 348) / 12) * (1 - ease((age - 360) / 30))
      const grip = hero.head
        .getWorldPosition(new THREE.Vector3())
        .add(new THREE.Vector3(0.18, -0.48 + wind * 0.38, 0.33))
      const aimed = pose.contact.clone().sub(grip).normalize()
      const direction = new THREE.Vector3(-wind * 0.45, 1, 0)
        .normalize()
        .lerp(aimed, strike)
        .normalize()
      const length =
        (0.8 + wind * 1.9) * (1 - strike) + (grip.distanceTo(pose.contact) + 0.28) * strike
      const start = grip.clone().addScaledVector(direction, -0.28)
      model.root.position.copy(start).addScaledVector(direction, length * 0.5)
      model.root.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction)
      model.root.scale.set(0.8, length / model.size.y, 0.8)
      model.root.updateWorldMatrix(true, true)
      const left = grip.clone().addScaledVector(direction, 0.22)
      const errors = [
        reachVictoryHand(context, { side: 'right', target: grip }),
        reachVictoryHand(context, { side: 'left', target: left }),
      ]
      const tip = start.clone().addScaledVector(direction, length)
      return { tip, errors, length, contactError: tip.distanceTo(pose.contact) }
    },
    dispose: model.dispose,
  }
}
