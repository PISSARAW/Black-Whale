import { CROSS_GAME_DISPLAY } from './crossGame'
import { gyoSight, insideEn } from './nenPerception'
import type { EffectSceneOptions, FighterEffectScene } from './fighterEffectScene'
import type { FightSide, FightState } from './types'

/** A yellow card turned over on disobedience, and the rectangular confinement shown in the manga. */
export function createCrossGameScene(options: EffectSceneOptions): FighterEffectScene {
  const { THREE, scene } = options
  const cardGeometry = new THREE.BoxGeometry(0.17, 0.28, 0.015)
  const cardMaterial = new THREE.MeshBasicMaterial({ color: 0xf4cc38 })
  const box = new THREE.BoxGeometry(1.35, 2.4, 0.85)
  const edges = new THREE.EdgesGeometry(box)
  const material = new THREE.LineBasicMaterial({
    color: 0xf4cc38,
    transparent: true,
    opacity: 0.85,
  })
  const effects = (['player', 'opponent'] as const).map((side) => {
    const card = new THREE.Mesh(cardGeometry, cardMaterial)
    const cage = new THREE.LineSegments(edges, material)
    scene.add(card, cage)
    return { side, card, cage }
  })
  return {
    sync: (state) => effects.forEach((effect) => syncCrossGame(options, state, effect)),
    dispose: () => {
      effects.forEach(({ card, cage }) => scene.remove(card, cage))
      cardGeometry.dispose()
      cardMaterial.dispose()
      box.dispose()
      edges.dispose()
      material.dispose()
    },
  }
}

function syncCrossGame(
  options: EffectSceneOptions,
  state: FightState,
  effect: {
    side: FightSide
    card: import('three').Mesh
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
  card.position.set(
    options.worldX(owner.x) + owner.facing * 0.6,
    options.worldY(owner.y) + 1.65,
    0.3,
  )
  const progress = 1 - (owner.crossGameCardFrames ?? 0) / CROSS_GAME_DISPLAY
  card.rotation.y = condition.phase === 'restrained' ? Math.PI * progress : 0
}
