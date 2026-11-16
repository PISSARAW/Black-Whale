import { chrolloHasActivePage } from './chrolloBook'
import { createVisitScenePool, freeVisitHand, placeVisitHand } from './visitSceneKit'
import type { EffectSceneOptions, FighterEffectScene } from './fighterEffectScene'

export function createBlackVoiceScene(options: EffectSceneOptions): FighterEffectScene {
  const pool = createVisitScenePool(options)
  return {
    sync(state, seconds) {
      pool.hide()
      for (const side of ['player', 'opponent'] as const) {
        const fighter = state[side]
        const active = fighter.id === 'chrollo' && chrolloHasActivePage(fighter, 'black-voice')
        if (active) {
          const phone = pool.get(`black-voice-phone:${side}`, {
            model: 'black-voice',
            fit: { height: 0.3 },
          })
          placeVisitHand(options, { state, side, root: phone.root, hand: freeVisitHand(fighter) })
          phone.root.rotateX(-0.15 + Math.sin(seconds * 3) * 0.015)
        }
        const victim = state[side === 'player' ? 'opponent' : 'player']
        if (!active || victim.hatsuEffects.manipulatedFrames <= 0) continue
        const antenna = pool.get(`black-voice-antenna:${side}`, {
          model: 'black-voice-antenna',
          anchor: 'floor',
          fit: { height: 0.25 },
        })
        antenna.root.position.set(
          options.worldX(victim.x) + 0.12,
          options.worldY(victim.y) + 1.4,
          0.2,
        )
        antenna.root.rotation.z = -0.2
      }
    },
    dispose: pool.dispose,
  }
}
