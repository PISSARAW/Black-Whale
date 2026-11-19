import { attackData, attackPhase } from './frameData'
import { visitAttackSource, createVisitScenePool, placeVisitHand } from './visitSceneKit'
import type { EffectSceneOptions, FighterEffectScene } from './fighterEffectScene'

/** A presentation of the existing contact/timing, never an extra projectile or collision. */
export function createHalkenburgArrowScene(options: EffectSceneOptions): FighterEffectScene {
  const pool = createVisitScenePool(options)
  const forward = new options.THREE.Vector3(0, 0, -1)
  const targetPoint = new options.THREE.Vector3()
  const direction = new options.THREE.Vector3()
  return {
    sync(state) {
      pool.hide()
      for (const side of ['player', 'opponent'] as const) {
        const fighter = state[side]
        const attack = fighter.attack
        if (!attack || attack.kind !== 'special' || visitAttackSource(fighter) !== 'halkenburg')
          continue
        const phase = attackPhase(fighter)
        if (phase === 'recovery') continue
        const arrow = pool.get(`halkenburg-arrow:${side}`, {
          model: 'grimmel-arrow',
          fit: { depth: 0.85 },
        })
        arrow.root.userData.visualOnly = true
        placeVisitHand(options, { state, side, root: arrow.root })
        const target = state[side === 'player' ? 'opponent' : 'player']
        targetPoint.set(options.worldX(target.x), options.worldY(target.y) + 1.1, 0.3)
        direction.copy(targetPoint).sub(arrow.root.position)
        if (direction.lengthSq() < 0.0001) direction.set(fighter.facing, 0, 0)
        arrow.root.quaternion.setFromUnitVectors(forward, direction.normalize())
        const data = attackData(attack.kind, fighter)
        const progress = phase === 'active' ? (attack.frame - data.startup + 1) / data.active : 0
        arrow.root.position.lerp(targetPoint, Math.min(1, progress))
      }
    },
    dispose: pool.dispose,
  }
}
