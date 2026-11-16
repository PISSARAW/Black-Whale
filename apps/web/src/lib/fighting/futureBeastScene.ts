import { createVisitScenePool } from './visitSceneKit'
import type { EffectSceneOptions, FighterEffectScene } from './fighterEffectScene'
import { visibleFutureBeastOwner } from './parallelFuturePresentation'

/** The active personal beast follows its real owner in either slot. */
export function createFutureBeastScene(options: EffectSceneOptions): FighterEffectScene {
  const pool = createVisitScenePool(options)
  return {
    sync(state, seconds) {
      pool.hide()
      const side = visibleFutureBeastOwner(state, options.viewer?.())
      if (!side) return
      const beast = pool.get(`tserriednich-personal-beast:${side}`, {
        model: 'tserriednich-second',
        anchor: 'floor',
        fit: { height: 1.6, width: 1.8 },
      })
      const owner = state[side]
      beast.root.position.set(
        options.worldX(owner.x) - owner.facing * 1.0,
        options.worldY(owner.y) + 0.04 + Math.sin(seconds * 2.5) * 0.025,
        -0.35,
      )
      beast.root.rotation.y = owner.facing * 0.4
    },
    dispose: pool.dispose,
  }
}
