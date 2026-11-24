import { keepHumanFigure } from '$lib/tour/humanConstraints'
import { coupleThrowGrip } from './coupling'
import { alignThrowGrip } from './contacts'
import { poseThrowPhysics, settleThrowPhysics } from './physics'
import { poseThrowPrologue } from './prologue'
import type { EffectSceneOptions, FighterEffectScene } from '../fighterEffectScene'

/** Both rigs are posed before contacts, the right-hand spear and its three rhythmic accents. */
export function createBonolenovThrowScene(options: EffectSceneOptions): FighterEffectScene {
  const { THREE, scene } = options
  const rhythm = new THREE.Group()
  rhythm.name = 'throw-signature:rhythm'
  const geometry = new THREE.RingGeometry(0.12, 0.15, 32)
  const beats = [0, 1, 2].map(() => {
    const material = new THREE.MeshBasicMaterial({
      color: 0xe6c777,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.rotation.x = -Math.PI / 2
    rhythm.add(mesh)
    return mesh
  })
  rhythm.visible = false
  scene.add(rhythm)
  return {
    sync(state) {
      rhythm.visible = false
      const frame = options.throwFrame?.()
      if (!frame?.active || state[frame.attacker].id !== 'bonolenov') return
      poseThrowPhysics(options, frame)
      coupleThrowGrip(options, frame)
      alignThrowGrip(options, frame)
      constrainBodies(options, frame)
      poseThrowPrologue(options, state, frame)
      settleThrowPhysics(options, frame)
      const actor = options.figureOf?.(frame.attacker)
      if (!actor || options.comfort?.().flashes === false) return
      rhythm.visible = true
      const origin = actor.getWorldPosition(new THREE.Vector3())
      const t = frame.age / frame.duration
      beats.forEach((beat, index) => {
        const pulse = Math.max(0, 1 - Math.abs(t - (0.2 + index * 0.22)) / 0.12)
        beat.position.set(origin.x + frame.facing * (index - 0.7) * 0.18, 0.025, (index - 1) * 0.12)
        beat.scale.setScalar(0.8 + (1 - pulse) * 0.5)
        beat.material.opacity = pulse * 0.55
      })
    },
    dispose() {
      rhythm.removeFromParent()
      geometry.dispose()
      beats.forEach((beat) => beat.material.dispose())
    },
  }
}

function constrainBodies(
  options: EffectSceneOptions,
  frame: import('../throwCinematic').ThrowCinematicFrame,
) {
  for (const side of [frame.attacker, frame.victim]) {
    const figure = options.figureOf?.(side)
    if (figure) keepHumanFigure(figure)
  }
}
