import { buildCrossGameCage } from '$lib/tour/crossGameCageModel'
import { placeVisitHand, freeVisitHand } from './visitSceneKit'
import { createVisitHatsuModel } from './visitHatsuModel'
import { CROSS_GAME_DISPLAY } from './crossGame'
import { gyoSight, insideEn } from './nenPerception'
import type { EffectSceneOptions, FighterEffectScene } from './fighterEffectScene'
import type { FightSide, FightState } from './types'

/** A yellow card turned over on disobedience, and the rectangular confinement shown in the manga. */
export function createCrossGameScene(options: EffectSceneOptions): FighterEffectScene {
  const { THREE, scene } = options
  const lattice = buildCrossGameCage(THREE)
  const effects = (['player', 'opponent'] as const).map((side) => {
    const model = createVisitHatsuModel(THREE, { model: 'cross-game-card', stage: 1 })
    const card = model.fit({ height: 0.28, width: 0.19 })
    const cage = lattice.clone()
    card.name = `cross-game-card:${side}`
    cage.name = `cross-game-cage:${side}`
    scene.add(card, cage)
    return { side, card, cage, model }
  })
  return {
    sync: (state) => effects.forEach((effect) => syncCrossGame(options, state, effect)),
    dispose: () => {
      effects.forEach(({ model, cage }) => {
        model.dispose()
        scene.remove(cage)
      })
      lattice.geometry.dispose()
      lattice.material.dispose()
    },
  }
}

function syncCrossGame(
  options: EffectSceneOptions,
  state: FightState,
  effect: {
    side: FightSide
    card: import('three').Group
    cage: import('three').LineSegments
  },
): void {
  const { side, card, cage } = effect
  const target = state[side]
  const condition = target.crossGame
  card.visible = false
  cage.visible = false
  if (!condition) return
  const owner = state[condition.owner]
  const concealed = condition.owner !== 'player' && owner.nen.in && !gyoSight(state.player)
  cage.visible = condition.phase === 'restrained' && (!concealed || insideEn(state.player, target))
  cage.position.set(options.worldX(condition.x), options.worldY(condition.y) + 1.15, 0)
  card.visible = (owner.crossGameCardFrames ?? 0) > 0
  placeVisitHand(options, { state, side: condition.owner, root: card, hand: freeVisitHand(owner) })
  card.position.z += 0.08
  const progress = 1 - (owner.crossGameCardFrames ?? 0) / CROSS_GAME_DISPLAY
  card.rotateY(condition.phase === 'restrained' ? Math.PI * progress : 0)
}
