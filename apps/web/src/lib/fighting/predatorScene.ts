import type { FightState } from './types'

interface PredatorSceneOptions {
  THREE: typeof import('three')
  scene: import('three').Scene
  glow: (colour: number, opacity: number) => import('three').MeshBasicMaterial
  worldX: (x: number) => number
  worldY: (y: number) => number
}

/** Abstract countermeasure silhouette: the attested Salé-salé design is not universal. */
export function createPredatorScene(options: PredatorSceneOptions) {
  const { THREE, scene, worldX, worldY } = options
  const geometry = new THREE.ConeGeometry(0.065, 0.23, 4)
  const ring = new THREE.TorusGeometry(0.3, 0.025, 5, 16)
  const material = options.glow(0xb8c79a, 0.85)
  const models = ['player', 'opponent'].map(() => {
    const root = new THREE.Group()
    root.name = 'predator-countermeasure-silhouette'
    root.add(new THREE.Mesh(ring, material))
    for (let index = 0; index < 8; index++) {
      const tooth = new THREE.Mesh(geometry, material)
      const angle = (index * Math.PI) / 4
      tooth.position.set(Math.sin(angle) * 0.22, Math.cos(angle) * 0.22, 0)
      tooth.rotation.z = -angle + Math.PI
      root.add(tooth)
    }
    root.visible = false
    scene.add(root)
    return root
  })
  return {
    sync(state: FightState, seconds: number) {
      for (const [index, side] of (['player', 'opponent'] as const).entries()) {
        const hunt = state[side].predator?.hunt
        const model = models[index]
        model.visible = Boolean(hunt)
        if (!hunt) continue
        model.position.set(worldX(hunt.x), worldY(hunt.y), 0.3)
        model.rotation.z = seconds * 0.9
        model.scale.setScalar(1 + Math.sin(seconds * 9) * 0.12)
      }
    },
    dispose() {
      models.forEach((model) => scene.remove(model))
      geometry.dispose()
      ring.dispose()
    },
  }
}
