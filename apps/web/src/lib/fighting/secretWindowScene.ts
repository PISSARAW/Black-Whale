import { createVisitHatsuModel } from './visitHatsuModel'
import { sleepingBody } from './hanzoProjection'
import { secretWindowVisibleTo } from './secretWindow'
import type { EffectSceneOptions, FighterEffectScene } from './fighterEffectScene'
import type { ArcadeFighter, FightSide, FightState } from './types'
import { fineControlReduced } from './fineControlAnchors'
import type { PresentedSecretWindow } from './perceptionPresentation'

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
  const syncSide = (state: FightState, side: FightSide) => {
    const model = owls[side]
    model.owl.visible = secretWindowVisibleTo(state, side, options.viewer?.() ?? 'player')
    const feed: PresentedSecretWindow | undefined = state[side].secretWindow
    const targetSide = feed?.mode === 'listening' ? side : feed?.target
    if (!targetSide) return
    const original = state[targetSide]
    const target = sleepingBody(original)
    const { low, height } = bodyHeight(original, target)
    const seconds = fineControlReduced(options) ? 0 : (state.frame - feed!.attachedAt) / 60
    model.owl.position.set(
      worldX(target.x) - 0.2,
      worldY(target.y + height) + (low ? 0 : Math.sin(seconds * 4) * 0.035),
      0.25,
    )
    model.owl.rotation.z = Math.sin(seconds * 5) * 0.04
  }
  return {
    sync: (state) => {
      syncSide(state, 'player')
      syncSide(state, 'opponent')
    },
    dispose: () => {
      owls.player.dispose()
      owls.opponent.dispose()
    },
  }
}
function bodyHeight(original: ArcadeFighter, target: ArcadeFighter) {
  const low = Boolean(original.hanzoProjection) || target.knockdownFrames > 0
  return { low, height: low ? 5 : target.crouching ? 8 : 12.5 }
}
