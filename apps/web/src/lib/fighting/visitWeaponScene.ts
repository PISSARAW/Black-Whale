import { attackData, attackPhase, attackProgress } from './frameData'
import type { ArcadeFighter } from './types'
import { visitAttackSource, createVisitScenePool, freeVisitHand, ownsVisitHatsu, placeVisitHand } from './visitSceneKit'
import type { EffectSceneOptions, FighterEffectScene } from './fighterEffectScene'

/** Shared conjured props follow the actual user's rig, including active page/loan uses. */
export function createVisitWeaponScene(options: EffectSceneOptions): FighterEffectScene {
  const pool = createVisitScenePool(options)
  const up = new options.THREE.Vector3(0, 1, 0)
  const direction = new options.THREE.Vector3()
  return {
    sync(state, seconds) {
      pool.hide()
      for (const side of ['player', 'opponent'] as const) {
        const fighter = state[side]
        if (ownsVisitHatsu(fighter, 'saiyu')) {
          const staff = pool.get(`priest-staff:${side}`, { model: 'priest-staff', fit: { height: 1.8 } })
          placeVisitHand(options, { state, side, root: staff.root,
            hand: freeVisitHand(fighter) })
          staff.root.rotateZ(fighter.facing * staffSwing(fighter))
        }
        const attack = fighter.attack
        if (!attack || visitAttackSource(fighter) !== 'gel' || attack.kind !== 'special') continue
        const snake = pool.get(`gel-snake-arm:${side}`, {
          model: 'snake-arm', climb: 6, anchor: 'floor', fit: { height: 1.05, width: 0.36 },
        })
        placeVisitHand(options, { state, side, root: snake.root })
        const target = state[side === 'player' ? 'opponent' : 'player']
        direction.set(options.worldX(target.x) - snake.root.position.x, 0.03, 0).normalize()
        snake.root.quaternion.setFromUnitVectors(up, direction)
        snake.body.scale.y = armExtension(fighter) + Math.sin(seconds * 10) * 0.025
      }
    },
    dispose: pool.dispose,
  }
}

function staffSwing(fighter: ArcadeFighter): number {
  if (!fighter.attack || visitAttackSource(fighter) !== 'saiyu') return -0.12
  return -0.12 + Math.sin(attackProgress(fighter) * Math.PI) * 1.5
}

function armExtension(fighter: ArcadeFighter): number {
  const attack = fighter.attack!
  const data = attackData(attack.kind, fighter)
  const phase = attackPhase(fighter)
  if (phase === 'startup') return 0.45 + 0.55 * Math.min(1, attack.frame / Math.max(1, data.startup))
  if (phase === 'active') return 1
  const recovery = (attack.frame - data.startup - data.active) / Math.max(1, data.recovery)
  return 1 - Math.min(1, recovery) * 0.65
}
