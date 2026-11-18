import { paperScatterVisible } from './kallutoScatterVisibility'
import type { EffectSceneOptions, FighterEffectScene } from './fighterEffectScene'

export function createPaperScatterScene(options: EffectSceneOptions): FighterEffectScene {
  const { THREE, scene, worldX, worldY } = options
  const geometry = new THREE.BoxGeometry(0.035, 0.05, 0.006)
  const material = new THREE.MeshBasicMaterial({ color: 0xf4e9e5 })
  const models = new Map<string, import('three').InstancedMesh>()
  const matrix = new THREE.Matrix4()
  return {
    sync(state, seconds) {
      const entries = (state.battlefield?.entities ?? []).filter(
        (entry) =>
          entry.paperScatter &&
          entry.present &&
          entry.health > 0 &&
          paperScatterVisible(state, entry, options.viewer?.() ?? 'player'),
      )
      const present = new Set(entries.map((entry) => entry.id))
      for (const [id, model] of models)
        if (!present.has(id)) {
          scene.remove(model)
          model.dispose()
          models.delete(id)
        }
      for (const entry of entries) {
        let model = models.get(entry.id)
        if (!model) {
          model = new THREE.InstancedMesh(geometry, material, 24)
          model.name = `paper-confetti:${entry.id}`
          models.set(entry.id, model)
          scene.add(model)
        }
        model.position.set(worldX(entry.x), worldY(entry.y), 0.28)
        for (let index = 0; index < 24; index++) {
          const angle = index * 2.4
          matrix.makeRotationZ(entry.paperScatter!.controlled ? seconds * 2 + angle : angle)
          matrix.setPosition(
            Math.cos(angle) * 0.23,
            entry.y <= 0 ? 0.025 : Math.sin(angle) * 0.18,
            (index % 3) * 0.015,
          )
          model.setMatrixAt(index, matrix)
        }
        model.instanceMatrix.needsUpdate = true
        model.computeBoundingSphere()
      }
    },
    dispose() {
      for (const model of models.values()) {
        scene.remove(model)
        model.dispose()
      }
      geometry.dispose()
      material.dispose()
    },
  }
}
