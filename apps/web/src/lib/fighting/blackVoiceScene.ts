import type { PreparedEntity } from './preparationTypes'
import type { FightState } from './types'
import { createVisitScenePool, placeVisitHand } from './visitSceneKit'
import type { EffectSceneOptions, FighterEffectScene } from './fighterEffectScene'

/** Original objects remain visible after page loss; no phone is conjured just by opening a page. */
export function createBlackVoiceScene(options: EffectSceneOptions): FighterEffectScene {
  const pool = createVisitScenePool(options)
  return {
    sync(state) {
      pool.hide()
      syncBodies(state)
      syncWorld(state)
    },
    dispose: pool.dispose,
  }
  function syncBodies(state: FightState) {
    for (const side of ['player', 'opponent'] as const) {
      const fighter = state[side],
        gear = fighter.blackVoiceGear
      for (const piece of [gear?.phone, gear?.armed]) {
        if (!piece?.hand) continue
        const model = prop(piece.id, piece.part)
        placeVisitHand(options, { state, side, root: model.root, hand: piece.hand })
      }
      const pin = fighter.blackVoiceControl?.antenna
      if (pin) {
        const model = prop(pin.id, 'antenna')
        model.root.position.set(
          options.worldX(fighter.x) + 0.12,
          options.worldY(fighter.y) + 1.4,
          0.2,
        )
        model.root.rotation.set(0, 0, -0.2)
      }
    }
  }
  function syncWorld(state: FightState) {
    for (const entity of state.battlefield?.entities ?? []) syncWorldProp(entity)
  }
  function syncWorldProp(entity: PreparedEntity) {
    if (!entity.present || entity.health <= 0) return
    const pin = entity.blackVoiceControl?.antenna
    const part = worldPart(entity)
    if (!part) return
    const model = prop(pin?.id ?? entity.id, part)
    model.root.position.set(
      options.worldX(entity.x),
      options.worldY(entity.y) + (pin ? 1.4 : 0.05),
      0.2,
    )
    model.root.rotation.set(0, 0, pin ? -0.2 : Math.PI / 2)
  }
  function prop(id: string, part: 'phone' | 'antenna') {
    return pool.get(id, {
      model: part === 'phone' ? 'black-voice' : 'black-voice-antenna',
      anchor: 'floor',
      fit: { height: part === 'phone' ? 0.3 : 0.25 },
    })
  }
}

function worldPart(entity: PreparedEntity) {
  if (entity.blackVoiceControl?.antenna) return 'antenna' as const
  return entity.blackVoicePiece?.part ?? entity.blackVoiceProp
}
