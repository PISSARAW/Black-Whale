import type { Scene } from 'three'
import type { HumanFigure } from '$lib/tour/humanFigure'
import { disposeMountedVisitHatsu } from './visitHatsuModel'
import type { ArcadeFighter, FightSide } from './types'

/** Keep model replacement independent of pose memory, which belongs to the scene's actor. */
export function createPresentedModelRefresh(options: {
  scene: Scene
  models: Record<FightSide, { model: HumanFigure; nen: string }>
  nenKey: (fighter: ArcadeFighter) => string
  buildFighter: (fighter: ArcadeFighter) => HumanFigure
}) {
  return (side: FightSide, fighter: ArcadeFighter): HumanFigure => {
    const held = options.models[side]
    const nen = options.nenKey(fighter)
    if (held.nen === nen) return held.model
    disposeMountedVisitHatsu(held.model.root)
    options.scene.remove(held.model.root)
    held.model = options.buildFighter(fighter)
    held.nen = nen
    options.scene.add(held.model.root)
    return held.model
  }
}
