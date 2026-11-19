import { createVisitHatsuModel } from './visitHatsuModel'
import type { FightState } from './types'

interface PredatorSceneOptions {
  THREE: typeof import('three')
  scene: import('three').Scene
  glow: (colour: number, opacity: number) => import('three').MeshBasicMaterial
  worldX: (x: number) => number
  worldY: (y: number) => number
}

/** The visit's attested Salé-salé appearance is the duel's visual reference, not a new universal anatomy. */
export function createPredatorScene(options: PredatorSceneOptions) {
  const models = ['player', 'opponent'].map(() => {
    const model = createVisitHatsuModel(options.THREE, { model: 'predator' })
    model.root.userData.referenceVariant = 'predator-salesale'
    model.fit({ height: 0.9, width: 1.05 })
    model.root.visible = false
    options.scene.add(model.root)
    return model
  })
  return {
    sync(state: FightState, seconds: number) {
      for (const [index, side] of (['player', 'opponent'] as const).entries()) {
        const hunt = state[side].predator?.hunt
        const model = models[index]
        model.root.name = `predator:${side}`
        model.root.visible = Boolean(hunt)
        if (!hunt) continue
        model.root.position.set(options.worldX(hunt.x), options.worldY(hunt.y), 0.3)
        model.root.rotation.z = Math.sin(seconds * 5) * 0.06
        model.body.scale.setScalar(1 + Math.sin(seconds * 9) * 0.035)
      }
    },
    dispose() {
      models.forEach((model) => model.dispose())
    },
  }
}
