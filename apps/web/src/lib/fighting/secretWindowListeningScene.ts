import { createVisitHatsuModel } from './visitHatsuModel'
import { physicalBodyAt } from './fightBodyIdentity'
import { sleepingBody } from './hanzoProjection'
import { secretWindowNenActive } from './secretWindowAccess'
import type { EffectSceneOptions, FighterEffectScene } from './fighterEffectScene'
import type { DolphinBodyRef } from './dolphinLoanTypes'
import type { FightState } from './types'

/** Shoulder marker for the private eavesdropping feed; not a contact target or strike. */
export function createSecretWindowListeningScene(options: EffectSceneOptions): FighterEffectScene {
  const birds = (['player', 'opponent'] as const).flatMap((owner) =>
    [0, 1, 2].map((member) => {
      const model = createVisitHatsuModel(options.THREE, { model: 'secret-window' })
      model.fit({ height: 0.34, width: 0.26 })
      model.root.name = `secret-window-listening-${owner}-${member}`
      options.scene.add(model.root)
      return { ref: { owner, member }, model }
    }),
  )
  function syncBird(
    state: FightState,
    bird: { ref: DolphinBodyRef; model: (typeof birds)[number]['model'] },
  ) {
    const actor = physicalBodyAt(state, bird.ref.owner, bird.ref.member)
    bird.model.root.visible = Boolean(
      actor?.secretWindowListening &&
      actor &&
      bird.ref.owner === (options.viewer?.() ?? 'player') &&
      secretWindowNenActive(actor),
    )
    if (!actor) return
    const body = sleepingBody(actor)
    bird.model.root.position.set(
      options.worldX(body.x) - body.facing * 0.35,
      options.worldY(body.y + 10),
      0.2,
    )
  }
  return {
    sync: (state) => birds.forEach((bird) => syncBird(state, bird)),
    dispose: () => birds.forEach(({ model }) => model.dispose()),
  }
}
