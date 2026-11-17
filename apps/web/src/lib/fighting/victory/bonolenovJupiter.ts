import * as THREE from 'three'
import type { VictoryContext } from './types'
import type { BonolenovVictoryPose } from './bonolenovPose'
import { BONOLENOV_FORM, BONOLENOV_CHASE, BONOLENOV_IMPACT } from './bonolenovPose'
import { createVisitHatsuModel } from '../visitHatsuModel'
import { ease } from './resources'

export function createVictoryJupiter() {
  const model = createVisitHatsuModel(THREE, { model: 'jupiter', joints: ['jupiter-sphere'] })
  model.root.name = 'bonolenov-victory-jupiter'
  return {
    root: model.root,
    sync(context: VictoryContext, pose: BonolenovVictoryPose) {
      const { hero, victim, age } = context
      const size = Math.max(1.8, Math.min(2.7, victim.height * 1.25))
      const formation = ease((age - BONOLENOV_FORM) / (BONOLENOV_CHASE - BONOLENOV_FORM))
      const vanish = 1 - ease((age - 420) / 54)
      model.fit({ width: size * 2, height: size * 2 })
      model.root.rotation.set(0.12, (age - BONOLENOV_FORM) * 0.035, 0)
      model.root.position.set(0, 0, 0)
      model.root.updateWorldMatrix(true, true)
      const core = model.joints.get('jupiter-sphere')!
      const radius = core.getWorldScale(new THREE.Vector3()).x
      const y = radius + 0.03
      const dy = pose.contact.y - y
      const edge = Math.sqrt(Math.max(0.01, radius * radius - dy * dy))
      const final = new THREE.Vector3(pose.contact.x - edge, y, pose.contact.z)
      const pursuit = ease((age - BONOLENOV_CHASE) / (BONOLENOV_IMPACT - BONOLENOV_CHASE))
      const centre = new THREE.Vector3(pose.start.x, y, pose.start.z).lerp(final, pursuit)
      centre.x += ease((age - BONOLENOV_IMPACT) / 24) * 0.3
      model.root.position.add(centre.clone().sub(core.getWorldPosition(new THREE.Vector3())))
      model.root.scale.multiplyScalar(Math.max(0.001, formation * vanish))
      model.root.visible = age >= BONOLENOV_FORM && age < 474
      if (age >= BONOLENOV_CHASE) {
        hero.root.position.x = centre.x
        hero.root.position.z = centre.z
        hero.root.rotation.y = age >= 474 ? 0 : 1.15
      }
      hero.root.visible = formation * vanish * radius < hero.height * 0.6
      hero.root.updateWorldMatrix(true, true)
      model.root.updateWorldMatrix(true, true)
      return {
        centre,
        radius,
        formation,
        pursuit,
        contactError: Math.abs(centre.x + edge - pose.contact.x),
      }
    },
    dispose: model.dispose,
  }
}
