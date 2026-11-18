import * as THREE from 'three'
import type { NobunagaContext } from './nobunagaTypes'
import type { NobunagaVictoryPose } from './nobunagaPose'
import { NOBUNAGA_EN_RADIUS, NOBUNAGA_ENTRY, NOBUNAGA_CONTACT } from './nobunagaTypes'
import { disposeVictoryObject, ease } from './resources'

export function createNobunagaEn() {
  const root = new THREE.Group()
  root.name = 'nobunaga-en-boundary'
  const material = new THREE.LineBasicMaterial({
    color: 0xb5d9e1,
    transparent: true,
    opacity: 0.3,
    depthWrite: false,
  })
  const lines = Array.from({ length: 3 }, (_, i) => {
    const points = Array.from(
      { length: 100 },
      (_, j) =>
        new THREE.Vector3(Math.cos((j / 100) * Math.PI * 2), Math.sin((j / 100) * Math.PI * 2), 0),
    )
    const line = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(points), material)
    if (i === 1) line.rotation.y = Math.PI / 2
    if (i === 2) line.rotation.x = Math.PI / 2
    root.add(line)
    return line
  })
  const floor = new THREE.Mesh(
    new THREE.TorusGeometry(1, 0.006, 6, 120),
    new THREE.MeshBasicMaterial({
      color: 0xc5d9db,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
    }),
  )
  floor.rotation.x = -Math.PI / 2
  root.add(floor)
  const slash = new THREE.Line(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({ color: 0xf4eee7, transparent: true }),
  )
  root.add(slash)
  return {
    root,
    sync(context: NobunagaContext, pose: NobunagaVictoryPose) {
      const { age } = context
      const amount = ease((age - 48) / 60) * (1 - ease((age - NOBUNAGA_ENTRY) / 18))
      material.opacity = amount * 0.26
      lines.forEach((line) => {
        line.position.copy(pose.enCentre)
        line.scale.setScalar(NOBUNAGA_EN_RADIUS)
      })
      const radius = Math.sqrt(NOBUNAGA_EN_RADIUS ** 2 - pose.enCentre.y ** 2)
      floor.position.set(pose.enCentre.x, 0.025, pose.enCentre.z)
      floor.scale.setScalar(radius)
      floor.material.opacity = amount * 0.7
      slash.visible = age >= NOBUNAGA_CONTACT && age < NOBUNAGA_CONTACT + 12
      slash.geometry.setFromPoints([
        pose.contact.clone().add(new THREE.Vector3(-0.45, 0.12, 0.02)),
        pose.contact.clone().add(new THREE.Vector3(0.45, -0.12, 0.02)),
      ])
      slash.material.opacity =
        (context.comfort.flashes ? 0.9 : 0.35) * (1 - ease((age - NOBUNAGA_CONTACT) / 12))
    },
    dispose: () => disposeVictoryObject(root),
  }
}
