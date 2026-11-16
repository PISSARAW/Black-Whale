import { createKurapikaChainModel } from './kurapikaChainModel'
import { kurapikaChainMotions } from './kurapikaChainMotion'
import { kurapikaChainPath } from './kurapikaChainPath'
import { poseKurapikaChainHand } from './kurapikaChainHand'
import { chainChest, hideLegacyChain } from './kurapikaChainAnchors'
import type { EffectSceneOptions, FighterEffectScene } from './fighterEffectScene'
import type { FightSide, FightState } from './types'

/** The visit's five models, attached to the animated right hand instead of the arena origin. */
export function createKurapikaEffectScene(options: EffectSceneOptions): FighterEffectScene {
  const groups = (['player', 'opponent'] as const).map((side) => {
    const model = createKurapikaChainModel(options.THREE)
    model.root.name = `kurapika-chains:${side}`
    options.scene.add(model.root)
    return { side, model }
  })

  function syncGroup(group: (typeof groups)[number], state: FightState) {
    const { side, model } = group
    const targetSide: FightSide = side === 'player' ? 'opponent' : 'player'
    const motions = kurapikaChainMotions(state, side)
    poseKurapikaChainHand(options, { state, side, motions, reaches: model.reaches })
    hideLegacyChain(options, side)
    model.hide()
    model.seal.visible = state[targetSide].judgmentChain?.owner === side
    if (model.seal.visible) {
      model.seal.position.copy(chainChest(options, { state, side: targetSide }))
      model.seal.position.y += 0.12
      model.seal.position.z += 0.2
      model.seal.rotation.x = Math.PI / 2
    }
    for (const motion of motions) {
      // Once planted, Judgment Chain's one blade remains at the heart, not in the hand too.
      if (motion.stage === 4 && model.seal.visible) continue
      model.draw(
        kurapikaChainPath(options, { state, side, motion, tipReach: model.reaches[motion.stage] }),
      )
    }
  }

  return {
    sync: (state) => {
      groups.forEach((group) => syncGroup(group, state))
    },
    dispose: () => {
      groups.forEach(({ model }) => model.dispose())
    },
  }
}
