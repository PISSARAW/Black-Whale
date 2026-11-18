import { createGyoReadingScene } from './nenCombat/gyoScene'
import { createNenConcentrationScene } from './nenConcentrationScene'
import { activeEnRadius } from './en/access'
import { createEnContactScene } from './en/contactScene'
import type { EffectSceneOptions } from './fighterEffectScene'
import { gyoSight } from './nenPerception'
import type { FightState } from './types'

/** Radius uses duel coordinates, rather than the exploration rig's metre scale. */
export function createNenFieldScene(options: EffectSceneOptions) {
  const { THREE, scene } = options
  const contacts = createEnContactScene(options)
  const auraReading = createGyoReadingScene(options)
  const concentration = createNenConcentrationScene(options)
  const geometry = new THREE.RingGeometry(0.98, 1, 64)
  const fields = (['player', 'opponent'] as const).map((side) => {
    const material = new THREE.MeshBasicMaterial({
      color: 0x8be8ff,
      transparent: true,
      opacity: 0.32,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.rotation.x = -Math.PI / 2
    scene.add(mesh)
    return { side, mesh, material }
  })
  return {
    sync(state: FightState) {
      contacts.sync(state)
      auraReading.sync(state)
      concentration.sync(state)
      const viewer = options.viewer?.() ?? 'player'
      for (const { side, mesh } of fields) {
        const fighter = state[side]
        mesh.visible =
          Boolean(activeEnRadius(fighter)) &&
          (side === viewer || !fighter.nen.in || gyoSight(state[viewer]))
        const radius = activeEnRadius(fighter) || 1
        const scale = Math.abs(options.worldX(fighter.x + radius) - options.worldX(fighter.x))
        mesh.scale.setScalar(scale)
        mesh.position.set(options.worldX(fighter.x), options.worldY(fighter.y) + 0.025, 0)
      }
    },
    dispose() {
      contacts.dispose()
      auraReading.dispose()
      concentration.dispose()
      geometry.dispose()
      for (const { mesh, material } of fields) {
        scene.remove(mesh)
        material.dispose()
      }
    },
  }
}
