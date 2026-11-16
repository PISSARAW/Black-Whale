import { createVisitHatsuModel } from './visitHatsuModel'
import { kurapikaNenActive } from './kurapika'
import type { EffectSceneOptions, FighterEffectScene } from './fighterEffectScene'

/** Stealth Dolphin is visible only to its user; the scene uses P1's viewpoint. */
export function createStealthDolphinScene(options: EffectSceneOptions): FighterEffectScene {
  const model = createVisitHatsuModel(options.THREE, { model: 'stealth-dolphin' })
  model.fit({ width: 0.7, height: 0.58 })
  model.root.name = 'kurapika-stealth-dolphin'
  options.scene.add(model.root)
  return {
    sync(state, seconds) {
      const fighter = state.player
      model.root.visible = Boolean(fighter.kurapika?.held?.loaded && kurapikaNenActive(fighter))
      model.root.position.set(options.worldX(fighter.x) - fighter.facing * 0.6,
        options.worldY(fighter.y) + 1.55 + Math.sin(seconds * 4) * 0.04, 0.3)
      model.root.rotation.y = fighter.facing * Math.PI / 3
      model.root.rotation.z = Math.sin(seconds * 3) * 0.04
    },
    dispose: model.dispose,
  }
}
