import { createVisitScenePool } from './visitSceneKit'
import type { EffectSceneOptions, FighterEffectScene } from './fighterEffectScene'
import { moonlightPartiesVisible } from './moonlightParties'

/** The displayed agreement follows the two real parties, including a borrowed contract. */
export function createMoonlightScene(options: EffectSceneOptions): FighterEffectScene {
  const pool = createVisitScenePool(options)
  return {
    sync(state, seconds) {
      pool.hide()
      const moonlight = state.moonlight
      if (!moonlight) return
      const agreement = moonlight.offer ?? moonlight.active
      if (!agreement) return
      if (!moonlightPartiesVisible(state, agreement)) return
      const signed = Boolean(moonlight.active)
      const contract = pool.get(`moonlight-contract:${signed ? 'signed' : 'offer'}`, {
        model: 'moonlight-contract',
        stage: signed ? 1 : 0,
        joints: ['moonlight-pen'],
        fit: { width: 0.65, depth: 0.55 },
      })
      const first = state[agreement.issuer]
      const second = state[agreement.recipient]
      contract.root.position.set(
        options.worldX((first.x + second.x) / 2),
        options.worldY((first.y + second.y) / 2) + 1.1 + Math.sin(seconds * 3) * 0.015,
        0.55,
      )
      // The visit's signed sheet lies on a table; incline it toward the combat camera.
      contract.root.rotation.x = signed ? 1.05 : 0.1
      const pen = contract.joints.get('moonlight-pen')!
      pen.rotation.z = signed ? 0 : -0.35 + Math.sin(seconds * 5) * 0.025
      pen.position.y = signed ? 0.03 : -0.072 + Math.sin(seconds * 5) * 0.035
    },
    dispose: pool.dispose,
  }
}
