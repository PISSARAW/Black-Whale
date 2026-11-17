import { dolphinVisibleTo } from './dolphinVisibility'
import { createVisitHatsuModel } from './visitHatsuModel'
import type { PreparedEntity } from './preparationTypes'
import type { EffectSceneOptions, FighterEffectScene } from './fighterEffectScene'

type DolphinModel = ReturnType<typeof createVisitHatsuModel>
/** The borrowed device remains equipped through the recipient's linked unconsciousness. */
export function createDolphinPeopleScene(options: EffectSceneOptions): FighterEffectScene {
  const models = new Map<string, DolphinModel>()
  function modelFor(entry: PreparedEntity): DolphinModel {
    const existing = models.get(entry.id)
    if (existing) return existing
    const model = createVisitHatsuModel(options.THREE, { model: 'stealth-dolphin' })
    model.fit({ width: 0.7, height: 0.58 })
    model.root.name = `stealth-dolphin:${entry.id}`
    models.set(entry.id, model)
    options.scene.add(model.root)
    return model
  }
  function pose(model: DolphinModel, entry: PreparedEntity, seconds: number) {
    model.root.visible =
      entry.present &&
      dolphinVisibleTo(
        options.viewer?.() ?? 'player',
        entry.person!.control.side,
        entry.person!.loan,
      )
    const height = entry.person!.loan!.blackoutFrames ? 0.4 : 1.4
    model.root.position.set(
      options.worldX(entry.x) - 0.6,
      options.worldY(entry.y) + height + Math.sin(seconds * 4) * 0.04,
      0.3,
    )
  }
  return {
    sync(state, seconds) {
      const recipients = (state.battlefield?.entities ?? []).filter((entry) => entry.person?.loan)
      for (const entry of recipients) pose(modelFor(entry), entry, seconds)
      for (const [id, model] of models) {
        if (recipients.some((entry) => entry.id === id)) continue
        model.dispose()
        models.delete(id)
      }
    },
    dispose() {
      for (const model of models.values()) model.dispose()
      models.clear()
    },
  }
}
