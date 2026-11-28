import * as THREE from 'three'
import type { VictoryContext } from './types'
import type { BonolenovVictoryPose } from './bonolenovPose'
import { createJupiterSurface } from './bonolenovJupiterSurface'
import { ease } from './resources'
import timing from './bonolenovTiming.json'

export function createVictoryJupiter() {
  const root = new THREE.Mesh(
    createJupiterSurface(),
    new THREE.MeshBasicMaterial({ vertexColors: true }),
  )
  root.name = 'bonolenov-victory-jupiter'
  return {
    root,
    sync(context: VictoryContext, pose: BonolenovVictoryPose) {
      const { hero, victim, age } = context
      const radius = Math.max(1.55, Math.min(2.28, victim.height * 1.13))
      const formation = ease((age - timing.form) / (timing.chase - timing.form))
      const dissolve = ease((age - timing.dissolve) / (timing.clear - timing.dissolve))
      const surfaceRadius = formation * (1 - dissolve) * radius
      const y = radius + 0.055
      const depthOffset = 0.68
      const edge = Math.sqrt(
        Math.max(0, radius ** 2 - (pose.contact.y - y) ** 2 - depthOffset ** 2),
      )
      const end = new THREE.Vector3(pose.contact.x - edge, y, pose.contact.z - depthOffset)
      const travel = Math.max(0, Math.min(1, (age - timing.chase) / (timing.impact - timing.chase)))
      const pursuit = travel ** 1.55
      const centre = new THREE.Vector3(pose.start.x, y, pose.start.z).lerp(end, pursuit)
      centre.x += ease((age - timing.impact) / 23) * 0.69
      centre.y = hero.height * 0.53 + (y - hero.height * 0.53) * formation * (1 - dissolve)
      root.rotation.set(0.11, (age - timing.form) * 0.021, 0)
      root.scale.setScalar(Math.max(0.001, surfaceRadius))
      root.position.copy(centre)
      root.visible = age >= timing.form && age < timing.clear
      hero.root.position.x = centre.x
      hero.root.position.z = centre.z
      hero.root.visible = surfaceRadius < hero.height * 0.56
      hero.root.updateWorldMatrix(true, true)
      return {
        centre,
        radius,
        surfaceRadius,
        formation,
        pursuit,
        separation: centre.distanceTo(pose.contact) - surfaceRadius,
        contactError: Math.abs(centre.distanceTo(pose.contact) - surfaceRadius),
      }
    },
    dispose() {
      root.removeFromParent()
      root.geometry.dispose()
      root.material.dispose()
    },
  }
}
export type VictoryJupiter = ReturnType<ReturnType<typeof createVictoryJupiter>['sync']>
