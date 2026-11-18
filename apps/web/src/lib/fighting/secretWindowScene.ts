import { createVisitHatsuModel } from './visitHatsuModel'
import { sleepingBody } from './hanzoProjection'
import { secretWindowTarget } from './secretWindow'
import { privateWindowBirdVisible, secretWindowBirdHeight } from './secretWindowPlacement'
import { physicalBodyAt } from './fightBodyIdentity'
import { createSecretWindowListeningScene } from './secretWindowListeningScene'
import type { EffectSceneOptions, FighterEffectScene } from './fighterEffectScene'
import type { FightSide, FightState } from './types'
import { fineControlReduced } from './fineControlAnchors'

/** The default scene is P1's view: an enemy observer's private bird stays invisible. */
export function createSecretWindowScene(options: EffectSceneOptions): FighterEffectScene {
  const listening = createSecretWindowListeningScene(options)
  const { THREE, scene, worldX, worldY } = options
  const makeOwl = (side: FightSide, member: number) => {
    const model = createVisitHatsuModel(THREE, { model: 'secret-window' })
    model.fit({ height: 0.48, width: 0.34 })
    const owl = model.root
    owl.name = member === 0 ? `secret-window-${side}` : `secret-window-${side}-${member}`
    owl.rotation.y = Math.PI
    scene.add(owl)
    return { owl, dispose: model.dispose }
  }
  const owls = {
    player: [0, 1, 2].map((member) => makeOwl('player', member)),
    opponent: [0, 1, 2].map((member) => makeOwl('opponent', member)),
  }
  const syncBody = (
    state: FightState,
    ref: { side: FightSide; member: number },
    seconds: number,
  ) => {
    const { side, member } = ref
    const model = owls[side][member]
    const owner = physicalBodyAt(state, side, member)
    const feed = owner?.secretWindow
    model.owl.visible = privateWindowBirdVisible(
      state,
      { owner: side, member },
      options.viewer?.() ?? 'player',
    )
    const original = feed && secretWindowTarget(state, feed)
    if (!original) return
    const target = sleepingBody(original)
    const height = secretWindowBirdHeight(original)
    const low = Boolean(original.hanzoProjection) || target.knockdownFrames > 0
    seconds = fineControlReduced(options) ? 0 : state.frame / 60
    model.owl.position.set(
      worldX(target.x) - 0.2,
      worldY(target.y + height) + (low ? 0 : Math.sin(seconds * 4) * 0.035),
      0.25,
    )
    model.owl.rotation.z = Math.sin(seconds * 5) * 0.04
  }
  return {
    sync: (state, seconds) => {
      listening.sync(state, seconds)
      for (const side of ['player', 'opponent'] as const)
        owls[side].forEach((_model, member) => syncBody(state, { side, member }, seconds))
    },
    dispose: () => {
      listening.dispose()
      Object.values(owls)
        .flat()
        .forEach((model) => model.dispose())
    },
  }
}
