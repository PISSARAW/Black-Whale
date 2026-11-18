import { gyoSight } from './nenPerception'
import { createStealthDolphinScene } from './stealthDolphinScene'
import { createKurapikaChainModel } from './kurapikaChainModel'
import { kurapikaChainMotions } from './kurapikaChainMotion'
import { kurapikaChainPath } from './kurapikaChainPath'
import { poseKurapikaChainHand } from './kurapikaChainHand'
import { chainChest, hideLegacyChain } from './kurapikaChainAnchors'
import { createKurapikaPresentationClock } from './kurapikaPresentation'
import {
  createKurapikaAccentScene,
  kurapikaNenVisible,
  kurapikaVisualSettings,
} from './kurapikaAccentScene'
import { createKurapikaMajorScene } from './kurapikaMajorScene'
import type { EffectSceneOptions, FighterEffectScene } from './fighterEffectScene'
import type { FightSide, FightState } from './types'

/** The visit's five models, attached to the animated right hand instead of the arena origin. */
export function createKurapikaEffectScene(options: EffectSceneOptions): FighterEffectScene {
  const dolphin = createStealthDolphinScene(options)
  const clock = createKurapikaPresentationClock()
  const groups = (['player', 'opponent'] as const).map((side) => {
    const model = createKurapikaChainModel(options.THREE)
    model.root.name = `kurapika-chains:${side}`
    options.scene.add(model.root)
    const actor = { side, model }
    return {
      ...actor,
      accents: createKurapikaAccentScene(options, actor),
      major: createKurapikaMajorScene(options, actor),
    }
  })

  function syncGroup(
    group: (typeof groups)[number],
    state: FightState,
    captureFrame: number | null,
  ) {
    const { side, model } = group
    const targetSide: FightSide = side === 'player' ? 'opponent' : 'player'
    const motions = kurapikaChainMotions(state, side)
    poseKurapikaChainHand(options, { state, side, motions, reaches: model.reaches })
    hideLegacyChain(options, side)
    model.hide()
    model.root.visible = kurapikaNenVisible(options, state, side)
    if (!model.root.visible) return
    model.seal.visible = state[targetSide].judgmentChain?.owner === side
    if (model.seal.visible) {
      model.seal.position.copy(chainChest(options, { state, side: targetSide }))
      model.seal.position.y += 0.12
      model.seal.position.z += 0.2
      model.seal.rotation.x = Math.PI / 2
    }
    for (const motion of motions) {
      if (['dowsing', 'map'].includes(motion.mode) && !dowsingVisible(state, side, options.viewer))
        continue
      // Once planted, Judgment Chain's one blade remains at the heart, not in the hand too.
      if (motion.stage === 4 && model.seal.visible) continue
      model.draw(
        kurapikaChainPath(options, {
          state,
          side,
          motion,
          tipReach: model.reaches[motion.stage],
          captureFrame,
        }),
      )
    }
  }

  return {
    sync: (state, seconds) => {
      dolphin.sync(state, seconds)
      const frames = clock(state)
      groups.forEach((group) => {
        const captureFrame = kurapikaVisualSettings(options).reduced
          ? null
          : frames[group.side].jail
        syncGroup(group, state, captureFrame)
        group.accents.sync(state, frames[group.side])
        group.major.sync(state, frames[group.side])
      })
    },
    dispose: () => {
      dolphin.dispose()
      groups.forEach(({ model, accents, major }) => {
        model.dispose()
        accents.dispose()
        major.dispose()
      })
    },
  }
}

function dowsingVisible(state: FightState, side: FightSide, viewer?: () => FightSide): boolean {
  const shown = viewer?.() ?? 'player'
  return side === shown || !state[side].nen.in || gyoSight(state[shown])
}
