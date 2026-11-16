import { createVisitHatsuModel } from './visitHatsuModel'
import { sleepingBody } from './hanzoProjection'
import { secretWindowVisibleTo } from './secretWindow'
import type { EffectSceneOptions, FighterEffectScene } from './fighterEffectScene'
import type { FightSide, FightState } from './types'

/** The default scene is P1's view: an enemy observer's private bird stays invisible. */
export function createSecretWindowScene(options: EffectSceneOptions): FighterEffectScene {
  const { THREE, scene, worldX, worldY } = options
  const makeOwl = (side: FightSide) => {
    const model = createVisitHatsuModel(THREE, { model: 'secret-window' })
    model.fit({ height: 0.48, width: 0.34 })
    const owl = model.root
    owl.name = `secret-window-${side}`
    owl.rotation.y = Math.PI
    scene.add(owl)
    return { owl, dispose: model.dispose }
  }
  const owls = { player: makeOwl('player'), opponent: makeOwl('opponent') }
  const syncSide = (state: FightState, side: FightSide, seconds: number) => {
    const model = owls[side]
    model.owl.visible = secretWindowVisibleTo(state, side, options.viewer?.() ?? 'player')
    const targetSide = state[side].secretWindow?.target
    if (!targetSide) return
    const original = state[targetSide]
    const target = sleepingBody(original)
    const low = Boolean(original.hanzoProjection) || target.knockdownFrames > 0
    const height = low ? 5 : target.crouching ? 8 : 12.5
    model.owl.position.set(
      worldX(target.x) - 0.2,
      worldY(target.y + height) + Math.sin(seconds * 4) * 0.035,
      0.25,
    )
    model.owl.rotation.z = Math.sin(seconds * 5) * 0.04
  }
  return {
    sync: (state, seconds) => {
      syncSide(state, 'player', seconds)
      syncSide(state, 'opponent', seconds)
    },
    dispose: () => {
      owls.player.dispose()
      owls.opponent.dispose()
    },
  }
}
