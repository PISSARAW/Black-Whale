import { hasMelodyFlute } from './melodyRules'
import { createVisitScenePool, placeVisitHand } from './visitSceneKit'
import type { EffectSceneOptions, FighterEffectScene } from './fighterEffectScene'

/** The native rig already shares its flute; a borrower must bring the actual instrument. */
export function createMelodyFluteScene(options: EffectSceneOptions): FighterEffectScene {
  const pool = createVisitScenePool(options)
  return {
    sync(state) {
      pool.hide()
      for (const side of ['player', 'opponent'] as const) {
        const fighter = state[side]
        const signature = options.figureOf?.(side)?.getObjectByName('signature-flute')
        const equipped = hasMelodyFlute(fighter)
        if (signature) signature.visible = equipped
        if (!equipped || !fighter.melodyPerformance || signature) continue
        const flute = pool.get(`melody-borrowed-flute:${side}`, {
          model: 'melody-flute',
          fit: { width: 0.6 },
        })
        placeVisitHand(options, { state, side, root: flute.root, hand: 'left' })
        flute.root.position.y += 0.08
        flute.root.position.z += 0.1
      }
    },
    dispose: pool.dispose,
  }
}
