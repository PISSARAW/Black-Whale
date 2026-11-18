import { attackPhase } from './frameData'
import { visitAttackSource, createVisitScenePool, placeVisitHand } from './visitSceneKit'
import type { EffectSceneOptions, FighterEffectScene } from './fighterEffectScene'

/** The held bow and the released arrow follow the same combat object and trajectory. */
export function createHalkenburgArrowScene(options: EffectSceneOptions): FighterEffectScene {
  const pool = createVisitScenePool(options)
  const forward = new options.THREE.Vector3(0, 0, -1)
  const targetPoint = new options.THREE.Vector3()
  const direction = new options.THREE.Vector3()
  function syncHeld(state: import('./types').FightState) {
    for (const side of ['player', 'opponent'] as const) {
      const fighter = state[side]
      const attack = fighter.attack
      if (!attack || attack.kind !== 'special' || visitAttackSource(fighter) !== 'halkenburg')
        continue
      const phase = attackPhase(fighter)
      if (phase !== 'startup' || attack.projectileSpawned) continue
      const arrow = pool.get(`halkenburg-arrow:${side}`, {
        model: 'grimmel-arrow',
        fit: { depth: 0.85 },
      })
      arrow.root.userData.visualOnly = true
      placeVisitHand(options, { state, side, root: arrow.root })
      const target = state[side === 'player' ? 'opponent' : 'player']
      targetPoint.set(
        options.worldX(target.x),
        options.worldY(target.y) + (fighter.halkSoulLowShot ? 0.4 : 1.1),
        0.3,
      )
      direction.copy(targetPoint).sub(arrow.root.position)
      if (direction.lengthSq() < 0.0001) direction.set(fighter.facing, 0, 0)
      arrow.root.quaternion.setFromUnitVectors(forward, direction.normalize())
    }
  }
  return {
    sync(state) {
      pool.hide()
      syncHeld(state)
      for (const shot of state.projectiles) {
        if (!shot.halkenburgArrow) continue
        const arrow = pool.get(`halkenburg-shot:${shot.id}`, {
          model: 'grimmel-arrow',
          fit: { depth: 0.85 },
        })
        arrow.root.position.set(options.worldX(shot.x), options.worldY(shot.y), 0.3)
        direction.set(Math.sign(shot.velocityX), 0, 0)
        arrow.root.quaternion.setFromUnitVectors(forward, direction)
        const generic = options.scene.getObjectByName(`fight-projectile:${shot.id}`)
        if (generic) generic.visible = false
      }
    },
    dispose: pool.dispose,
  }
}
