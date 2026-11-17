import type { EffectSceneOptions } from '../fighterEffectScene'
import type { FightState } from '../types'
import { enContactReadings, MAX_EN_CONTACTS } from './contacts'
/** Neutral bounds and a short motion stroke, without the technique's model, name or colour. */
export function createEnContactScene(options: EffectSceneOptions) {
  const { THREE, scene } = options
  const geometry = new THREE.BoxGeometry(1, 1, 0.03)
  const material = new THREE.MeshBasicMaterial({
    color: 0xc6f4fa,
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
    wireframe: true,
  })
  const meshes: import('three').Mesh[] = [],
    motions: import('three').Mesh[] = []
  const spanX = (x: number, width: number) =>
    Math.abs(options.worldX(x + width) - options.worldX(x))
  const spanY = (y: number, height: number) =>
    Math.abs(options.worldY(y + height) - options.worldY(y))
  return {
    sync(state: FightState) {
      const points = enContactReadings(state, options.viewer?.() ?? 'player')
      while (meshes.length < points.length && meshes.length < MAX_EN_CONTACTS) {
        const mesh = new THREE.Mesh(geometry, material),
          motion = new THREE.Mesh(geometry, material)
        mesh.name = 'en-contact'
        motion.name = 'en-motion'
        scene.add(mesh, motion)
        meshes.push(mesh)
        motions.push(motion)
      }
      meshes.forEach((mesh, index) => {
        const point = points[index],
          motion = motions[index]
        mesh.visible = Boolean(point)
        motion.visible = Boolean(point && (point.dx || point.dy))
        if (!point) return
        const x = options.worldX(point.x),
          y = options.worldY(point.y + point.height / 2)
        mesh.position.set(x, y, 0.3)
        mesh.scale.set(
          Math.max(0.08, spanX(point.x, point.width)),
          Math.max(0.08, spanY(point.y, point.height)),
          1,
        )
        motion.position.set(x + point.dx * 0.14, y + point.dy * 0.14, 0.32)
        motion.scale.set(0.25, 0.025, 1)
        motion.rotation.z = Math.atan2(point.dy, point.dx)
      })
    },
    dispose() {
      for (const mesh of [...meshes, ...motions]) scene.remove(mesh)
      geometry.dispose()
      material.dispose()
    },
  }
}
