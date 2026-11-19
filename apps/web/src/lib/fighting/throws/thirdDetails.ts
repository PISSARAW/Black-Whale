import { hasEquipment } from '../preparationWorld'
import { throwPerformance } from './catalogue'
import { poseThrowPrologue } from './prologue'
import type { EffectSceneOptions } from '../fighterEffectScene'
import type { ThrowCinematicFrame } from '../throwCinematic'
import type { FightState } from '../types'

export function createThrowThirdDetails(options: EffectSceneOptions) {
  const { THREE, scene } = options
  const needles = new THREE.Group(),
    rhythm = new THREE.Group()
  needles.name = 'throw-signature:needles'
  rhythm.name = 'throw-signature:rhythm'
  const shaft = new THREE.CylinderGeometry(0.006, 0.006, 0.18, 6)
  const cap = new THREE.SphereGeometry(0.018, 8, 6)
  const silver = new THREE.MeshBasicMaterial({ color: 0xcbd5e1 })
  for (const index of [-1, 0, 1]) {
    const pin = new THREE.Mesh(shaft, silver),
      head = new THREE.Mesh(cap, silver)
    pin.position.x = head.position.x = index * 0.035
    head.position.y = 0.09
    needles.add(pin, head)
  }
  const ring = new THREE.RingGeometry(0.12, 0.15, 32)
  const beats = [0, 1, 2].map(() => {
    const material = new THREE.MeshBasicMaterial({
      color: 0xe6c777,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
    const mesh = new THREE.Mesh(ring, material)
    mesh.rotation.x = -Math.PI / 2
    rhythm.add(mesh)
    return mesh
  })
  scene.add(needles, rhythm)
  const hide = () => {
    needles.visible = rhythm.visible = false
  }
  hide()
  return {
    hide,
    sync(state: FightState, frame: ThrowCinematicFrame) {
      const figure = options.figureOf?.(frame.attacker)
      if (!figure) return
      const effect = throwPerformance(frame.performance)?.effect
      if (effect === 'needle' && needlePropAvailable(state, frame)) {
        const hand = figure.getObjectByName('hand-right')
        if (hand) {
          needles.visible = true
          hand.getWorldPosition(needles.position)
          hand.getWorldQuaternion(needles.quaternion)
          needles.rotateX(Math.PI / 2)
        }
      }
      if (effect !== 'music') return
      poseThrowPrologue(options, state, frame)
      if (options.comfort?.().flashes === false) return
      rhythm.visible = true
      const origin = figure.getWorldPosition(new THREE.Vector3())
      const t = frame.age / frame.duration
      beats.forEach((beat, index) => {
        const pulse = Math.max(0, 1 - Math.abs(t - (0.2 + index * 0.22)) / 0.12)
        beat.position.set(origin.x + frame.facing * (index - 0.7) * 0.18, 0.025, (index - 1) * 0.12)
        beat.scale.setScalar(0.8 + (1 - pulse) * 0.5)
        beat.material.opacity = pulse * 0.55
      })
    },
    dispose() {
      needles.removeFromParent()
      rhythm.removeFromParent()
      shaft.dispose()
      cap.dispose()
      silver.dispose()
      ring.dispose()
      beats.forEach((beat) => beat.material.dispose())
    },
  }
}

function needlePropAvailable(state: FightState, frame: ThrowCinematicFrame) {
  const actor = state[frame.attacker]
  return !actor.weaponsConfiscated && hasEquipment(actor, 'needles')
}
