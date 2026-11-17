import type { EffectSceneOptions } from '../fighterEffectScene'
import type { FightState } from '../types'
import { enContactPoints, MAX_EN_CONTACTS } from './contacts'
/** A neutral contact marker never reproduces the concealed technique's shape or colour. */
export function createEnContactScene(options: EffectSceneOptions) {
  const { THREE, scene } = options
  const geometry = new THREE.SphereGeometry(0.08, 6, 4)
  const material = new THREE.MeshBasicMaterial({
    color: 0xc6f4fa,
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
  })
  const meshes: import('three').Mesh[] = []
  return {
    sync(state: FightState) {
      const points = enContactPoints(state, options.viewer?.() ?? 'player')
      while (meshes.length < points.length && meshes.length < MAX_EN_CONTACTS) {
        const mesh = new THREE.Mesh(geometry, material)
        mesh.name = 'en-contact'
        scene.add(mesh)
        meshes.push(mesh)
      }
      meshes.forEach((mesh, index) => {
        const point = points[index]
        mesh.visible = Boolean(point)
        if (point) mesh.position.set(options.worldX(point.x), options.worldY(point.y) + 0.06, 0.3)
      })
    },
    dispose() {
      for (const mesh of meshes) scene.remove(mesh)
      geometry.dispose()
      material.dispose()
    },
  }
}
