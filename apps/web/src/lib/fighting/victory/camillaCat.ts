import * as THREE from 'three'
import { createVisitHatsuModel } from '../visitHatsuModel'
import { createCamillaPawGrip } from './camillaGrip'
import type { VictoryContext } from './types'
import type { camillaVictoryPose } from './camillaPose'
import { disposeVictoryObject, ease } from './resources'

export function createCamillaVictoryCat() {
  const root = new THREE.Group()
  const model = createVisitHatsuModel(THREE, {
    model: 'cats-name',
    anchor: 'floor',
    joints: ['arm--1', 'arm-1', 'hand--1', 'hand-1', 'cat-tail'],
  })
  root.name = 'camilla-cats-name-victory'
  root.add(model.root)
  const paws = createCamillaPawGrip(model, root)
  const gold = new THREE.MeshBasicMaterial({ color: 0xffe694 })
  const energy = new THREE.Mesh(new THREE.SphereGeometry(0.105, 18, 12), gold)
  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(Array.from({ length: 48 }, () => new THREE.Vector3())),
    new THREE.LineBasicMaterial({ color: 0xffe694, transparent: true, opacity: 0.65 }),
  )
  root.add(energy, line)
  return {
    root,
    sync(context: VictoryContext, pose: ReturnType<typeof camillaVictoryPose>) {
      const { age } = context,
        { ratio } = pose
      model.fit({ height: 2.8 * ratio })
      model.root.scale.multiplyScalar(
        Math.max(0.001, ease(age / 102) * (1 - ease((age - 459) / 51))),
      )
      model.root.position.set(pose.held.x, 0.03, -0.3 * ratio)
      model.root.updateWorldMatrix(true, true)
      model.root.visible = age < 510
      const contacts = paws.sync({
        body: pose.body,
        x: pose.held.x,
        approach: pose.approach,
        ratio,
        active: age >= 102 && age < 357,
      })
      const tail = model.body.localToWorld(new THREE.Vector3(0.85, 1.65, -0.5))
      const returning = age >= 357
      const from = returning ? tail : pose.held.clone().add(new THREE.Vector3(0, 0, 0.1))
      const to = returning ? pose.destination : tail
      const t = returning ? ease((age - 357) / 153) : pose.absorption
      energy.visible = line.visible = age >= 306 && age < 510
      energy.position.copy(from).lerp(to, t)
      energy.position.y += Math.sin(t * Math.PI) * 0.4 * ratio
      energy.scale.setScalar(0.65 + Math.sin(t * Math.PI) * 0.35)
      const positions = line.geometry.getAttribute('position')
      for (let i = 0; i < 48; i++) {
        const p = from.clone().lerp(to, i / 47)
        p.y += Math.sin((i / 47) * Math.PI) * 0.4 * ratio
        positions.setXYZ(i, p.x, p.y, p.z)
      }
      positions.needsUpdate = true
      return { contacts, energy: energy.visible, cat: model.root }
    },
    dispose() {
      paws.dispose()
      model.dispose()
      disposeVictoryObject(root)
    },
  }
}
