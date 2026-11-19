import { dolphinVisibleTo } from './dolphinVisibility'
import { createVisitHatsuModel } from './visitHatsuModel'
import { equippedDolphin } from './dolphinBorrowing'
import type { EffectSceneOptions, FighterEffectScene } from './fighterEffectScene'

/** Each owner has a separate model; only the selected viewer's private dolphin is visible. */
export function createStealthDolphinScene(options: EffectSceneOptions): FighterEffectScene {
  const models = (['player', 'opponent'] as const).map((side) => {
    const model = createVisitHatsuModel(options.THREE, { model: 'stealth-dolphin' })
    model.fit({ width: 0.7, height: 0.58 })
    model.root.name =
      side === 'player' ? 'kurapika-stealth-dolphin' : `kurapika-stealth-dolphin:${side}`
    options.scene.add(model.root)
    return { side, model }
  })
  return {
    sync(state, seconds) {
      for (const { side, model } of models) {
        const fighter = state[side]
        model.root.visible =
          dolphinVisibleTo(options.viewer?.() ?? 'player', side, fighter.dolphinLoan) &&
          Boolean(equippedDolphin(fighter)?.loaded)
        model.root.position.set(
          options.worldX(fighter.x) - fighter.facing * 0.6,
          options.worldY(fighter.y) + 1.55 + Math.sin(seconds * 4) * 0.04,
          0.3,
        )
        model.root.rotation.y = (fighter.facing * Math.PI) / 3
        model.root.rotation.z = Math.sin(seconds * 3) * 0.04
      }
    },
    dispose() {
      models.forEach(({ model }) => model.dispose())
    },
  }
}
