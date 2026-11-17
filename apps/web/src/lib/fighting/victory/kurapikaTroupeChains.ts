import * as THREE from 'three'
import type { VictoryContext } from './types'
import type { KurapikaTroupePose } from './kurapikaTroupePose'
import { TROUPE_JAIL_START, TROUPE_RELEASE, TROUPE_RELEASED } from './kurapikaTroupePose'
import { createKurapikaChainModel } from '../kurapikaChainModel'
import { ease } from './resources'

export function createKurapikaTroupeChains() {
  const chain = createKurapikaChainModel(THREE)
  chain.root.name = 'kurapika-troupe-chain-jail'
  chain.tips[2].scale.multiplyScalar(0.5)
  return {
    root: chain.root,
    sync(context: VictoryContext, pose: KurapikaTroupePose) {
      chain.hide()
      const { age, victim } = context
      if (age <= TROUPE_JAIL_START || age >= TROUPE_RELEASED) return false
      const release = 1 - ease((age - TROUPE_RELEASE) / 42)
      const flight = ease((age - TROUPE_JAIL_START) / 12) * release
      const wrap = ease((age - TROUPE_JAIL_START - 12) / 18) * release
      const centre = pose.body.getCenter(new THREE.Vector3())
      const rotation = pose.torso.getWorldQuaternion(new THREE.Quaternion())
      const x = victim.width * 0.57 + 0.025,
        z = Math.min(victim.width * 0.32 + 0.025, victim.height * 0.17)
      const points = [pose.middle]
      for (let i = 0; i <= 96; i++) {
        const t = (i / 96) * wrap,
          angle = t * Math.PI * 6
        const coil = new THREE.Vector3(
          Math.cos(angle) * x,
          (t - 0.5) * victim.height * 0.38,
          Math.sin(angle) * z,
        )
          .applyQuaternion(rotation)
          .add(centre)
        points.push(pose.middle.clone().lerp(coil, flight))
      }
      chain.draw({
        points,
        stage: 2,
        direction: new THREE.Vector3(0, 1, 0).applyQuaternion(rotation),
      })
      return true
    },
    dispose: chain.dispose,
  }
}
