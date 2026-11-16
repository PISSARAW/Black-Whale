import { createVisitScenePool } from './visitSceneKit'
import type { EffectSceneOptions, FighterEffectScene } from './fighterEffectScene'

/** P1's private view of the active personal beast; no passive guardian is summoned. */
export function createFutureBeastScene(options: EffectSceneOptions): FighterEffectScene {
  const pool = createVisitScenePool(options)
  return {
    sync(state, seconds) {
      pool.hide()
      const future = state.parallelFuture
      if (!future || future.owner !== 'player' || future.phase === 'preparing') return
      const beast = pool.get('tserriednich-personal-beast:player', {
        model: 'tserriednich-second',
        anchor: 'floor',
        fit: { height: 1.6, width: 1.8 },
      })
      const owner = state.player
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
