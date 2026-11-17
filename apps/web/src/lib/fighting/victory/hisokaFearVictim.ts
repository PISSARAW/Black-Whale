import * as THREE from 'three'
import { HISOKA_FEAR_DEATH, hisokaPanicAmount } from './hisokaFearPanic'
import type { VictoryContext } from './types'
import { disposeVictoryObject } from './resources'
export function createHisokaFearVictim() {
  const root = new THREE.Group()
  root.name = 'hisoka-victim-last-silent-breath'
  const mouth = new THREE.Mesh(
    new THREE.CircleGeometry(1, 40),
    new THREE.MeshBasicMaterial({ color: 0x24151e, side: THREE.DoubleSide }),
  )
  const teeth = new THREE.Mesh(
    new THREE.PlaneGeometry(0.033, 0.007),
    new THREE.MeshBasicMaterial({ color: 0xe7dec9, side: THREE.DoubleSide }),
  )
  teeth.position.set(0, 0.025, 0.001)
  const lowerTeeth = teeth.clone()
  lowerTeeth.position.y = -0.026
  root.add(mouth, teeth, lowerTeeth)
  const sweat = new THREE.Group()
  const sweatMaterial = new THREE.MeshBasicMaterial({
    color: 0xd9e6e9,
    transparent: true,
    opacity: 0.85,
  })
  for (let i = 0; i < 6; i++) {
    const bead = new THREE.Mesh(new THREE.SphereGeometry(0.005, 10, 8), sweatMaterial)
    bead.scale.set(0.7, 1.7, 0.45)
    sweat.add(bead)
  }
  return {
    apply(context: VictoryContext) {
      const panic = hisokaPanicAmount(context.age),
        dead = context.age >= HISOKA_FEAR_DEATH
      sweat.visible = panic > 0.05 && !dead
      sweat.children.forEach((bead, i) => {
        const phase = ((context.age - 228) * 0.012 + i * 0.23) % 1
        bead.position.set((i % 2 ? 1 : -1) * (0.094 + (i % 3) * 0.007), 0.035 - phase * 0.11, 0.179)
        bead.scale.y = 1 + panic * 1.2
      })
      context.victim.head.add(sweat)
      context.defer(() => sweat.removeFromParent())
      root.visible = panic > 0
      const original = context.victim.head.getObjectByName('face-mouth')
      if (!root.visible || !original) return
      context.save(original)
      original.visible = false
      root.position.copy(original.getWorldPosition(new THREE.Vector3()))
      root.quaternion.copy(context.victim.head.getWorldQuaternion(new THREE.Quaternion()))
      root.scale.copy(context.victim.head.getWorldScale(new THREE.Vector3()))
      root.translateZ(0.009)
      root.translateY(dead ? 0 : Math.sin(context.age * 0.91) * panic * 0.003)
      const gasp = 0.8 + 0.2 * Math.pow(Math.sin(context.age * 0.44), 2)
      mouth.scale.set(0.024 + panic * 0.01, dead ? 0.022 : (0.035 + panic * 0.025) * gasp, 1)
      teeth.visible = !dead
      lowerTeeth.visible = !dead
      lowerTeeth.position.y = -(0.03 + panic * 0.012) * gasp
      context.add(root)
    },
    dispose: () => {
      disposeVictoryObject(root)
      disposeVictoryObject(sweat)
    },
  }
}
